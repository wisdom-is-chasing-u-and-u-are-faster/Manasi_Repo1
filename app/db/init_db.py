"""
Database Initialization Module for Online Cosmetic Store Website.
Supports both Cloud SQL PostgreSQL and local/testing SQLite databases.
"""
import os
import sys
import re
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SCHEMA_FILE = BASE_DIR / "db" / "schema.sql"
SEED_FILE = BASE_DIR / "db" / "seed.sql"

def normalize_postgres_for_sqlite(sql_text: str) -> str:
    """Normalizes PostgreSQL DDL/DML for SQLite compatibility."""
    s = sql_text
    # Dollar-quoted function/trigger blocks
    s = re.sub(r"\$[a-zA-Z0-9_]*\$.*?\$[a-zA-Z0-9_]*\$", "''", s, flags=re.DOTALL)
    # Postgres-only statement blocks
    s = re.sub(
        r"^\s*(?:CREATE\s+(?:OR\s+REPLACE\s+)?(?:EXTENSION|TYPE|FUNCTION|PROCEDURE|DOMAIN|SEQUENCE)|"
        r"ALTER\s+TABLE\s+\S+\s+(?:ADD\s+CONSTRAINT|DROP\s+CONSTRAINT|ENABLE\s+ROW|FORCE\s+ROW|OWNER\s+TO)|"
        r"COMMENT\s+ON|GRANT\s+|REVOKE\s+|SET\s+)\b[^;]*;",
        "",
        s,
        flags=re.IGNORECASE | re.MULTILINE,
    )
    s = re.sub(r"\bUSING\s+(?:btree|gin|gist|spgist|brin|hash)\b", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\bCREATE\s+INDEX\s+CONCURRENTLY\b", "CREATE INDEX", s, flags=re.IGNORECASE)
    s = re.sub(r"\bBIGSERIAL\s+PRIMARY\s+KEY\b", "INTEGER PRIMARY KEY AUTOINCREMENT", s, flags=re.IGNORECASE)
    s = re.sub(r"\bSERIAL\s+PRIMARY\s+KEY\b", "INTEGER PRIMARY KEY AUTOINCREMENT", s, flags=re.IGNORECASE)
    s = re.sub(r"\b(?:BIGSERIAL|SMALLSERIAL|SERIAL)\b", "INTEGER", s, flags=re.IGNORECASE)
    s = re.sub(r"\bGENERATED\s+(?:ALWAYS|BY\s+DEFAULT)\s+AS\s+IDENTITY(?:\s*\([^)]*\))?", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\bJSONB\b", "TEXT", s, flags=re.IGNORECASE)
    s = re.sub(r"\bTIMESTAMPTZ\b", "TIMESTAMP", s, flags=re.IGNORECASE)
    s = re.sub(r"\bTIMESTAMP\s+WITH(?:OUT)?\s+TIME\s+ZONE\b", "TIMESTAMP", s, flags=re.IGNORECASE)
    s = re.sub(r"\bUUID\b", "TEXT", s, flags=re.IGNORECASE)
    s = re.sub(r"\bBYTEA\b", "BLOB", s, flags=re.IGNORECASE)
    s = re.sub(r"\bgen_random_uuid\s*\(\s*\)", "'00000000-0000-0000-0000-000000000000'", s, flags=re.IGNORECASE)
    s = re.sub(r"\buuid_generate_v4\s*\(\s*\)", "'00000000-0000-0000-0000-000000000000'", s, flags=re.IGNORECASE)
    s = re.sub(r"\bNOW\s*\(\s*\)", "CURRENT_TIMESTAMP", s, flags=re.IGNORECASE)
    s = re.sub(r"::[a-zA-Z_][a-zA-Z0-9_]*(\[\])?", "", s)
    return s

def init_sqlite_db(conn) -> bool:
    """Initializes schema and seeds into an open SQLite connection."""
    if isinstance(conn, tuple):
        conn = conn[0]
    if SCHEMA_FILE.exists():
        schema_sql = normalize_postgres_for_sqlite(SCHEMA_FILE.read_text(encoding="utf-8"))
        conn.executescript(schema_sql)
    if SEED_FILE.exists():
        seed_sql = normalize_postgres_for_sqlite(SEED_FILE.read_text(encoding="utf-8"))
        conn.executescript(seed_sql)
    conn.commit()
    return True

def init_db(db_path: str = None) -> bool:
    """Initializes schema and seeds into SQLite or PostgreSQL."""
    sqlite_target = db_path or os.environ.get("SQLITE_DB_PATH") or os.environ.get("DATABASE_PATH")
    db_url = os.environ.get("DATABASE_URL", "")

    if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
        try:
            import psycopg2
            conn = psycopg2.connect(db_url)
            with conn.cursor() as cur:
                if SCHEMA_FILE.exists():
                    cur.execute(SCHEMA_FILE.read_text(encoding="utf-8"))
                if SEED_FILE.exists():
                    cur.execute(SEED_FILE.read_text(encoding="utf-8"))
            conn.commit()
            conn.close()
            print("Successfully initialized PostgreSQL database.")
            return True
        except Exception as e:
            print(f"PostgreSQL connection warning/error: {e}")
            # Fall through to SQLite fallback if needed

    target_file = sqlite_target or str(BASE_DIR / "store.db")
    print(f"Initializing SQLite database at: {target_file}")
    conn = sqlite3.connect(target_file)
    try:
        if SCHEMA_FILE.exists():
            schema_sql = normalize_postgres_for_sqlite(SCHEMA_FILE.read_text(encoding="utf-8"))
            conn.executescript(schema_sql)
        if SEED_FILE.exists():
            seed_sql = normalize_postgres_for_sqlite(SEED_FILE.read_text(encoding="utf-8"))
            conn.executescript(seed_sql)
        conn.commit()
        print("Successfully initialized SQLite database.")
        return True
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
