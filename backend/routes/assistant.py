from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from data.assistant_knowledge import SOURCES
from services.farming_assistant import (
    AssistantConfigError,
    AssistantProviderError,
    farming_assistant,
)


router = APIRouter(prefix="/assistant", tags=["farming assistant"])


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1200)
    language: Literal["en", "si", "ta"] = "en"
    history: list[ConversationMessage] = Field(default_factory=list, max_length=8)


@router.get("/sources")
def list_sources() -> dict:
    return {"sources": [{"id": source_id, **source} for source_id, source in SOURCES.items()]}


@router.post("/chat")
async def chat(payload: AssistantRequest) -> dict:
    question = payload.question.strip()
    if len(question) < 2:
        raise HTTPException(status_code=422, detail="Enter a question about rice health or field management.")
    try:
        return await run_in_threadpool(
            farming_assistant.ask,
            question,
            payload.language,
            [message.model_dump() for message in payload.history],
        )
    except AssistantConfigError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AssistantProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
