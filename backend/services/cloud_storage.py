import copy
import logging
from io import BytesIO
from typing import Any
from uuid import uuid4

import cloudinary
import cloudinary.uploader

from config import settings


logger = logging.getLogger(__name__)


class CloudStorageError(RuntimeError):
    pass


class CloudStorageService:
    def __init__(self) -> None:
        if settings.cloudinary_ready:
            cloudinary.config(
                cloud_name=settings.cloudinary_cloud_name,
                api_key=settings.cloudinary_api_key,
                api_secret=settings.cloudinary_api_secret,
                secure=True,
            )

    @property
    def ready(self) -> bool:
        return settings.cloudinary_ready

    @staticmethod
    def _asset(response: dict[str, Any]) -> dict[str, Any]:
        return {
            "publicId": response["public_id"],
            "secureUrl": response["secure_url"],
            "width": response.get("width"),
            "height": response.get("height"),
            "format": response.get("format"),
            "bytes": response.get("bytes"),
        }

    def store_prediction_set(
        self,
        images: list[tuple[bytes, str | None, int]],
        prediction: dict[str, Any],
    ) -> tuple[dict[str, Any], list[str]]:
        if not self.ready:
            raise CloudStorageError("Cloudinary credentials are not configured.")

        detection_key = uuid4().hex
        uploaded_ids: list[str] = []
        stored = copy.deepcopy(prediction)
        source_images: list[dict[str, Any]] = []

        try:
            for position, (image_bytes, filename, photo_index) in enumerate(images):
                response = cloudinary.uploader.upload(
                    BytesIO(image_bytes),
                    folder="rice-disease/original",
                    public_id=f"{detection_key}-{position + 1}",
                    resource_type="image",
                    overwrite=False,
                    filename_override=filename or f"rice-leaf-{position + 1}",
                )
                uploaded_ids.append(response["public_id"])
                source_images.append(
                    {"photoIndex": photo_index, **self._asset(response)}
                )

            stored["sourceImages"] = source_images
            primary_index = stored.get("primaryPhotoIndex", source_images[0]["photoIndex"])
            primary = next(
                (asset for asset in source_images if asset["photoIndex"] == primary_index),
                source_images[0],
            )
            stored["originalImage"] = {
                key: value for key, value in primary.items() if key != "photoIndex"
            }
            return stored, uploaded_ids
        except Exception as exc:
            logger.exception("Cloudinary field prediction upload failed")
            self.delete_assets(uploaded_ids)
            raise CloudStorageError("Prediction images could not be stored in Cloudinary.") from exc

    @staticmethod
    def delete_assets(public_ids: list[str]) -> None:
        for public_id in public_ids:
            try:
                cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
            except Exception:
                logger.exception("Could not delete Cloudinary asset %s", public_id)


cloud_storage = CloudStorageService()
