from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routes.assistant import router as assistant_router
from routes.auth import router as auth_router
from routes.health import router as health_router
from routes.history import router as history_router
from routes.prediction import router as prediction_router
from routes.weather import router as weather_router
from services.database import database
from services.inference import inference_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Warm the models when weights are available. A missing model should not
    # prevent the API from starting; /api/health reports what still needs copying.
    inference_service.load_if_available()
    await database.connect()
    yield
    await database.close()


app = FastAPI(
    title="Rice Disease Detection API",
    description=(
        "YOLOv10 paddy-leaf validation followed by ResNet18 disease classification."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(prediction_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(history_router, prefix="/api")


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"message": "Rice Disease Detection API", "docs": "/docs"}
