import os
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def _float_env(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _mongodb_uri() -> str:
    raw = os.getenv("MONGODB_URI", "").strip()
    if not raw:
        return ""
    try:
        parts = urlsplit(raw)
        path = "/" if parts.path == "//" else parts.path
        return urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))
    except ValueError:
        return raw


@dataclass(frozen=True)
class Settings:
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    weatherapi_key: str = os.getenv("WEATHERAPI_KEY", "").strip()
    mongodb_uri: str = field(default_factory=_mongodb_uri)
    mongodb_database: str = os.getenv("MONGODB_DATABASE", "rice_disease").strip()
    cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
    cloudinary_api_key: str = os.getenv("CLOUDINARY_API_KEY", "").strip()
    cloudinary_api_secret: str = os.getenv("CLOUDINARY_API_SECRET", "").strip()
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "").strip()
    jwt_access_token_minutes: int = _int_env("JWT_ACCESS_TOKEN_MINUTES", 15)
    jwt_refresh_token_days: int = _int_env("JWT_REFRESH_TOKEN_DAYS", 7)
    cookie_secure: bool = _bool_env("COOKIE_SECURE", False)
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")
    password_reset_minutes: int = _int_env("PASSWORD_RESET_MINUTES", 20)
    password_reset_console: bool = _bool_env("PASSWORD_RESET_CONSOLE", True)
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port: int = _int_env("SMTP_PORT", 587)
    smtp_username: str = os.getenv(
        "SMTP_USERNAME", "paddyscan.lk@gmail.com"
    ).strip()
    smtp_password: str = os.getenv("SMTP_PASSWORD", "").strip().replace(" ", "")
    smtp_from: str = os.getenv(
        "SMTP_FROM", "PaddyScan <paddyscan.lk@gmail.com>"
    ).strip()
    smtp_starttls: bool = _bool_env("SMTP_STARTTLS", True)
    smtp_use_ssl: bool = _bool_env("SMTP_USE_SSL", False)
    detector_path: Path = BASE_DIR / "trained_models" / "detection" / "best.pt"
    classifier_path: Path = (
        BASE_DIR / "trained_models" / "classification" / "best_resnet18.pth"
    )
    classes_path: Path = (
        BASE_DIR / "trained_models" / "classification" / "classes.json"
    )
    max_upload_bytes: int = 10 * 1024 * 1024
    max_prediction_photos: int = 5
    leaf_detection_confidence: float = _float_env("LEAF_DETECTION_CONFIDENCE", 0.70)
    min_leaf_area_ratio: float = _float_env("MIN_LEAF_AREA_RATIO", 0.03)
    min_leaf_colour_ratio: float = _float_env("MIN_LEAF_COLOUR_RATIO", 0.08)
    min_coherent_leaf_ratio: float = _float_env("MIN_COHERENT_LEAF_RATIO", 0.03)
    allowed_content_types: frozenset[str] = frozenset(
        {"image/jpeg", "image/png", "image/webp"}
    )
    cors_origins: list[str] = field(default_factory=_cors_origins)

    @property
    def cloudinary_ready(self) -> bool:
        return all(
            (
                self.cloudinary_cloud_name,
                self.cloudinary_api_key,
                self.cloudinary_api_secret,
            )
        )

    @property
    def smtp_ready(self) -> bool:
        encryption_is_valid = self.smtp_starttls != self.smtp_use_ssl
        return bool(
            self.smtp_host
            and self.smtp_port
            and self.smtp_username
            and self.smtp_password
            and self.smtp_from
            and encryption_is_valid
        )


settings = Settings()
