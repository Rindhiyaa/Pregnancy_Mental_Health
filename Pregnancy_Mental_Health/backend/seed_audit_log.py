# seed_audit_log.py
from datetime import datetime
from app import models
from app.database import SessionLocal

def main():
    db = SessionLocal()
    try:
        log = models.AuditLog(
            user_id=1,
            user_name="Test Admin",
            action="User Deleted",
            details="Deleted user Test (ID 999)",
            ip_address="127.0.0.1",
            timestamp=datetime.utcnow(),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        print("Created audit log with id:", log.id)
    finally:
        db.close()

if __name__ == "__main__":
    main()