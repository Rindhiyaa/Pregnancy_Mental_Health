import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app import models
from app.security import hash_password

def reset_clinicians():
    db = SessionLocal()
    try:
        # Reset all users to TempPass123!
        users = db.query(models.User).all()
        print(f"Resetting passwords for {len(users)} users...")
        
        new_pass = "TempPass123!"
        hashed = hash_password(new_pass)
        
        for u in users:
            u.hashed_password = hashed
            u.first_login = True
            print(f"  - Reset {u.email or u.phone} ({u.role})")
            
        db.commit()
        print("\nAll user passwords reset successfully to: TempPass123!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_clinicians()
