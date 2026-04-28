from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from .config import settings


_client = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_db():
    client = get_client()
    return client.get_default_database()


def to_object_id(value: str) -> ObjectId:
    return ObjectId(value)


def serialize_id(doc: dict) -> dict:
    if not doc:
        return doc
    doc["id"] = str(doc.pop("_id"))
    return doc
