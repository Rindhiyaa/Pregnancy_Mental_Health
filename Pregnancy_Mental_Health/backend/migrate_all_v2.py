import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate():
    with engine.connect() as conn:
        logger.info("Starting comprehensive migration...")
        
        # --- Users table ---
        columns_to_add_users = [
            ("hospital_name", "VARCHAR"),
            ("department", "VARCHAR"),
            ("designation", "VARCHAR"),
            ("specialization", "VARCHAR"),
            ("ward", "VARCHAR"),
            ("years_of_experience", "INTEGER"),
            ("password_changed_at", "TIMESTAMP WITH TIME ZONE"),
            ("is_active", "BOOLEAN DEFAULT TRUE"),
            ("first_login", "BOOLEAN DEFAULT TRUE"),
        ]
        
        for col_name, col_type in columns_to_add_users:
            try:
                # PostgreSQL specific check for column existence
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                logger.info(f"Checked/Added users.{col_name}")
            except Exception as e:
                logger.warning(f"Failed to add users.{col_name}: {e}")

        # --- Assessments table ---
        columns_to_add_assessments = [
            ("epds_score", "INTEGER"),
            ("assigned_doctor_id", "INTEGER"),
            ("nurse_id", "INTEGER"),
            ("status", "VARCHAR DEFAULT 'submitted'"),
            ("top_risk_factors", "JSON"),
            ("risk_level_final", "VARCHAR"),
            ("overridden_by", "INTEGER"),
            ("override_reason", "VARCHAR"),
            ("reviewed_at", "TIMESTAMP WITH TIME ZONE"),
        ]
        
        for col_name, col_type in columns_to_add_assessments:
            try:
                conn.execute(text(f"ALTER TABLE assessments ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                logger.info(f"Checked/Added assessments.{col_name}")
            except Exception as e:
                logger.warning(f"Failed to add assessments.{col_name}: {e}")

        # --- Appointments table ---
        columns_to_add_appointments = [
            ("status", "VARCHAR DEFAULT 'pending'"),
            ("assigned_doctor_id", "INTEGER"),
            ("created_by_nurse_id", "INTEGER"),
        ]
        
        for col_name, col_type in columns_to_add_appointments:
            try:
                conn.execute(text(f"ALTER TABLE appointments ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
                logger.info(f"Checked/Added appointments.{col_name}")
            except Exception as e:
                logger.warning(f"Failed to add appointments.{col_name}: {e}")

        # --- Constraints ---
        try:
            # First, check if the constraint already exists
            # (PostgreSQL specific query for constraints)
            check_fk_query = text("""
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_appointments_nurse'
            """)
            exists = conn.execute(check_fk_query).scalar()
            
            if not exists:
                conn.execute(text("""
                    ALTER TABLE appointments 
                    ADD CONSTRAINT fk_appointments_nurse 
                    FOREIGN KEY (created_by_nurse_id) 
                    REFERENCES users(id)
                """))
                logger.info("Added fk_appointments_nurse constraint")
            else:
                logger.info("fk_appointments_nurse constraint already exists")
        except Exception as e:
            logger.warning(f"Failed to add fk_appointments_nurse: {e}")

        conn.commit()
        logger.info("Migration complete.")

if __name__ == "__main__":
    migrate()
