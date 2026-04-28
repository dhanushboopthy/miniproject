from datetime import datetime
from pydantic import BaseModel
from enum import Enum


class AlertSeverity(str, Enum):
    CRITICAL = "critical"  # SAM - Severe Acute Malnutrition
    HIGH = "high"  # MAM - Moderate Acute Malnutrition
    MEDIUM = "medium"  # Trend warning
    LOW = "low"  # Informational


class AlertType(str, Enum):
    SAM_DETECTED = "sam_detected"
    MAM_DETECTED = "mam_detected"
    WEIGHT_LOSS = "weight_loss"
    MISSED_MEASUREMENT = "missed_measurement"
    REFERRAL_NEEDED = "referral_needed"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class AlertCreate(BaseModel):
    child_id: str
    awc_code: str
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    details: dict = {}  # Additional context (z_score, age, etc.)


class AlertOut(BaseModel):
    id: str
    child_id: str
    awc_code: str
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    status: AlertStatus
    details: dict
    created_at: datetime
    created_by: str  # User ID who triggered alert
    resolved_at: datetime = None
    resolved_by: str = None

    class Config:
        from_attributes = True


class NotificationLog(BaseModel):
    id: str
    alert_id: str
    notification_type: str  # sms, email, in_app
    recipient: str
    status: str  # sent, failed, pending
    message: str
    sent_at: datetime = None
    error_message: str = None

    class Config:
        from_attributes = True
