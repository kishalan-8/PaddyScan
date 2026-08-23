import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from config import settings
from services.database import database


password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, encoded: str) -> bool:
    return password_hash.verify(password, encoded)


def _require_jwt_secret() -> str:
    if len(settings.jwt_secret_key) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="JWT_SECRET_KEY must contain at least 32 characters.",
        )
    return settings.jwt_secret_key


def create_token(user_id: str, token_type: str) -> tuple[str, str, datetime]:
    now = datetime.now(timezone.utc)
    if token_type == "access":
        expires = now + timedelta(minutes=settings.jwt_access_token_minutes)
    else:
        expires = now + timedelta(days=settings.jwt_refresh_token_days)
    jti = uuid4().hex
    encoded = jwt.encode(
        {
            "sub": user_id,
            "type": token_type,
            "jti": jti,
            "iat": now,
            "exp": expires,
        },
        _require_jwt_secret(),
        algorithm="HS256",
    )
    return encoded, jti, expires


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, _require_jwt_secret(), algorithms=["HS256"])
        if payload.get("type") != expected_type or not payload.get("sub"):
            raise InvalidTokenError("Incorrect token type")
        return payload
    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def token_fingerprint(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "fullName": user["full_name"],
        "farmName": user.get("farm_name", ""),
        "district": user.get("district", ""),
        "createdAt": user["created_at"],
    }


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict[str, Any] | None:
    if credentials is None:
        return None
    payload = decode_token(credentials.credentials, "access")
    try:
        db = database.require()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    from bson import ObjectId

    try:
        user_id = ObjectId(payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid account identifier.") from exc
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="This account no longer exists.")
    return user


async def get_current_user(
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> dict[str, Any]:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
