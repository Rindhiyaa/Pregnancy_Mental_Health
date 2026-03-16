import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import models, config
from app.database import SessionLocal

def create_test_followups():
    db = SessionLocal()
    try:
        # 1. Find a clinician (user)
        user = db.query(models.User).first()
        if not user:
            print("❌ No user found in database.")
            return
        
        # 2. Find a patient
        patient = db.query(models.Patient).first()
        if not patient:
            print("❌ No patient found in database.")
            return

        print(f"Adding test follow-ups for {patient.name} (Clinician: {user.email})")

        # 3. Create a follow-up for TODAY
        fup_today = models.FollowUp(
            patient_id=patient.id,
            scheduled_date=datetime.now(), # Exactly now
            status="pending",
            type="first",
            notes="EXPO TEST: Immediate follow-up required",
            clinician_email=user.email
        )
        db.add(fup_today)
        
        # 4. Create another one for LATER today
        fup_later = models.FollowUp(
            patient_id=patient.id,
            scheduled_date=datetime.now() + timedelta(hours=2),
            status="pending",
            type="check-in",
            notes="EXPO TEST: Routine status check",
            clinician_email=user.email
        )
        db.add(fup_later)

        db.commit()
        print("✅ Success! Test follow-ups created for TODAY.")
        print("Refresh your Dashboard and check the 'Follow-up Queue' tab.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_followups()
