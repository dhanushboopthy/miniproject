from datetime import datetime, timezone

from ..database import get_db, serialize_id
from .who_calculator import calculate_z_scores
from ..alerts.service import check_and_create_alerts
from ..alerts.notifier import alert_dispatcher


def classify_status(whz: float, muac_cm: float) -> str:
    if whz < -3 or muac_cm < 11.5:
        return "SAM"
    if whz < -2 or (11.5 <= muac_cm < 12.5):
        return "MAM"
    return "Normal"


async def add_measurement(data: dict, gender: str, current_user: dict = None, child_info: dict = None) -> dict:
    db = get_db()
    measurement_date = data.get("measurement_date")
    if isinstance(measurement_date, str):
        try:
            parsed_date = datetime.fromisoformat(measurement_date)
        except ValueError:
            parsed_date = datetime.strptime(measurement_date, "%Y-%m-%d")
        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)
        data["measurement_date"] = parsed_date
    if child_info:
        data["awc_code"] = child_info.get("awc_code")
    z_scores = calculate_z_scores(
        age_months=data["age_months"],
        weight_kg=data["weight_kg"],
        height_cm=data["height_cm"],
        gender=gender,
    )
    data["z_scores"] = z_scores
    data["wfh_status"] = classify_status(z_scores["whz"], data["muac_cm"])
    data["status"] = data["wfh_status"]
    data["whz"] = z_scores["whz"]  # Store WHZ at top level for alerts
    data["created_at"] = datetime.now(timezone.utc)
    result = await db.growth_records.insert_one(data)
    doc = await db.growth_records.find_one({"_id": result.inserted_id})
    saved_doc = serialize_id(doc)

    # Trigger alert engine if measurement indicates SAM/MAM or other risks
    if current_user and child_info:
        try:
            alerts_created = await check_and_create_alerts(
                measurement_data=data,
                child_id=data.get("child_id"),
                child_info=child_info,
                current_user=current_user
            )

            # Dispatch alerts via all channels (SMS, email, in-app)
            for alert_id in alerts_created:
                # TODO: Fetch worker and supervisor details, then dispatch
                # For now, alerts are created and logged
                pass
        except Exception as e:
            # Log error but don't fail the measurement save
            print(f"Alert creation failed: {str(e)}")

    return saved_doc


async def list_measurements(child_id: str) -> list[dict]:
    db = get_db()
    records = []
    cursor = db.growth_records.find({"child_id": child_id}).sort("measurement_date", -1)
    async for doc in cursor:
        records.append(serialize_id(doc))
    return records


async def get_latest_measurement(child_id: str) -> dict | None:
    db = get_db()
    doc = await db.growth_records.find_one(
        {"child_id": child_id}, sort=[("measurement_date", -1)]
    )
    return serialize_id(doc) if doc else None


async def get_chart_data(child_id: str) -> list[dict]:
    db = get_db()
    records = []
    cursor = db.growth_records.find({"child_id": child_id}).sort("measurement_date", 1)
    async for doc in cursor:
        doc = serialize_id(doc)
        records.append(
            {
                "date": doc["measurement_date"],
                "weight_kg": doc["weight_kg"],
                "height_cm": doc["height_cm"],
                "whz": doc["z_scores"]["whz"],
                "status": doc.get("status") or doc.get("wfh_status"),
            }
        )
    return records
