from datetime import datetime, timezone

from ..database import get_db, serialize_id


async def generate_child_id(awc_code: str) -> str:
    db = get_db()
    count = await db.children.count_documents({"awc_code": awc_code})
    sequence = str(count + 1).zfill(4)
    return f"{awc_code}-{sequence}"


async def create_child(data: dict) -> dict:
    db = get_db()
    data["awc_code"] = data["awc_code"].strip()
    data["child_id"] = await generate_child_id(data["awc_code"])
    data["created_at"] = datetime.now(timezone.utc)
    data["is_active"] = True
    result = await db.children.insert_one(data)
    doc = await db.children.find_one({"_id": result.inserted_id})
    return serialize_id(doc)


async def list_children(filter_query: dict) -> list[dict]:
    db = get_db()
    children = []
    async for doc in db.children.find(filter_query):
        children.append(serialize_id(doc))
    return children


async def get_child_by_child_id(child_id: str) -> dict | None:
    db = get_db()
    doc = await db.children.find_one({"child_id": child_id.strip()})
    return serialize_id(doc) if doc else None
