import sys
import os
import json
import re
from sqlalchemy import text

# Ensure we can import from the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import SessionLocal
from app import models

def fix_logs():
    print("--- Starting Audit Log Cleanup ---")
    db = SessionLocal()
    try:
        # 1. Fetch all audit logs with recovery actions
        logs = db.query(models.AuditLog).filter(models.AuditLog.action.like('RECOVERY_%')).all()
        print(f"Found {len(logs)} recovery-related logs to process.")
        
        updated_count = 0
        for log in logs:
            # Check if it's in the old "Action: ... | Meta: ..." format
            if "| Meta:" in log.details:
                action = log.action
                # Try to extract metadata if needed (though we only need the action for the basic labels)
                
                new_details = f"Action: {action}" # Default fallback
                
                if action == "RECOVERY_SUCCESS":
                    new_details = "Successfully completed password recovery and reset."
                elif action == "RECOVERY_APPROVED":
                    new_details = "Recovery request approved by Admin."
                elif action == "RECOVERY_AUTO_APPROVED":
                    new_details = "Recovery request automatically approved (Patient role)."
                elif action == "RECOVERY_REQUEST_PENDING_ADMIN":
                    new_details = "Recovery request submitted for clinician (Waiting for Admin approval)."
                elif action == "RECOVERY_FAILED_BAD_CODE":
                    new_details = "Failed recovery attempt: Incorrect code entered."
                elif action == "RECOVERY_FAILED_EXPIRED":
                    new_details = "Failed recovery attempt: Code has expired."
                elif action == "RECOVERY_FAILED_LOCKED":
                    new_details = "Account recovery locked: Too many failed attempts."
                elif action == "RECOVERY_REQUEST_UNKNOWN_EMAIL":
                    new_details = "Recovery attempt for unknown email."
                
                log.details = new_details
                updated_count += 1
        
        db.commit()
        print(f"Successfully updated {updated_count} legacy logs to the new human-readable format.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()
    print("--- Cleanup Complete ---")

if __name__ == "__main__":
    fix_logs()
