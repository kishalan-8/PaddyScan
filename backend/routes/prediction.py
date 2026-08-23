import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from config import settings
from services.authentication import get_optional_user
from services.cloud_storage import cloud_storage
from services.database import database
from services.inference import ModelLoadError, NoPaddyLeafError, inference_service
from utils.image_validation import ImageValidationError, validate_image


router = APIRouter(prefix="/predict", tags=["prediction"])
logger = logging.getLogger(__name__)


@router.post("")
async def predict(
    file: UploadFile = File(...),
    user: dict | None = Depends(get_optional_user),
) -> dict:
    if file.content_type not in settings.allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Use a JPEG, PNG, or WebP image.",
        )

    contents = await file.read(settings.max_upload_bytes + 1)
    await file.close()

    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The image is larger than the 10 MB limit.",
        )

    try:
        image = validate_image(contents)
    except ImageValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        # ML inference is blocking work. Keep it off FastAPI's async event loop
        # and pass the normalized image directly to avoid temporary disk I/O.
        prediction = await run_in_threadpool(inference_service.predict, image)

        if user is None:
            prediction["savedToHistory"] = False
            return prediction

        uploaded_ids: list[str] = []
        try:
            stored_prediction, uploaded_ids = await run_in_threadpool(
                cloud_storage.store_prediction,
                contents,
                file.filename,
                prediction,
            )
            db = database.require()
            document = {
                "user_id": user["_id"],
                "result": stored_prediction,
                "asset_public_ids": uploaded_ids,
                "notes": [],
                "created_at": datetime.now(timezone.utc),
            }
            insert_result = await db.detections.insert_one(document)
            stored_prediction["historyId"] = str(insert_result.inserted_id)
            stored_prediction["savedToHistory"] = True
            stored_prediction["createdAt"] = document["created_at"]
            stored_prediction["notes"] = []
            return stored_prediction
        except Exception as exc:
            if uploaded_ids:
                await run_in_threadpool(cloud_storage.delete_assets, uploaded_ids)
            logger.exception("Prediction completed but history storage failed")
            prediction["savedToHistory"] = False
            prediction["historySaveError"] = str(exc)
            return prediction
    except ModelLoadError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NoPaddyLeafError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500,
            detail="The image could not be analyzed. Check the backend console for details.",
        ) from exc
