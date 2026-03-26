import sys
import os
sys.path.append(os.getcwd())

from app.database import engine
from sqlalchemy import text

def add_missing_columns():
    with engine.connect() as conn:
        print("Checking for missing columns...")
        try:
            # Check if password_changed_at exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='password_changed_at'"))
            if not result.fetchone():
                print("Adding column 'password_changed_at' to 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE"))
                conn.commit()
                print("Column 'password_changed_at' added successfully.")
            else:
                print("Column 'password_changed_at' already exists.")

            # Fix patients.user_id FK constraint to have ON DELETE CASCADE
            print("Checking patients.user_id foreign key constraint...")
            # Find the constraint name
            fk_query = text("""
                SELECT constraint_name 
                FROM information_schema.key_column_usage 
                WHERE table_name='patients' AND column_name='user_id' 
                AND table_schema='public'
            """)
            fk_result = conn.execute(fk_query).fetchone()
            if fk_result:
                constraint_name = fk_result[0]
                print(f"Dropping and recreating constraint '{constraint_name}' with ON DELETE CASCADE...")
                conn.execute(text(f"ALTER TABLE patients DROP CONSTRAINT \"{constraint_name}\""))
                conn.execute(text("ALTER TABLE patients ADD CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE"))
                conn.commit()
                print("Constraint updated to ON DELETE CASCADE.")
            
        except Exception as e:
            print(f"Error updating database: {e}")

if __name__ == "__main__":
    add_missing_columns()
