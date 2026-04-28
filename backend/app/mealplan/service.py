from datetime import datetime, timezone

from ..database import get_db, serialize_id, to_object_id


async def create_meal_plan(data: dict) -> dict:
    db = get_db()
    data["created_at"] = datetime.now(timezone.utc)
    result = await db.meal_plans.insert_one(data)
    doc = await db.meal_plans.find_one({"_id": result.inserted_id})
    return serialize_id(doc)


async def get_latest_meal_plan(child_id: str) -> dict | None:
    db = get_db()
    doc = await db.meal_plans.find_one(
        {"child_id": child_id}, sort=[("week_start", -1)]
    )
    return serialize_id(doc) if doc else None


async def get_meal_plan(meal_plan_id: str) -> dict | None:
    db = get_db()
    doc = await db.meal_plans.find_one({"_id": to_object_id(meal_plan_id)})
    return serialize_id(doc) if doc else None
