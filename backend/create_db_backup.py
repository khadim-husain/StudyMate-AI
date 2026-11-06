import os
import subprocess
import sys

def backup_database():
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    pg_dump_path = r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
    if not os.path.exists(pg_dump_path):
        pg_dump_path = "pg_dump"
        
    custom_dump = os.path.join(backup_dir, "studymate_db_backup.dump")
    sql_dump = os.path.join(backup_dir, "studymate_db_backup.sql")
    
    env = os.environ.copy()
    env["PGPASSWORD"] = "admin"
    
    print(f"Creating SQL plain text dump to {sql_dump}...")
    cmd_sql = [
        pg_dump_path,
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "-d", "studymate_db",
        "--clean",
        "--if-exists",
        "-F", "p",
        "-f", sql_dump
    ]
    res_sql = subprocess.run(cmd_sql, env=env, capture_output=True, text=True)
    if res_sql.returncode != 0:
        print("SQL dump error:", res_sql.stderr)
        return False
        
    print(f"Creating custom format binary dump to {custom_dump}...")
    cmd_custom = [
        pg_dump_path,
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "-d", "studymate_db",
        "-F", "c",
        "-b",
        "-v",
        "-f", custom_dump
    ]
    res_custom = subprocess.run(cmd_custom, env=env, capture_output=True, text=True)
    if res_custom.returncode != 0:
        print("Custom dump error:", res_custom.stderr)
        return False
        
    sql_size = os.path.getsize(sql_dump) / (1024 * 1024)
    custom_size = os.path.getsize(custom_dump) / (1024 * 1024)
    print(f"SUCCESS: Database backup created successfully!")
    print(f"  - SQL Dump: {sql_dump} ({sql_size:.2f} MB)")
    print(f"  - Custom Binary Dump: {custom_dump} ({custom_size:.2f} MB)")
    return True

if __name__ == "__main__":
    if not backup_database():
        sys.exit(1)

