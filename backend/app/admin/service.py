from datetime import datetime, timezone

from ..database import get_db, serialize_id


async def create_awc_center(data: dict) -> dict:
    db = get_db()
    data["created_at"] = datetime.now(timezone.utc)
    result = await db.awc_centers.insert_one(data)
    doc = await db.awc_centers.find_one({"_id": result.inserted_id})
    return serialize_id(doc)


async def list_awc_centers() -> list[dict]:
    db = get_db()
    centers = []
    async for doc in db.awc_centers.find():
        centers.append(serialize_id(doc))
    return centers


async def list_users() -> list[dict]:
    db = get_db()
    users = []
    async for doc in db.users.find():
        doc = serialize_id(doc)
        doc.pop("hashed_password", None)
        users.append(doc)
    return users
