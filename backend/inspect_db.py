import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import inspect, text

def inspect_database():
    insp = inspect(engine)
    tables = insp.get_table_names()
    print("=== LOCAL POSTGRESQL INSPECTION ===")
    print("Database URL:", engine.url)
    print("Tables detected:", tables)
    
    with engine.connect() as conn:
        for t in tables:
            try:
                cnt = conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
                print(f"  - Table '{t}': {cnt} rows")
            except Exception as e:
                print(f"  - Table '{t}': Error reading count ({e})")
                
        # Check documents detail
        try:
            docs = conn.execute(text('SELECT id, filename, storage_path, file_size, processing_status FROM documents LIMIT 5')).fetchall()
            print("\nSample Documents:")
            for d in docs:
                print(f"  * {d[1]} | Status: {d[4]} | Path: {d[2]} | Size: {d[3]} bytes")
        except Exception as e:
            print(f"Error fetching documents: {e}")

if __name__ == "__main__":
    inspect_database()

