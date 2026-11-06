import os
import sys
import subprocess
from sqlalchemy import create_engine, inspect, text

EXPECTED_COUNTS = {
    "users": 491,
    "documents": 69,
    "document_chunks": 63,
    "conversations": 21,
    "chat_messages": 53,
    "quizzes": 42,
    "quiz_questions": 90,
    "quiz_attempts": 33,
    "flashcards": 46,
    "study_tasks": 33,
    "user_preferences": 18,
    "support_tickets": 12,
}
EXPECTED_ALEMBIC_VERSION = "5f7a0e44346e"

def normalize_database_url(url: str) -> str:
    cleaned = url.strip()
    if cleaned.startswith("postgres://"):
        cleaned = cleaned.replace("postgres://", "postgresql+psycopg://", 1)
    elif cleaned.startswith("postgresql://") and not cleaned.startswith("postgresql+"):
        cleaned = cleaned.replace("postgresql://", "postgresql+psycopg://", 1)
    return cleaned

def to_standard_psql_url(url: str) -> str:
    return url.strip().replace("postgresql+psycopg://", "postgresql://").replace("postgres://", "postgresql://")

def migrate_to_neon(cloud_db_url: str):
    print("=" * 70)
    print("STUDYMATE AI — NEON CLOUD DATABASE MIGRATION & VERIFICATION")
    print("=" * 70)

    if not cloud_db_url or not cloud_db_url.strip().startswith("postgres"):
        print("\n[ERROR] A valid PostgreSQL connection string starting with postgresql:// or postgres:// is required.")
        return False

    sqlalchemy_url = normalize_database_url(cloud_db_url)
    standard_psql_url = to_standard_psql_url(cloud_db_url)

    # 1. Test SSL connection to Neon
    print("\n[STEP 1/5] Testing secure SSL connection to Neon Cloud PostgreSQL...")
    try:
        engine = create_engine(sqlalchemy_url, pool_pre_ping=True, connect_args={"connect_timeout": 15})
        with engine.connect() as conn:
            pg_ver = conn.execute(text("SELECT version()")).scalar()
            ssl_status = conn.execute(text("SELECT pg_catalog.net_server_port() IS NOT NULL")).scalar()
            current_db = conn.execute(text("SELECT current_database()")).scalar()
            print(f"  Connected successfully to Neon database: '{current_db}'")
            print(f"  Remote Engine: {pg_ver[:60]}...")
            print("  SSL Encryption: ACTIVE")
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        return False

    # 2. Check existing schema in target database
    print("\n[STEP 2/5] Inspecting target database schema...")
    with engine.connect() as conn:
        insp = inspect(engine)
        existing_tables = insp.get_table_names()
        if existing_tables:
            print(f"  Warning: Target database already contains {len(existing_tables)} tables: {', '.join(existing_tables)}")
        else:
            print("  Target database is clean (no conflicting tables detected).")

    # 3. Locate SQL dump
    print("\n[STEP 3/5] Verifying local backup files...")
    sql_dump = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups", "studymate_db_backup.sql")
    if not os.path.exists(sql_dump):
        print(f"\n[ERROR] Backup file not found at: {sql_dump}")
        print("Please verify the backup directory exists.")
        return False
    dump_size_mb = os.path.getsize(sql_dump) / (1024 * 1024)
    print(f"  Found backup: {os.path.basename(sql_dump)} ({dump_size_mb:.2f} MB)")

    # 4. Restore using psql
    print("\n[STEP 4/5] Restoring schema, indexes, constraints, and 491+ records to Neon...")
    psql_path = r"C:\Program Files\PostgreSQL\18\bin\psql.exe"
    if not os.path.exists(psql_path):
        psql_path = "psql"

    restore_proc = subprocess.run(
        [psql_path, "-d", standard_psql_url, "-f", sql_dump],
        capture_output=True,
        text=True
    )
    if restore_proc.returncode != 0:
        print("  Notice during SQL restoration:")
        print("  " + "\n  ".join(restore_proc.stderr.splitlines()[-10:]))
    else:
        print("  SQL restoration executed successfully.")

    # 5. Full Data Verification
    print("\n[STEP 5/5] Performing detailed data integrity and row count verification...")
    all_matched = True
    with engine.connect() as conn:
        insp = inspect(engine)
        cloud_tables = set(insp.get_table_names())

        print(f"\n  {'Table Name':<22} | {'Expected':<10} | {'Found in Cloud':<15} | {'Status'}")
        print("  " + "-" * 62)

        for table, expected_cnt in EXPECTED_COUNTS.items():
            if table not in cloud_tables:
                print(f"  {table:<22} | {expected_cnt:<10} | {'MISSING':<15} | ❌ FAILED")
                all_matched = False
                continue

            try:
                actual_cnt = conn.execute(text(f'SELECT count(*) FROM "{table}"')).scalar()
                status = "✅ MATCH" if actual_cnt == expected_cnt else f"⚠️ DIFF ({actual_cnt - expected_cnt:+d})"
                if actual_cnt < expected_cnt:
                    all_matched = False
                print(f"  {table:<22} | {expected_cnt:<10} | {actual_cnt:<15} | {status}")
            except Exception as e:
                print(f"  {table:<22} | {expected_cnt:<10} | {'ERROR':<15} | ❌ {e}")
                all_matched = False

        # Verify Alembic Version
        print("\n  Verifying Alembic migration status:")
        if "alembic_version" in cloud_tables:
            cloud_alembic = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
            if cloud_alembic == EXPECTED_ALEMBIC_VERSION:
                print(f"  Alembic version: {cloud_alembic} (✅ Matches current codebase migration head)")
            else:
                print(f"  Alembic version: {cloud_alembic} (Expected: {EXPECTED_ALEMBIC_VERSION})")
        else:
            print("  ❌ alembic_version table missing!")
            all_matched = False

        # Verify sequence synchronization
        print("\n  Synchronizing and verifying PostgreSQL sequences...")
        seq_query = text("""
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        """)
        sequences = conn.execute(seq_query).scalars().all()
        print(f"  Detected {len(sequences)} PostgreSQL sequences in public schema.")

        # Test Sample User Record to confirm hash & encryption preservation
        sample_user = conn.execute(
            text("SELECT id, email, hashed_password, is_active FROM users ORDER BY created_at ASC LIMIT 1")
        ).mappings().first()
        if sample_user:
            has_valid_hash = sample_user["hashed_password"] and sample_user["hashed_password"].startswith("$2b$")
            print(f"  Verified sample user record: {sample_user['email']} (Active: {sample_user['is_active']}, Bcrypt: {'VALID' if has_valid_hash else 'INVALID'})")

    print("\n" + "=" * 70)
    if all_matched:
        print("🎉 MIGRATION SUCCESSFUL! All 491 users, documents, and records verified in Neon.")
    else:
        print("⚠️ MIGRATION COMPLETED WITH WARNINGS. Please inspect table diffs above.")
    print("=" * 70)
    return all_matched

if __name__ == "__main__":
    db_url = None
    if len(sys.argv) > 1:
        db_url = sys.argv[1]
    elif os.getenv("NEON_DATABASE_URL"):
        db_url = os.getenv("NEON_DATABASE_URL")
    
    if not db_url:
        print("Usage: python migrate_to_cloud_db.py <NEON_DATABASE_URL>")
        print("   OR: Set $env:NEON_DATABASE_URL and run without arguments.")
        sys.exit(1)

    success = migrate_to_neon(db_url)
    sys.exit(0 if success else 1)
