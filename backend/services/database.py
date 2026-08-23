import logging
from typing import Any

from pymongo import ASCENDING, DESCENDING, AsyncMongoClient, IndexModel
from pymongo.asynchronous.database import AsyncDatabase

from config import settings


logger = logging.getLogger(__name__)


class DatabaseService:
    def __init__(self) -> None:
        self.client: AsyncMongoClient | None = None
        self.db: AsyncDatabase | None = None
        self.error: str | None = None

    @property
    def ready(self) -> bool:
        return self.db is not None and self.error is None

    async def connect(self) -> None:
        if not settings.mongodb_uri:
            self.error = "MONGODB_URI is not configured."
            logger.warning(self.error)
            return

        client: AsyncMongoClient | None = None
        try:
            client = AsyncMongoClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=7000,
                maxPoolSize=20,
            )
            await client.admin.command("ping")
            self.client = client
            self.db = client[settings.mongodb_database]
            await self._create_indexes()
            self.error = None
        except Exception as exc:
            if client is not None:
                await client.close()
            self.error = str(exc)
            self.client = None
            self.db = None
            logger.exception("MongoDB Atlas connection failed")

    async def _create_indexes(self) -> None:
        if self.db is None:
            return
        await self.db.users.create_indexes(
            [IndexModel([("email", ASCENDING)], unique=True, name="unique_email")]
        )
        await self.db.detections.create_indexes(
            [
                IndexModel(
                    [("user_id", ASCENDING), ("created_at", DESCENDING)],
                    name="user_history",
                )
            ]
        )
        await self.db.refresh_tokens.create_indexes(
            [
                IndexModel([("jti", ASCENDING)], unique=True, name="unique_jti"),
                IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="token_expiry"),
            ]
        )
        await self.db.password_reset_tokens.create_indexes(
            [
                IndexModel([("token_hash", ASCENDING)], unique=True, name="unique_reset_token"),
                IndexModel([("expires_at", ASCENDING)], expireAfterSeconds=0, name="reset_expiry"),
                IndexModel([("user_id", ASCENDING)], name="reset_user"),
            ]
        )

    def require(self) -> AsyncDatabase:
        if self.db is None:
            message = "Database is unavailable. Check MONGODB_URI and the Atlas IP access list."
            if self.error:
                logger.error("Database unavailable: %s", self.error)
            raise RuntimeError(message)
        return self.db

    async def close(self) -> None:
        if self.client is not None:
            await self.client.close()
        self.client = None
        self.db = None

    def status(self) -> dict[str, Any]:
        return {
            "ready": self.ready,
            "database": settings.mongodb_database,
            "configured": bool(settings.mongodb_uri),
        }


database = DatabaseService()
