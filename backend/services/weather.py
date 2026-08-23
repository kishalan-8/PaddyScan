import threading
import time
from typing import Any

import httpx

from config import settings


WEATHER_API_URL = "https://api.weatherapi.com/v1"
FORECAST_CACHE_SECONDS = 10 * 60
SEARCH_CACHE_SECONDS = 24 * 60 * 60


class WeatherConfigError(RuntimeError):
    """Raised when the WeatherAPI integration has not been configured."""


class WeatherProviderError(RuntimeError):
    """Raised when WeatherAPI cannot return a usable response."""


class WeatherService:
    def __init__(self) -> None:
        self._cache: dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def _require_key(self) -> str:
        if not settings.weatherapi_key:
            raise WeatherConfigError(
                "Weather is not configured. Add WEATHERAPI_KEY to backend/.env and restart the API."
            )
        return settings.weatherapi_key

    def _cached(self, key: str) -> Any | None:
        with self._lock:
            cached = self._cache.get(key)
            if not cached:
                return None
            expires_at, value = cached
            if expires_at <= time.monotonic():
                self._cache.pop(key, None)
                return None
            return value

    def _store(self, key: str, value: Any, lifetime: int) -> Any:
        with self._lock:
            self._cache[key] = (time.monotonic() + lifetime, value)
        return value

    def _get(self, endpoint: str, params: dict[str, Any]) -> Any:
        safe_params = {**params, "key": self._require_key()}
        try:
            with httpx.Client(timeout=12.0) as client:
                response = client.get(f"{WEATHER_API_URL}/{endpoint}", params=safe_params)
                payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise WeatherProviderError(
                "The weather provider could not be reached. Please try again shortly."
            ) from exc

        if response.status_code >= 400 or not isinstance(payload, (dict, list)):
            raise WeatherProviderError(
                "Weather data is temporarily unavailable for this location."
            )
        return payload

    def forecast(self, latitude: float, longitude: float) -> dict[str, Any]:
        cache_key = f"forecast:{latitude:.3f}:{longitude:.3f}"
        cached = self._cached(cache_key)
        if cached is not None:
            return cached

        payload = self._get(
            "forecast.json",
            {
                "q": f"{latitude:.5f},{longitude:.5f}",
                "days": 3,
                "aqi": "yes",
                "alerts": "yes",
            },
        )
        normalized = self._normalise_forecast(payload)
        return self._store(cache_key, normalized, FORECAST_CACHE_SECONDS)

    def search(self, query: str) -> list[dict[str, Any]]:
        cleaned = " ".join(query.split())
        cache_key = f"search:{cleaned.casefold()}"
        cached = self._cached(cache_key)
        if cached is not None:
            return cached

        payload = self._get("search.json", {"q": cleaned})
        results = [
            {
                "name": place.get("name", "Unknown place"),
                "detail": ", ".join(
                    item
                    for item in (place.get("region"), place.get("country"))
                    if item
                ),
                "latitude": place.get("lat"),
                "longitude": place.get("lon"),
            }
            for place in payload[:6]
        ]
        return self._store(cache_key, results, SEARCH_CACHE_SECONDS)

    @staticmethod
    def _condition(value: dict[str, Any] | None) -> dict[str, Any]:
        value = value or {}
        return {
            "text": value.get("text", "Unknown conditions"),
            "code": value.get("code", 1006),
        }

    @classmethod
    def _normalise_hour(cls, hour: dict[str, Any]) -> dict[str, Any]:
        return {
            "time": hour.get("time"),
            "epoch": hour.get("time_epoch"),
            "temperatureC": hour.get("temp_c"),
            "feelsLikeC": hour.get("feelslike_c"),
            "humidity": hour.get("humidity"),
            "rainChance": hour.get("chance_of_rain", 0),
            "precipitationMm": hour.get("precip_mm", 0),
            "windKph": hour.get("wind_kph", 0),
            "windDegree": hour.get("wind_degree", 0),
            "gustKph": hour.get("gust_kph", 0),
            "cloud": hour.get("cloud", 0),
            "uv": hour.get("uv", 0),
            "isDay": bool(hour.get("is_day", 1)),
            "condition": cls._condition(hour.get("condition")),
        }

    @classmethod
    def _normalise_forecast(cls, payload: dict[str, Any]) -> dict[str, Any]:
        location = payload.get("location", {})
        current = payload.get("current", {})
        air = current.get("air_quality") or {}
        forecast_days = payload.get("forecast", {}).get("forecastday", [])
        alerts = payload.get("alerts", {}).get("alert", [])

        return {
            "provider": "WeatherAPI.com",
            "location": {
                "name": location.get("name", "Current field"),
                "region": location.get("region", ""),
                "country": location.get("country", ""),
                "latitude": location.get("lat"),
                "longitude": location.get("lon"),
                "timezone": location.get("tz_id", ""),
                "localTime": location.get("localtime"),
            },
            "current": {
                "lastUpdated": current.get("last_updated"),
                "lastUpdatedEpoch": current.get("last_updated_epoch"),
                "temperatureC": current.get("temp_c"),
                "feelsLikeC": current.get("feelslike_c"),
                "humidity": current.get("humidity"),
                "precipitationMm": current.get("precip_mm", 0),
                "windKph": current.get("wind_kph", 0),
                "windDegree": current.get("wind_degree", 0),
                "windDirection": current.get("wind_dir", ""),
                "gustKph": current.get("gust_kph", 0),
                "pressureMb": current.get("pressure_mb"),
                "visibilityKm": current.get("vis_km"),
                "cloud": current.get("cloud", 0),
                "uv": current.get("uv", 0),
                "isDay": bool(current.get("is_day", 1)),
                "condition": cls._condition(current.get("condition")),
                "airQuality": {
                    "pm25": air.get("pm2_5"),
                    "pm10": air.get("pm10"),
                    "epaIndex": air.get("us-epa-index"),
                },
            },
            "forecastDays": [
                {
                    "date": entry.get("date"),
                    "dateEpoch": entry.get("date_epoch"),
                    "summary": {
                        "maxC": entry.get("day", {}).get("maxtemp_c"),
                        "minC": entry.get("day", {}).get("mintemp_c"),
                        "averageHumidity": entry.get("day", {}).get("avghumidity"),
                        "totalPrecipitationMm": entry.get("day", {}).get("totalprecip_mm"),
                        "rainChance": entry.get("day", {}).get("daily_chance_of_rain", 0),
                        "uv": entry.get("day", {}).get("uv", 0),
                        "condition": cls._condition(entry.get("day", {}).get("condition")),
                    },
                    "astro": {
                        "sunrise": entry.get("astro", {}).get("sunrise"),
                        "sunset": entry.get("astro", {}).get("sunset"),
                    },
                    "hours": [cls._normalise_hour(hour) for hour in entry.get("hour", [])],
                }
                for entry in forecast_days
            ],
            "alerts": [
                {
                    "headline": alert.get("headline"),
                    "severity": alert.get("severity"),
                    "event": alert.get("event"),
                    "effective": alert.get("effective"),
                    "expires": alert.get("expires"),
                    "description": alert.get("desc"),
                    "instruction": alert.get("instruction"),
                }
                for alert in alerts[:3]
            ],
        }


weather_service = WeatherService()
