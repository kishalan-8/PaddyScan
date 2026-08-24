from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError


class ImageValidationError(ValueError):
    pass


SUPPORTED_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_image(contents: bytes) -> Image.Image:
    if not contents:
        raise ImageValidationError("The uploaded image is empty.")

    try:
        with Image.open(BytesIO(contents)) as candidate:
            detected_format = candidate.format
            candidate.verify()

        if detected_format not in SUPPORTED_FORMATS:
            raise ImageValidationError("Use a JPEG, PNG, or WebP image.")

        with Image.open(BytesIO(contents)) as candidate:
            image = ImageOps.exif_transpose(candidate).convert("RGB")
            image.load()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise ImageValidationError("The selected file is not a valid image.") from exc

    if image.width < 32 or image.height < 32:
        raise ImageValidationError("The image must be at least 32 × 32 pixels.")
    if image.width * image.height > 40_000_000:
        raise ImageValidationError("The image dimensions are too large (40 megapixels maximum).")

    return image
