
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load .env to get database credentials
load_dotenv()

# Build or get DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

# Render fix for postgres:// vs postgresql://
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    DB_USER = os.getenv("DB_USER", "mluser")
    DB_PASS = os.getenv("DB_PASS", "mlpass")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_NAME = os.getenv("DB_NAME", "ml_db")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"

print(f"Connecting to database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")

# Setup engine and session
# For Render, we might need sslmode=require
if "render.com" in DATABASE_URL or os.getenv("RENDER"):
    engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})
else:
    engine = create_engine(DATABASE_URL)

Session = sessionmaker(bind=engine)

def fix_constraints():
    with Session() as session:
        try:
            # 1. Fix Patient user_id constraint
            print("Updating patients.user_id to ON DELETE CASCADE...")
            session.execute(text("ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_user_id_fkey;"))
            session.execute(text("""
                ALTER TABLE patients 
                ADD CONSTRAINT patients_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
            """))

            # 2. Fix Appointment doctor_id constraint
            print("Updating appointments.doctor_id to ON DELETE CASCADE...")
            session.execute(text("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;"))
            session.execute(text("""
                ALTER TABLE appointments 
                ADD CONSTRAINT appointments_doctor_id_fkey 
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE;
            """))

            # 3. Fix Appointment patient_id constraint
            print("Updating appointments.patient_id to ON DELETE CASCADE...")
            session.execute(text("ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;"))
            session.execute(text("""
                ALTER TABLE appointments 
                ADD CONSTRAINT appointments_patient_id_fkey 
                FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
            """))

            # 4. Cleanup test data if needed (optional)
            print("Cleaning up invalid emails...")
            session.execute(text("UPDATE users SET email = 'test@gmail.com' WHERE email = 'test@gmailcom'"))
            session.execute(text("UPDATE patients SET email = 'test@gmail.com' WHERE email = 'test@gmailcom'"))

            session.commit()
            print("Successfully updated database constraints and cleaned up data.")
        except Exception as e:
            session.rollback()
            print(f"Error fixing constraints: {e}")

if __name__ == "__main__":
    fix_constraints()
