# seed_audit_log.py
from datetime import datetime
from app import models
from app.database import SessionLocal

def main():
    db = SessionLocal()
    try:
        logs = [
            models.AuditLog(
                user_id=6,
                user_name="Admin User",
                action="User Created",
                details="Created doctor Jane Smith (ID 101)",
                ip_address="192.168.1.1",
                timestamp=datetime.utcnow(),
            ),
            models.AuditLog(
                user_id=6,
                user_name="Admin User",
                action="Password Reset",
                details="Reset password for user John Doe (ID 102)",
                ip_address="192.168.1.1",
                timestamp=datetime.utcnow(),
            ),
            models.AuditLog(
                user_id=6,
                user_name="Admin User",
                action="User Deleted",
                details="Deleted patient record (ID 103)",
                ip_address="192.168.1.1",
                timestamp=datetime.utcnow(),
            )
        ]
        db.add_all(logs)
        db.commit()
        print(f"Created {len(logs)} audit logs.")
    finally:
        db.close()

if __name__ == "__main__":
    main()