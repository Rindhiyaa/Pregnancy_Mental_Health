#!/usr/bin/env python3
"""
One-time cleanup script to remove orphaned records after implementing cascading deletes.
Run this once to clean up existing orphaned assessments and follow-ups.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import get_db

def cleanup_orphaned_records():
    """Remove assessments and follow-ups that reference deleted patients"""
    
    db = next(get_db())
    
    try:
        print("🧹 Starting cleanup of orphaned records...")
        
        # 1. Clean up orphaned assessments
        print("\n1. Cleaning up orphaned assessments...")
        result = db.execute(text("""
            DELETE FROM assessments a 
            WHERE NOT EXISTS (
                SELECT 1 FROM patients p WHERE p.id = a.patient_id
            )
        """))
        orphaned_assessments = result.rowcount
        print(f"   ✅ Deleted {orphaned_assessments} orphaned assessments")
        
        # 2. Clean up orphaned follow-ups
        print("\n2. Cleaning up orphaned follow-ups...")
        result = db.execute(text("""
            DELETE FROM follow_ups f 
            WHERE NOT EXISTS (
                SELECT 1 FROM patients p WHERE p.id = f.patient_id
            )
        """))
        orphaned_followups = result.rowcount
        print(f"   ✅ Deleted {orphaned_followups} orphaned follow-ups")
        
        # 3. Clean up orphaned appointments
        print("\n3. Cleaning up orphaned appointments...")
        result = db.execute(text("""
            DELETE FROM appointments a 
            WHERE NOT EXISTS (
                SELECT 1 FROM patients p WHERE p.id = a.patient_id
            )
        """))
        orphaned_appointments = result.rowcount
        print(f"   ✅ Deleted {orphaned_appointments} orphaned appointments")
        
        # Commit all changes
        db.commit()
        
        print(f"\n🎉 Cleanup completed successfully!")
        print(f"   - Orphaned assessments removed: {orphaned_assessments}")
        print(f"   - Orphaned follow-ups removed: {orphaned_followups}")
        print(f"   - Orphaned appointments removed: {orphaned_appointments}")
        
        if orphaned_assessments + orphaned_followups + orphaned_appointments == 0:
            print("   - No orphaned records found - database is clean!")
            
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_orphaned_records()