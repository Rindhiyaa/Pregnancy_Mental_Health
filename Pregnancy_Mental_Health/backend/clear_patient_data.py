"""
Script to clear all patient users from the database (keep admin/doctor/nurse).
Use this to reset test data if needed.
Usage (from the backend directory):
    python clear_patient_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def clear_patient_data():
    db = SessionLocal()
    try:
        print("\n=== Clearing Patient Data ===\n")
        
        # Get all patient users
        patients = db.query(models.User).filter(models.User.role == "patient").all()
        print(f"Found {len(patients)} patient users to delete")
        
        if not patients:
            print("No patient users found.")
            db.close()
            return
        
        # Also delete their patient records
        patient_records = db.query(models.Patient).all()
        print(f"Found {len(patient_records)} patient records to delete")
        
        # Delete patient records first (foreign key constraint)
        for patient_record in patient_records:
            print(f"  - Deleting patient record ID {patient_record.id}")
            db.delete(patient_record)
        
        # Delete patient users
        for patient_user in patients:
            print(f"  - Deleting user {patient_user.email} (ID: {patient_user.id})")
            db.delete(patient_user)
        
        db.commit()
        print(f"\n✅ Deleted {len(patients)} patient users and {len(patient_records)} patient records.")
        print("✅ Admin/Doctor/Nurse users preserved.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    response = input("⚠️  This will delete all patient users and records. Continue? (yes/no): ")
    if response.lower() == "yes":
        clear_patient_data()
    else:
        print("Cancelled.")
