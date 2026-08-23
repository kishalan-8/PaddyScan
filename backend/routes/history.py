from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from services.authentication import get_current_user
from services.cloud_storage import cloud_storage
from services.database import database


router = APIRouter(prefix="/history", tags=["history"])


class NoteRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


def _db():
    try:
        return database.require()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _object_id(value: str, label: str = "record") -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"The {label} was not found.") from exc


def _serialize_note(note: dict) -> dict:
    return {
        "id": str(note["_id"]),
        "text": note["text"],
        "createdAt": note["created_at"],
        "updatedAt": note.get("updated_at", note["created_at"]),
    }


def serialize_detection(document: dict) -> dict:
    result = dict(document["result"])
    result.pop("explanations", None)
    result.update(
        {
            "id": str(document["_id"]),
            "historyId": str(document["_id"]),
            "createdAt": document["created_at"],
            "notes": [_serialize_note(note) for note in document.get("notes", [])],
            "savedToHistory": True,
        }
    )
    return result


async def _owned_detection(detection_id: str, user: dict) -> dict:
    document = await _db().detections.find_one(
        {"_id": _object_id(detection_id), "user_id": user["_id"]}
    )
    if document is None:
        raise HTTPException(status_code=404, detail="The detection record was not found.")
    return document


@router.get("")
async def list_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=12, ge=1, le=50),
    user: dict = Depends(get_current_user),
) -> dict:
    db = _db()
    query = {"user_id": user["_id"]}
    total = await db.detections.count_documents(query)
    cursor = db.detections.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    documents = await cursor.to_list(length=limit)
    return {
        "items": [serialize_detection(document) for document in documents],
        "page": page,
        "limit": limit,
        "total": total,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/{detection_id}")
async def get_history_item(
    detection_id: str,
    user: dict = Depends(get_current_user),
) -> dict:
    return serialize_detection(await _owned_detection(detection_id, user))


@router.delete("/{detection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_item(
    detection_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    document = await _owned_detection(detection_id, user)
    await _db().detections.delete_one({"_id": document["_id"], "user_id": user["_id"]})
    public_ids = document.get("asset_public_ids", [])
    if public_ids:
        await run_in_threadpool(cloud_storage.delete_assets, public_ids)


@router.post("/{detection_id}/notes", status_code=status.HTTP_201_CREATED)
async def add_note(
    detection_id: str,
    payload: NoteRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="A note cannot be empty.")
    document = await _owned_detection(detection_id, user)
    now = datetime.now(timezone.utc)
    note = {"_id": ObjectId(), "text": text, "created_at": now, "updated_at": now}
    await _db().detections.update_one(
        {"_id": document["_id"], "user_id": user["_id"]},
        {"$push": {"notes": note}},
    )
    return _serialize_note(note)


@router.patch("/{detection_id}/notes/{note_id}")
async def update_note(
    detection_id: str,
    note_id: str,
    payload: NoteRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="A note cannot be empty.")
    detection_object_id = _object_id(detection_id)
    note_object_id = _object_id(note_id, "note")
    now = datetime.now(timezone.utc)
    result = await _db().detections.update_one(
        {
            "_id": detection_object_id,
            "user_id": user["_id"],
            "notes._id": note_object_id,
        },
        {"$set": {"notes.$.text": text, "notes.$.updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="The note was not found.")
    return {"id": note_id, "text": text, "updatedAt": now}


@router.delete("/{detection_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    detection_id: str,
    note_id: str,
    user: dict = Depends(get_current_user),
) -> None:
    result = await _db().detections.update_one(
        {"_id": _object_id(detection_id), "user_id": user["_id"]},
        {"$pull": {"notes": {"_id": _object_id(note_id, "note")}}},
    )
    if result.matched_count == 0 or result.modified_count == 0:
        raise HTTPException(status_code=404, detail="The note was not found.")
