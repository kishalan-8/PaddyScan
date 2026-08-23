from fastapi import APIRouter, HTTPException, Query, status

from services.weather import (
    WeatherConfigError,
    WeatherProviderError,
    weather_service,
)


router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("")
def weather(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
) -> dict:
    try:
        return weather_service.forecast(latitude, longitude)
    except WeatherConfigError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except WeatherProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/locations")
def locations(query: str = Query(min_length=2, max_length=80)) -> list[dict]:
    try:
        return weather_service.search(query)
    except WeatherConfigError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except WeatherProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
