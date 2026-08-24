from fastapi import APIRouter

from config import settings
from services.cloud_storage import cloud_storage
from services.database import database
from services.farming_assistant import farming_assistant
from services.inference import inference_service


router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "modelsReady": inference_service.models_ready,
        "models": inference_service.model_status(),
        "weather": {
            "ready": bool(settings.weatherapi_key),
            "provider": "WeatherAPI.com",
        },
        "assistant": {
            "ready": farming_assistant.ready,
            "provider": "Google Gemini",
            "model": settings.gemini_model,
            "sources": ["RRDI", "IRRI"],
        },
        "database": database.status(),
        "cloudinary": {"ready": cloud_storage.ready},
        "email": {
            "ready": settings.smtp_ready,
            "provider": "Gmail SMTP",
        },
    }
