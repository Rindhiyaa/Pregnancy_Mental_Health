#!/usr/bin/env python3
"""
Health check for patient portal data integrity.
Identifies orphaned records that could cause issues in patient portal.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import get_db

def check_patient_portal_data_integrity():
    """Check for orphaned records that could affect patient portal"""
    
    db = next(get_db())
    
    try:
        print("🔍 Patient Portal Data Integrity Check...")
        
        # 1. Assessments visible in patient portal, but with missing patients
        print("\n1. Checking assessments with missing patients...")
        result = db.execute(text("""
            SELECT a.id, a.patient_id, a.patient_email
            FROM assessments a 
            LEFT JOIN patients p ON p.id = a.patient_id 
            WHERE p.id IS NULL
        """))
        orphaned_assessments = result.fetchall()
        print(f"   📊 Orphaned assessments: {len(orphaned_assessments)}")
        if orphaned_assessments:
            for row in orphaned_assessments[:5]:  # Show first 5
                print(f"      - Assessment ID {row[0]}, Patient ID {row[1]}, Email {row[2]}")
        
        # 2. Appointments/FollowUps visible in patient portal, but with missing patients
        print("\n2. Checking follow-ups with missing patients...")
        result = db.execute(text("""
            SELECT f.id, f.patient_id, f.patient_email
            FROM follow_ups f 
            LEFT JOIN patients p ON p.id = f.patient_id 
            WHERE p.id IS NULL
        """))
        orphaned_followups = result.fetchall()
        print(f"   📊 Orphaned follow-ups: {len(orphaned_followups)}")
        if orphaned_followups:
            for row in orphaned_followups[:5]:  # Show first 5
                print(f"      - FollowUp ID {row[0]}, Patient ID {row[1]}, Email {row[2]}")
        
        # 3. Appointments with missing patients
        print("\n3. Checking appointments with missing patients...")
        result = db.execute(text("""
            SELECT ap.id, ap.patient_id, ap.patient_name
            FROM appointments ap 
            LEFT JOIN patients p ON p.id = ap.patient_id 
            WHERE p.id IS NULL
        """))
        orphaned_appointments = result.fetchall()
        print(f"   📊 Orphaned appointments: {len(orphaned_appointments)}")
        if orphaned_appointments:
            for row in orphaned_appointments[:5]:  # Show first 5
                print(f"      - Appointment ID {row[0]}, Patient ID {row[1]}, Name {row[2]}")
        
        # 4. Messages with missing users
        print("\n4. Checking messages with missing users...")
        result = db.execute(text("""
            SELECT m.id, m.sender_id, m.receiver_id
            FROM messages m 
            WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.sender_id)
               OR NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.receiver_id)
        """))
        orphaned_messages = result.fetchall()
        print(f"   📊 Orphaned messages: {len(orphaned_messages)}")
        if orphaned_messages:
            for row in orphaned_messages[:5]:  # Show first 5
                print(f"      - Message ID {row[0]}, Sender ID {row[1]}, Receiver ID {row[2]}")
        
        # 5. Mood entries with missing users
        print("\n5. Checking mood entries with missing users...")
        result = db.execute(text("""
            SELECT me.id, me.user_id
            FROM mood_entries me 
            LEFT JOIN users u ON u.id = me.user_id 
            WHERE u.id IS NULL
        """))
        orphaned_moods = result.fetchall()
        print(f"   📊 Orphaned mood entries: {len(orphaned_moods)}")
        if orphaned_moods:
            for row in orphaned_moods[:5]:  # Show first 5
                print(f"      - Mood Entry ID {row[0]}, User ID {row[1]}")
        
        # 6. Summary
        total_orphaned = (len(orphaned_assessments) + len(orphaned_followups) + 
                         len(orphaned_appointments) + len(orphaned_messages) + 
                         len(orphaned_moods))
        
        print(f"\n🎯 Summary:")
        if total_orphaned == 0:
            print("   ✅ Patient portal data is clean - no orphaned records found!")
        else:
            print(f"   ⚠️  Found {total_orphaned} total orphaned records")
            print("   ⚠️  These could cause issues in patient portal")
            print("   💡 Run cleanup script to remove orphaned records")
            
    except Exception as e:
        print(f"❌ Error during health check: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    check_patient_portal_data_integrity()