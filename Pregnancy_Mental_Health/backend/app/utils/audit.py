from sqlalchemy.orm import Session
from .. import models
from datetime import datetime

async def add_audit_log(db: Session, user_id: int, user_name: str, action: str, details: str, ip_address: str = None):
    """
    Add an audit log entry to the database
    """
    try:
        log_entry = models.AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
        return log_entry
    except Exception as e:
        db.rollback()
        raise e