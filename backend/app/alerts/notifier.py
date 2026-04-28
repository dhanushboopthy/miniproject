import httpx
import logging
from typing import Optional
from app.config import settings
from app.alerts.service import log_notification

logger = logging.getLogger("alerts")


class Fast2SMSNotifier:
    """Fast2SMS API client for bulk SMS messaging."""

    def __init__(self):
        self.api_key = settings.fast2sms_api_key
        self.base_url = "https://www.fast2sms.com/dev/bulksms"

    async def send_sms(self, phone: str, message: str) -> bool:
        """
        Send SMS via Fast2SMS API.
        Returns True if sent successfully.
        """
        if not self.api_key:
            logger.warning("Fast2SMS API key not configured. Skipping SMS.")
            return False

        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        }

        payload = {
            "route": "q",
            "message": message,
            "numbers": phone,
            "flash": 0
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    data=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()

                # Fast2SMS returns {"return": true} on success
                return result.get("return") == True

        except httpx.HTTPError as e:
            logger.error(f"SMS send failed for {phone}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {str(e)}")
            return False


class EmailNotifier:
    """Email notification stub. Integrate SendGrid or SMTP as needed."""

    async def send_email(
        self,
        recipient: str,
        subject: str,
        body: str,
        html: Optional[str] = None
    ) -> bool:
        """
        Send email notification.
        Currently a stub that logs intent.
        TODO: Integrate SendGrid or SMTP.
        """
        logger.info(f"Email notification queued for {recipient}: {subject}")
        # Placeholder: integrating SendGrid or SMTP
        # For now, return True (email queued)
        return True


class InAppNotifier:
    """In-app notification handler (stores in DB for polling/WebSocket push)."""

    async def create_notification(
        self,
        user_id: str,
        alert_id: str,
        message: str,
        notification_type: str = "alert"
    ) -> bool:
        """
        Create in-app notification by storing in DB.
        Frontend can poll `/notifications` endpoint or use WebSocket.
        """
        from app.database import get_db
        from datetime import datetime

        db = get_db()

        notif_doc = {
            "user_id": user_id,
            "alert_id": alert_id,
            "message": message,
            "type": notification_type,
            "read": False,
            "created_at": datetime.utcnow(),
        }

        try:
            result = await db.in_app_notifications.insert_one(notif_doc)
            return result.inserted_id is not None
        except Exception as e:
            logger.error(f"Failed to create in-app notification: {str(e)}")
            return False


class AlertNotificationDispatcher:
    """Orchestrates multi-channel notification dispatch for alerts."""

    def __init__(self):
        self.sms = Fast2SMSNotifier()
        self.email = EmailNotifier()
        self.inapp = InAppNotifier()

    async def dispatch_alert(
        self,
        alert_id: str,
        message: str,
        child_info: dict,
        worker_info: dict,
        supervisor_info: Optional[dict] = None,
        parent_phone: Optional[str] = None
    ):
        """
        Dispatch alert via all channels:
        - SMS to worker + parent
        - Email to worker + supervisor
        - In-app notification to worker + supervisor
        """

        # SMS to Worker
        if worker_info.get("phone"):
            success = await self.sms.send_sms(
                worker_info["phone"],
                f"ICDS Alert: {message}"
            )
            await log_notification(
                alert_id=alert_id,
                notification_type="sms",
                recipient=worker_info["phone"],
                status="sent" if success else "failed",
                message=message,
                error="SMS service unavailable" if not success else None
            )

        # SMS to Parent (if available)
        if parent_phone:
            success = await self.sms.send_sms(
                parent_phone,
                f"Health Alert for {child_info.get('name')}: {message}"
            )
            await log_notification(
                alert_id=alert_id,
                notification_type="sms",
                recipient=parent_phone,
                status="sent" if success else "failed",
                message=message,
                error=None
            )

        # Email to Worker
        if worker_info.get("email"):
            await self.email.send_email(
                recipient=worker_info["email"],
                subject=f"ICDS Alert: {child_info.get('name')}",
                body=message
            )
            await log_notification(
                alert_id=alert_id,
                notification_type="email",
                recipient=worker_info["email"],
                status="sent",
                message=message
            )

        # Email to Supervisor
        if supervisor_info and supervisor_info.get("email"):
            await self.email.send_email(
                recipient=supervisor_info["email"],
                subject=f"ICDS Alert - {child_info.get('name')} (Supervisor Copy)",
                body=message
            )
            await log_notification(
                alert_id=alert_id,
                notification_type="email",
                recipient=supervisor_info["email"],
                status="sent",
                message=message
            )

        # In-app Notification to Worker
        if worker_info.get("_id"):
            await self.inapp.create_notification(
                user_id=str(worker_info["_id"]),
                alert_id=alert_id,
                message=message,
                notification_type="critical_alert"
            )

        # In-app Notification to Supervisor
        if supervisor_info and supervisor_info.get("_id"):
            await self.inapp.create_notification(
                user_id=str(supervisor_info["_id"]),
                alert_id=alert_id,
                message=message,
                notification_type="alert_summary"
            )

        logger.info(f"Alert {alert_id} dispatched across all channels")


# Singleton dispatcher instance
alert_dispatcher = AlertNotificationDispatcher()
