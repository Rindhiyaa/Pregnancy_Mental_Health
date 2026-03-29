import sys
import os
from sqlalchemy import inspect, text

# Ensure we can import from the 'app' module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models import User, RecoveryRequest, RecoveryChallenge 

def migrate():
    print("--- Starting Database Migration for Recovery System ---")
    inspector = inspect(engine)
    
    with engine.begin() as conn:
        # 1. Check for missing columns in 'users' table
        print("Checking 'users' table columns...")
        columns = [c['name'] for c in inspector.get_columns('users')]
        
        if 'password_changed_at' not in columns:
            print(">> Adding 'password_changed_at' column to 'users' table...")
            # We use TIMESTAMP WITH TIME ZONE for PostgreSQL
            conn.execute(text("ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL"))
        else:
            print(">> 'password_changed_at' column already exists.")

        # 2. Create ANY missing tables (RecoveryRequest, RecoveryChallenge)
        # SQLAlchemy's create_all won't touch existing tables, but will create new ones.
        print("Checking for missing tables (RecoveryRequest, RecoveryChallenge)...")
        Base.metadata.create_all(bind=engine)
        
    print("\n--- Migration Complete! ---")
    print("Your local database is now synchronized with the latest Recovery System schema.")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\nERROR during migration: {e}")
        print("\nSuggestions:")
        print("1. Ensure your .env file is correctly configured with DB_USER, DB_PASS, etc.")
        print("2. Ensure your PostgreSQL server is running.")
        sys.exit(1)
