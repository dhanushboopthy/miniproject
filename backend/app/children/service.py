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


async def list_children_with_status(filter_query: dict) -> list[dict]:
    """Return children list enriched with latest growth status."""
    db = get_db()
    children = []
    async for doc in db.children.find(filter_query):
        child = serialize_id(doc)
        child_id = child.get("child_id", "")
        latest = await db.growth_records.find_one(
            {"child_id": child_id},
            sort=[("measurement_date", -1)],
        )
        if latest:
            child["latest_status"] = latest.get("wfh_status")
            child["latest_weight_kg"] = latest.get("weight_kg")
            child["latest_measurement_date"] = (
                latest["measurement_date"].isoformat()
                if hasattr(latest.get("measurement_date"), "isoformat")
                else latest.get("measurement_date")
            )
        else:
            child["latest_status"] = None
            child["latest_weight_kg"] = None
            child["latest_measurement_date"] = None
        children.append(child)
    return children
