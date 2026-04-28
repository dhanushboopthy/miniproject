import logging
from datetime import datetime, timezone

from ..database import get_db, serialize_id, to_object_id
from .openrouter_client import openrouter_client

logger = logging.getLogger(__name__)


async def create_nutrition_log(data: dict) -> dict:
    db = get_db()
    data["created_at"] = datetime.now(timezone.utc)
    data["ai_analysis"] = None
    result = await db.nutrition_logs.insert_one(data)
    doc = await db.nutrition_logs.find_one({"_id": result.inserted_id})
    return serialize_id(doc)


async def get_nutrition_log(log_id: str) -> dict | None:
    db = get_db()
    doc = await db.nutrition_logs.find_one({"_id": to_object_id(log_id)})
    return serialize_id(doc) if doc else None


async def list_nutrition_logs(child_id: str) -> list[dict]:
    db = get_db()
    logs = []
    cursor = db.nutrition_logs.find({"child_id": child_id}).sort("log_date", -1)
    async for doc in cursor:
        logs.append(serialize_id(doc))
    return logs


async def run_ai_analysis(log_id: str, child_data: dict, diet_items: list[dict]) -> None:
    db = get_db()
    logger.info("Starting AI analysis for nutrition log %s", log_id)
    try:
        analysis = await openrouter_client.analyze_nutrition(
            child_name=child_data.get("name"),
            age_months=child_data.get("age_months"),
            weight_kg=child_data.get("weight_kg"),
            height_cm=child_data.get("height_cm"),
            muac_cm=child_data.get("muac_cm"),
            status=child_data.get("status"),
            diet_log=diet_items,
        )
        await db.nutrition_logs.update_one(
            {"_id": to_object_id(log_id)},
            {"$set": {"ai_analysis": analysis}},
        )
        logger.info("Completed AI analysis for nutrition log %s", log_id)
    except Exception as e:
        logger.exception("AI analysis failed for nutrition log %s", log_id)
        await db.nutrition_logs.update_one(
            {"_id": to_object_id(log_id)},
            {"$set": {"ai_analysis_error": str(e)}},
        )
