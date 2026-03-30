import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE assessments ADD COLUMN IF NOT EXISTS epds_score INTEGER"))
    conn.execute(text("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending'"))
    conn.commit()
    print("Migration complete - epds_score and appointments.status columns added")
