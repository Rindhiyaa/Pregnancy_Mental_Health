
import psycopg2

def debug_data():
    try:
        conn = psycopg2.connect(
            dbname="ml_db",
            user="mluser",
            password="mlpass",
            host="localhost"
        )
        cur = conn.cursor()
        
        print("--- PATIENTS ---")
        cur.execute("SELECT id, name, email FROM patients;")
        for row in cur.fetchall():
            print(f"ID: {row[0]} | Name: {row[1]} | Email: {row[2]}")
            
        print("\n--- ASSESSMENTS ---")
        cur.execute("SELECT id, patient_name, patient_id FROM assessments;")
        for row in cur.fetchall():
            print(f"ID: {row[0]} | Name: {row[1]} | PatientID: {row[2]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_data()
