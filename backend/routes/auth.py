import logging
import secrets
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, HTTPException, Response, status
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError
from starlette.concurrency import run_in_threadpool

from config import settings
from services.authentication import (
    create_token,
    decode_token,
    get_current_user,
    hash_password,
    public_user,
    token_fingerprint,
    verify_password,
)
from services.database import database
from services.email_service import send_password_reset_email


router = APIRouter(prefix="/auth", tags=["authentication"])
REFRESH_COOKIE = "paddyscan_refresh"
logger = logging.getLogger(__name__)


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(alias="fullName", min_length=2, max_length=80)
    farm_name: str = Field(default="", alias="farmName", max_length=100)
    district: str = Field(default="", max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)
    new_password: str = Field(alias="newPassword", min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(alias="currentPassword", min_length=1, max_length=128)
    new_password: str = Field(alias="newPassword", min_length=8, max_length=128)


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(alias="fullName", min_length=2, max_length=80)


def _db():
    try:
        return database.require()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=settings.jwt_refresh_token_days * 24 * 60 * 60,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path="/api/auth",
    )


async def _start_session(response: Response, user: dict) -> dict:
    db = _db()
    user_id = str(user["_id"])
    access_token, _, _ = create_token(user_id, "access")
    refresh_token, refresh_jti, refresh_expiry = create_token(user_id, "refresh")
    await db.refresh_tokens.insert_one(
        {
            "jti": refresh_jti,
            "user_id": user["_id"],
            "fingerprint": token_fingerprint(refresh_token),
            "expires_at": refresh_expiry,
            "created_at": datetime.now(timezone.utc),
        }
    )
    _set_refresh_cookie(response, refresh_token)
    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "expiresIn": settings.jwt_access_token_minutes * 60,
        "user": public_user(user),
    }


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, response: Response) -> dict:
    db = _db()
    now = datetime.now(timezone.utc)
    full_name = payload.full_name.strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=422, detail="Enter a valid full name.")
    user = {
        "email": str(payload.email).strip().lower(),
        "password_hash": hash_password(payload.password),
        "full_name": full_name,
        "farm_name": payload.farm_name.strip(),
        "district": payload.district.strip(),
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = await db.users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An account already uses this email address.") from exc
    user["_id"] = result.inserted_id
    return await _start_session(response, user)


@router.post("/login")
async def login(payload: LoginRequest, response: Response) -> dict:
    db = _db()
    user = await db.users.find_one({"email": str(payload.email).strip().lower()})
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="The email or password is incorrect.")
    return await _start_session(response, user)


@router.post("/refresh")
async def refresh_session(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
) -> dict:
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh session was found.")
    payload = decode_token(refresh_token, "refresh")
    db = _db()
    # Consume the refresh session atomically. This prevents two concurrent
    # requests from rotating the same token into competing sessions.
    session = await db.refresh_tokens.find_one_and_delete(
        {
            "jti": payload.get("jti"),
            "fingerprint": token_fingerprint(refresh_token),
        }
    )
    if session is None:
        raise HTTPException(status_code=401, detail="This refresh session is no longer active.")

    try:
        user_id = ObjectId(payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid account identifier.") from exc
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="This account no longer exists.")

    return await _start_session(response, user)


async def _prepare_password_reset(email: str) -> None:
    """Create and deliver a reset after the generic public response is sent."""
    try:
        db = database.require()
        user = await db.users.find_one({"email": email})
        if user is None:
            return

        raw_token = secrets.token_urlsafe(48)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=settings.password_reset_minutes)
        await db.password_reset_tokens.delete_many({"user_id": user["_id"]})
        await db.password_reset_tokens.insert_one(
            {
                "user_id": user["_id"],
                "token_hash": token_fingerprint(raw_token),
                "created_at": now,
                "expires_at": expires_at,
            }
        )

        reset_url = f"{settings.frontend_url}/reset-password?token={raw_token}"
        if settings.smtp_ready:
            await run_in_threadpool(
                send_password_reset_email,
                user["email"],
                reset_url,
            )
        elif settings.password_reset_console:
            logger.warning(
                "LOCAL PASSWORD RESET for %s (expires in %s minutes): %s",
                user["email"],
                settings.password_reset_minutes,
                reset_url,
            )
        else:
            logger.error(
                "Password reset requested for %s, but neither SMTP nor console delivery is enabled.",
                user["email"],
            )
    except Exception:
        logger.exception("Password-reset preparation or delivery failed")


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, str]:
    """Return uniformly, then prepare and deliver a reset in the background."""
    generic_message = (
        "If an account uses that email, a password-reset link will be sent."
    )
    email = str(payload.email).strip().lower()
    background_tasks.add_task(_prepare_password_reset, email)
    delivery_mode = "email" if settings.smtp_ready else "console"
    return {"message": generic_message, "deliveryMode": delivery_mode}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, response: Response) -> dict[str, str]:
    db = _db()
    now = datetime.now(timezone.utc)
    token_hash = token_fingerprint(payload.token)
    reset_record = await db.password_reset_tokens.find_one(
        {"token_hash": token_hash, "expires_at": {"$gt": now}}
    )
    if reset_record is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    user = await db.users.find_one({"_id": reset_record["user_id"]})
    if user is None:
        await db.password_reset_tokens.delete_one({"_id": reset_record["_id"]})
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")
    if verify_password(payload.new_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Choose a password you have not already used.")

    consumed = await db.password_reset_tokens.delete_one(
        {"_id": reset_record["_id"], "token_hash": token_hash}
    )
    if consumed.deleted_count == 0:
        raise HTTPException(status_code=400, detail="This reset link has already been used.")

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": hash_password(payload.new_password),
                "updated_at": now,
            }
        },
    )
    await db.refresh_tokens.delete_many({"user_id": user["_id"]})
    response.delete_cookie(key=REFRESH_COOKIE, path="/api/auth")
    return {"message": "Your password has been reset. You can now sign in."}


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    response: Response,
    user: dict = Depends(get_current_user),
) -> dict:
    if not verify_password(payload.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Your current password is incorrect.")
    if verify_password(payload.new_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Your new password must be different.")

    db = _db()
    new_password_hash = hash_password(payload.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    await db.password_reset_tokens.delete_many({"user_id": user["_id"]})
    await db.refresh_tokens.delete_many({"user_id": user["_id"]})
    user["password_hash"] = new_password_hash
    return await _start_session(response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
) -> None:
    if refresh_token:
        try:
            payload = decode_token(refresh_token, "refresh")
            await _db().refresh_tokens.delete_one({"jti": payload.get("jti")})
        except HTTPException:
            pass
    response.delete_cookie(key=REFRESH_COOKIE, path="/api/auth")


@router.get("/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return public_user(user)


@router.patch("/me")
async def update_profile(
    payload: UpdateProfileRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    full_name = payload.full_name.strip()
    if len(full_name) < 2:
        raise HTTPException(status_code=422, detail="Enter a valid full name.")

    changes = {
        "full_name": full_name,
        "updated_at": datetime.now(timezone.utc),
    }
    await _db().users.update_one({"_id": user["_id"]}, {"$set": changes})
    user.update(changes)
    return public_user(user)
