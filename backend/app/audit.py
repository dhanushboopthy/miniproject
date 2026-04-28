from datetime import datetime
from typing import Optional, Any
from app.database import get_db


async def log_audit(
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    user_id: Optional[str] = None,
    details: Optional[dict] = None,
    status: str = "success",
    error_message: Optional[str] = None
):
    """
    Log an audit event for mutations (create, update, delete).
    
    Args:
        action: create, update, delete, login, logout
        resource_type: user, child, measurement, alert, etc.
        resource_id: ID of the resource modified
        user_id: ID of the user who performed the action
        details: Additional context (old values, new values, etc.)
        status: success or failure
        error_message: If status=failure, error description
    """
    db = get_db()

    audit_doc = {
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "user_id": user_id,
        "details": details or {},
        "status": status,
        "error_message": error_message,
        "timestamp": datetime.utcnow(),
        "ipv4": None,  # Populated in middleware if needed
    }

    try:
        await db.audit_logs.insert_one(audit_doc)
    except Exception as e:
        # Log error but don't fail the operation
        print(f"Audit logging failed: {str(e)}")


async def get_audit_logs(
    resource_type: Optional[str] = None,
    user_id: Optional[str] = None,
    days: int = 30,
    limit: int = 100
) -> list:
    """
    Retrieve audit logs with optional filtering.
    """
    db = get_db()

    query = {
        "timestamp": {"$gte": datetime.utcnow().replace(day=1)}  # This month
    }

    if resource_type:
        query["resource_type"] = resource_type
    if user_id:
        query["user_id"] = user_id

    logs = await db.audit_logs.find(query).sort("timestamp", -1).limit(limit).to_list(length=None)

    # Serialize ObjectIds
    for log in logs:
        if "_id" in log:
            log["id"] = str(log["_id"])
            del log["_id"]

    return logs
