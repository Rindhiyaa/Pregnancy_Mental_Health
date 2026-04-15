#!/usr/bin/env python3
"""
Simulation script to create orphan records for testing defensive endpoints.
WARNING: This creates intentionally broken data for testing purposes only.
Use only in development/testing environments.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import get_db

def simulate_orphan_records():
    """
    Create orphan records to test defensive endpoint behavior.
    WARNING: This intentionally breaks data integrity for testing.
    """
    
    db = next(get_db())
    
    try:
        print("⚠️  SIMULATING ORPHAN RECORDS FOR TESTING...")
        print("    WARNING: This creates intentionally broken data!")
        
        # Get a non-existent patient ID
        result = db.execute(text("SELECT MAX(id) FROM patients"))
        max_patient_id = result.fetchone()[0] or 0
        fake_patient_id = max_patient_id + 999
        
        # Get a non-existent user ID
        result = db.execute(text("SELECT MAX(id) FROM users"))
        max_user_id = result.fetchone()[0] or 0
        fake_user_id = max_user_id + 999
        
        print(f"\n1. Creating orphan assessment (patient_id={fake_patient_id})...")
        db.execute(text("""
            INSERT INTO assessments (
                patient_name, patient_id, patient_email, raw_data, 
                risk_score, risk_level, status
            ) VALUES (
                'Ghost Patient', :patient_id, 'ghost@example.com', '{}',
                0.5, 'Low', 'submitted'
            )
        """), {"patient_id": fake_patient_id})
        print("   ✅ Orphan assessment created")
        
        print(f"\n2. Creating orphan follow-up (patient_id={fake_patient_id})...")
        db.execute(text("""
            INSERT INTO follow_ups (
                patient_id, patient_email, scheduled_date, status, 
                type, notes, clinician_email
            ) VALUES (
                :patient_id, 'ghost@example.com', NOW(), 'pending',
                'test', 'Ghost follow-up', 'test@example.com'
            )
        """), {"patient_id": fake_patient_id})
        print("   ✅ Orphan follow-up created")
        
        print(f"\n3. Creating orphan message (sender_id={fake_user_id})...")
        db.execute(text("""
            INSERT INTO messages (
                sender_id, receiver_id, content, is_read
            ) VALUES (
                :sender_id, 1, 'Ghost message', false
            )
        """), {"sender_id": fake_user_id})
        print("   ✅ Orphan message created")
        
        print(f"\n4. Creating orphan mood entry (user_id={fake_user_id})...")
        db.execute(text("""
            INSERT INTO mood_entries (
                user_id, mood_score, note
            ) VALUES (
                :user_id, 5, 'Ghost mood'
            )
        """), {"user_id": fake_user_id})
        print("   ✅ Orphan mood entry created")
        
        print(f"\n5. Creating orphan appointment (patient_id={fake_patient_id})...")
        db.execute(text("""
            INSERT INTO appointments (
                patient_id, patient_name, doctor_id, date, time, 
                type, status, department
            ) VALUES (
                :patient_id, 'Ghost Patient', 1, CURRENT_DATE, '10:00:00',
                'Consultation', 'pending', 'OBGYN'
            )
        """), {"patient_id": fake_patient_id})
        print("   ✅ Orphan appointment created")
        
        db.commit()
        
        print(f"\n🎯 Simulation Complete!")
        print("   ⚠️  Database now contains orphan records")
        print("   💡 Run test_defensive_patient_portal.py to detect them")
        print("   🧹 Run cleanup_orphaned_records.py to remove them")
        print("   ⚠️  Defensive endpoints should handle these gracefully")
        
    except Exception as e:
        print(f"❌ Error during simulation: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("⚠️  WARNING: This script creates intentionally broken data!")
    response = input("Are you sure you want to continue? (yes/no): ")
    if response.lower() == 'yes':
        simulate_orphan_records()
    else:
        print("Simulation cancelled.")