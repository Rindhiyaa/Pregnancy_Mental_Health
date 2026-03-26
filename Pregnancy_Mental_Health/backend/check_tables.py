import sys
import os
sys.path.append(os.getcwd())

from app.database import engine
from sqlalchemy import inspect

def inspect_table(table_name):
    inspector = inspect(engine)
    columns = inspector.get_columns(table_name)
    print(f"Columns in the {table_name} table:")
    for column in columns:
        print(f"{column['name']}: {column['type']}")
    
    fks = inspector.get_foreign_keys(table_name)
    print(f"\nForeign Keys in the {table_name} table:")
    for fk in fks:
        print(f"{fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']} (ondelete: {fk.get('options', {}).get('ondelete')})")

if __name__ == "__main__":
    inspect_table("patients")
