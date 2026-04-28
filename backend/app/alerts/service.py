from datetime import datetime, timedelta
from typing import List, Optional
from bson import ObjectId
from app.database import get_db
from app.alerts.models import AlertCreate, AlertType, AlertSeverity, AlertStatus
from app.children.service import get_child_by_child_id


async def check_and_create_alerts(
    measurement_data: dict,
    child_id: str,
    child_info: dict,
    current_user: dict
) -> List[str]:
    """
    Rule-based alert checker. Triggered on new growth measurement save.
    Returns list of alert IDs created.
    """
    db = get_db()
    alerts_created = []

    # Rule 1: SAM Detection (WHZ < -3)
    if measurement_data.get("whz") and measurement_data["whz"] < -3:
        alert = await create_alert(
            AlertCreate(
                child_id=child_id,
                awc_code=child_info.get("awc_code"),
                alert_type=AlertType.SAM_DETECTED,
                severity=AlertSeverity.CRITICAL,
                message=f"🚨 CRITICAL: {child_info.get('name')} classified as SAM (WHZ: {measurement_data['whz']:.2f}). Immediate referral required.",
                details={
                    "whz": measurement_data["whz"],
                    "wfh_status": measurement_data.get("wfh_status"),
                    "muac_cm": measurement_data.get("muac_cm"),
                    "age_months": measurement_data.get("age_months"),
                    "measurement_date": str(measurement_data.get("measurement_date")),
                }
            ),
            current_user=current_user
        )
        alerts_created.append(alert)

    # Rule 2: MAM Detection (WHZ -2 to -3)
    elif measurement_data.get("whz") and -3 <= measurement_data["whz"] < -2:
        alert = await create_alert(
            AlertCreate(
                child_id=child_id,
                awc_code=child_info.get("awc_code"),
                alert_type=AlertType.MAM_DETECTED,
                severity=AlertSeverity.HIGH,
                message=f"⚠️  HIGH: {child_info.get('name')} classified as MAM (WHZ: {measurement_data['whz']:.2f}). Enhanced nutrition intervention needed.",
                details={
                    "whz": measurement_data["whz"],
                    "wfh_status": measurement_data.get("wfh_status"),
                    "muac_cm": measurement_data.get("muac_cm"),
                    "age_months": measurement_data.get("age_months"),
                    "measurement_date": str(measurement_data.get("measurement_date")),
                }
            ),
            current_user=current_user
        )
        alerts_created.append(alert)

    # Rule 3: Weight Loss Trend (compare to last measurement)
    last_measurement = await db.growth_records.find_one(
        {"child_id": child_id, "measurement_date": {"$lt": measurement_data.get("measurement_date")}},
        sort=[("measurement_date", -1)]
    )

    if last_measurement and last_measurement.get("weight_kg"):
        weight_diff = measurement_data.get("weight_kg", 0) - last_measurement["weight_kg"]
        if weight_diff < -0.5:  # Loss of >500g
            alert = await create_alert(
                AlertCreate(
                    child_id=child_id,
                    awc_code=child_info.get("awc_code"),
                    alert_type=AlertType.WEIGHT_LOSS,
                    severity=AlertSeverity.MEDIUM,
                    message=f"⚠️  MEDIUM: {child_info.get('name')} showed weight loss of {abs(weight_diff):.2f} kg since last measurement.",
                    details={
                        "previous_weight_kg": last_measurement["weight_kg"],
                        "current_weight_kg": measurement_data.get("weight_kg"),
                        "weight_loss_kg": abs(weight_diff),
                        "days_between": (measurement_data.get("measurement_date") - last_measurement["measurement_date"]).days,
                    }
                ),
                current_user=current_user
            )
            alerts_created.append(alert)

    return alerts_created


async def create_alert(alert_create: AlertCreate, current_user: dict) -> str:
    """
    Create alert document in MongoDB.
    Returns alert ID.
    """
    db = get_db()

    alert_doc = {
        "child_id": alert_create.child_id,
        "awc_code": alert_create.awc_code,
        "alert_type": alert_create.alert_type.value,
        "severity": alert_create.severity.value,
        "message": alert_create.message,
        "status": AlertStatus.ACTIVE.value,
        "details": alert_create.details,
        "created_at": datetime.utcnow(),
        "created_by": current_user.get("_id"),
        "resolved_at": None,
        "resolved_by": None,
    }

    result = await db.alerts.insert_one(alert_doc)
    return str(result.inserted_id)


async def get_alert_by_id(alert_id: str) -> Optional[dict]:
    """Fetch alert by ID with serialized _id."""
    db = get_db()
    alert = await db.alerts.find_one({"_id": ObjectId(alert_id)})
    if alert:
        alert["id"] = str(alert["_id"])
        del alert["_id"]
    return alert


async def list_alerts_for_awc(
    awc_code: str,
    status: Optional[AlertStatus] = None,
    limit: int = 50,
    skip: int = 0
) -> List[dict]:
    """
    Fetch alerts for AWC, optionally filtered by status.
    Returns paginated results sorted by severity and creation date.
    """
    db = get_db()

    query = {"awc_code": awc_code}
    if status:
        query["status"] = status.value

    alerts = await db.alerts.find(query).sort([
        ("severity", 1),  # CRITICAL first
        ("created_at", -1)  # Most recent first
    ]).skip(skip).limit(limit).to_list(length=None)

    for alert in alerts:
        alert["id"] = str(alert["_id"])
        del alert["_id"]

    return alerts


async def list_alerts_for_child(child_id: str) -> List[dict]:
    """Fetch all alerts for a child, sorted by date."""
    db = get_db()

    alerts = await db.alerts.find({"child_id": child_id}).sort([
        ("created_at", -1)
    ]).to_list(length=None)

    for alert in alerts:
        alert["id"] = str(alert["_id"])
        del alert["_id"]

    return alerts


async def acknowledge_alert(alert_id: str, current_user: dict) -> bool:
    """Mark alert as acknowledged without resolving."""
    db = get_db()

    result = await db.alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": {"status": AlertStatus.ACKNOWLEDGED.value}}
    )

    return result.modified_count > 0


async def resolve_alert(alert_id: str, current_user: dict) -> bool:
    """Mark alert as resolved."""
    db = get_db()

    result = await db.alerts.update_one(
        {"_id": ObjectId(alert_id)},
        {
            "$set": {
                "status": AlertStatus.RESOLVED.value,
                "resolved_at": datetime.utcnow(),
                "resolved_by": current_user.get("_id")
            }
        }
    )

    return result.modified_count > 0


async def log_notification(
    alert_id: str,
    notification_type: str,
    recipient: str,
    status: str,
    message: str,
    error: Optional[str] = None
) -> str:
    """Log notification attempt (SMS, email, in-app)."""
    db = get_db()

    notif_doc = {
        "alert_id": ObjectId(alert_id),
        "notification_type": notification_type,
        "recipient": recipient,
        "status": status,
        "message": message,
        "sent_at": datetime.utcnow() if status == "sent" else None,
        "error_message": error,
    }

    result = await db.notification_logs.insert_one(notif_doc)
    return str(result.inserted_id)


async def get_active_alerts_count(awc_code: str) -> int:
    """Get count of active (unresolved) alerts for AWC."""
    db = get_db()

    count = await db.alerts.count_documents({
        "awc_code": awc_code,
        "status": {"$in": [AlertStatus.ACTIVE.value, AlertStatus.ACKNOWLEDGED.value]}
    })

    return count
