import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from config import settings
from services.authentication import get_optional_user
from services.cloud_storage import cloud_storage
from services.database import database
from services.inference import ModelLoadError, NoPaddyLeafError, inference_service
from utils.image_validation import ImageValidationError, validate_image


router = APIRouter(prefix="/predict", tags=["prediction"])
logger = logging.getLogger(__name__)


def _public_photo_result(
    prediction: dict[str, Any], input_index: int, filename: str | None
) -> dict[str, Any]:
    return {
        "inputIndex": input_index,
        "filename": filename or f"Photo {input_index + 1}",
        "accepted": True,
        **{
            key: value
            for key, value in prediction.items()
            if key != "classProbabilities"
        },
    }


def _aggregate_predictions(entries: list[dict[str, Any]], photo_count: int) -> dict[str, Any]:
    valid = [entry for entry in entries if entry["accepted"]]
    distributions = [entry["_classProbabilities"] for entry in valid]
    diseases = list(distributions[0])
    averaged = {
        disease: sum(values[disease] for values in distributions) / len(distributions)
        for disease in diseases
    }
    ranked = sorted(averaged.items(), key=lambda item: item[1], reverse=True)
    winner = ranked[0][0]

    matching = [entry for entry in valid if entry["disease"] == winner]
    primary = max(
        matching or valid,
        key=lambda entry: entry["classificationConfidence"],
    )
    consensus_count = len(matching)

    return {
        "disease": winner,
        "classificationConfidence": round(ranked[0][1], 6),
        "detectionConfidence": round(
            sum(entry["detectionConfidence"] for entry in valid) / len(valid), 6
        ),
        "leafDetected": True,
        "boundingBox": primary["boundingBox"],
        "imageSize": primary["imageSize"],
        "topPredictions": [
            {"disease": disease, "confidence": round(confidence, 6)}
            for disease, confidence in ranked[:3]
        ],
        "photoCount": photo_count,
        "analyzedPhotoCount": len(valid),
        "rejectedPhotoCount": photo_count - len(valid),
        "isMultiPhoto": photo_count > 1,
        "consensusCount": consensus_count,
        "consensusRatio": round(consensus_count / len(valid), 6),
        "primaryPhotoIndex": primary["inputIndex"],
        "photos": [
            {key: value for key, value in entry.items() if key != "_classProbabilities"}
            for entry in entries
        ],
    }


async def _read_upload(upload: UploadFile) -> tuple[bytes, Any]:
    try:
        if upload.content_type not in settings.allowed_content_types:
            raise ImageValidationError("Use a JPEG, PNG, or WebP image.")
        contents = await upload.read(settings.max_upload_bytes + 1)
    finally:
        await upload.close()
    if len(contents) > settings.max_upload_bytes:
        raise ImageValidationError("The image is larger than the 10 MB limit.")
    return contents, validate_image(contents)


async def _save_prediction(
    user: dict,
    valid_uploads: list[tuple[bytes, str | None, int]],
    result: dict[str, Any],
) -> dict[str, Any]:
    uploaded_ids: list[str] = []
    try:
        stored, uploaded_ids = await run_in_threadpool(
            cloud_storage.store_prediction_set,
            valid_uploads,
            result,
        )
        created_at = datetime.now(timezone.utc)
        document = {
            "user_id": user["_id"],
            "result": stored,
            "asset_public_ids": uploaded_ids,
            "notes": [],
            "created_at": created_at,
        }
        insert_result = await database.require().detections.insert_one(document)
        stored.update(
            {
                "historyId": str(insert_result.inserted_id),
                "savedToHistory": True,
                "createdAt": created_at,
                "notes": [],
            }
        )
        return stored
    except Exception as exc:
        if uploaded_ids:
            await run_in_threadpool(cloud_storage.delete_assets, uploaded_ids)
        logger.exception("Prediction completed but history storage failed")
        return {
            **result,
            "savedToHistory": False,
            "historySaveError": str(exc),
        }


@router.post("")
async def predict(
    files: list[UploadFile] | None = File(default=None),
    file: UploadFile | None = File(default=None),
    user: dict | None = Depends(get_optional_user),
) -> dict:
    uploads = list(files or [])
    if file is not None:
        uploads.append(file)
    if not uploads:
        raise HTTPException(status_code=422, detail="Choose at least one rice-leaf photo.")
    if len(uploads) > settings.max_prediction_photos:
        raise HTTPException(
            status_code=422,
            detail=f"Choose no more than {settings.max_prediction_photos} photos per field check.",
        )

    entries: list[dict[str, Any]] = []
    valid_uploads: list[tuple[bytes, str | None, int]] = []
    try:
        for input_index, upload in enumerate(uploads):
            filename = upload.filename
            try:
                contents, image = await _read_upload(upload)
                prediction = await run_in_threadpool(inference_service.predict, image)
                photo = _public_photo_result(prediction, input_index, filename)
                photo["_classProbabilities"] = prediction["classProbabilities"]
                entries.append(photo)
                valid_uploads.append((contents, filename, input_index))
            except (ImageValidationError, NoPaddyLeafError) as exc:
                entries.append(
                    {
                        "inputIndex": input_index,
                        "filename": filename or f"Photo {input_index + 1}",
                        "accepted": False,
                        "error": str(exc),
                    }
                )

        if not valid_uploads:
            detail = entries[0]["error"] if len(entries) == 1 else (
                "None of the photos contained a clearly detected paddy leaf. "
                "Use close, well-lit photos and try again."
            )
            raise HTTPException(status_code=422, detail=detail)

        result = _aggregate_predictions(entries, len(uploads))
        if user is None:
            result["savedToHistory"] = False
            return result

        return await _save_prediction(user, valid_uploads, result)
    except HTTPException:
        raise
    except ModelLoadError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(
            status_code=500,
            detail="The photos could not be analyzed. Check the backend console for details.",
        ) from exc
