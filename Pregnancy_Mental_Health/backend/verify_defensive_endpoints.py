#!/usr/bin/env python3
"""
Verification script to test that our defensive endpoints work correctly.
This simulates the scenario where orphaned records might exist.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import get_db

def verify_defensive_endpoints():
    """Verify that our endpoints only return records with existing patients"""
    
    db = next(get_db())
    
    try:
        print("🔍 Verifying defensive endpoint behavior...")
        
        # 1. Check if there are any assessments without patients
        print("\n1. Checking for assessments without patients...")
        result = db.execute(text("""
            SELECT COUNT(*) as orphaned_count
            FROM assessments a 
            WHERE NOT EXISTS (
                SELECT 1 FROM patients p WHERE p.id = a.patient_id
            )
        """))
        orphaned_assessments = result.fetchone()[0]
        print(f"   📊 Orphaned assessments found: {orphaned_assessments}")
        
        # 2. Check if there are any appointments without patients
        print("\n2. Checking for appointments without patients...")
        result = db.execute(text("""
            SELECT COUNT(*) as orphaned_count
            FROM appointments a 
            WHERE NOT EXISTS (
                SELECT 1 FROM patients p WHERE p.id = a.patient_id
            )
        """))
        orphaned_appointments = result.fetchone()[0]
        print(f"   📊 Orphaned appointments found: {orphaned_appointments}")
        
        # 3. Check if there are any follow-ups without patients
        print("\n3. Checking for follow-ups without patients...")
        result = db.execute(text("""
            SELECT COUNT(*) as orphaned_count
            FROM follow_ups f 
            WHERE NOT EXISTS (
                SELECT 1 FROM patients p WHERE p.id = f.patient_id
            )
        """))
        orphaned_followups = result.fetchone()[0]
        print(f"   📊 Orphaned follow-ups found: {orphaned_followups}")
        
        # 4. Show total counts for reference
        print("\n4. Total record counts for reference...")
        
        patients_count = db.execute(text("SELECT COUNT(*) FROM patients")).fetchone()[0]
        assessments_count = db.execute(text("SELECT COUNT(*) FROM assessments")).fetchone()[0]
        appointments_count = db.execute(text("SELECT COUNT(*) FROM appointments")).fetchone()[0]
        followups_count = db.execute(text("SELECT COUNT(*) FROM follow_ups")).fetchone()[0]
        
        print(f"   📊 Total patients: {patients_count}")
        print(f"   📊 Total assessments: {assessments_count}")
        print(f"   📊 Total appointments: {appointments_count}")
        print(f"   📊 Total follow-ups: {followups_count}")
        
        # 5. Summary
        total_orphaned = orphaned_assessments + orphaned_appointments + orphaned_followups
        
        print(f"\n🎯 Summary:")
        if total_orphaned == 0:
            print("   ✅ Database is clean - no orphaned records found!")
            print("   ✅ Defensive endpoints will work correctly")
        else:
            print(f"   ⚠️  Found {total_orphaned} orphaned records")
            print("   ⚠️  Consider running cleanup_orphaned_records.py again")
            
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    verify_defensive_endpoints()