from app.database import engine
from sqlalchemy import text
from datetime import date

today = date.today().isoformat()

with engine.connect() as conn:
    conn.execute(text(f"UPDATE appointments SET date = '{today}' WHERE id = 1"))
    conn.commit()
    print(f"Updated appointment 1 date to {today}")
