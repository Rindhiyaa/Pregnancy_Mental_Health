
import psycopg2

def check_schema():
    try:
        conn = psycopg2.connect(
            dbname="ml_db",
            user="mluser",
            password="mlpass",
            host="localhost"
        )
        cur = conn.cursor()
        
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'assessments';")
        print("Columns in 'assessments':")
        for row in cur.fetchall():
            print(f"- {row[0]}")
            
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'patients';")
        print("\nColumns in 'patients':")
        for row in cur.fetchall():
            print(f"- {row[0]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_schema()
