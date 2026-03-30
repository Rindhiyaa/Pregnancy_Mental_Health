from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='appointments'"))
    cols = [r[0] for r in result]
    print("Existing columns:", cols)

    if "assigned_doctor_id" not in cols:
        conn.execute(text("ALTER TABLE appointments ADD COLUMN assigned_doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL"))
        conn.commit()
        print("Added assigned_doctor_id column")
    else:
        print("Column already exists")
