
import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app import models

def list_users():
    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        print(f"Total users found: {len(users)}")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Phone: {u.phone_number} | Role: {u.role}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
