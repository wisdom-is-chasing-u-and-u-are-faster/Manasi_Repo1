"""
Unified Database Connection & Query Helper for PostgreSQL and SQLite.
"""
import os
import sqlite3
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent

def get_db_connection():
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://") or db_url.startswith("postgresql://"):
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(db_url)
            return conn
        except Exception:
            pass

    # SQLite fallback
    sqlite_path = os.environ.get("SQLITE_DB_PATH") or os.environ.get("DATABASE_PATH") or str(BASE_DIR / "store.db")
    db_file = Path(sqlite_path)
    if not db_file.exists():
        from .init_db import init_db
        init_db(str(db_file))

    conn = sqlite3.connect(str(db_file))
    conn.row_factory = sqlite3.Row
    return conn

def query_db(query: str, args: tuple = (), one: bool = False) -> Any:
    conn = get_db_connection()
    engine = "sqlite" if isinstance(conn, sqlite3.Connection) else "postgres"
    try:
        cur = conn.cursor()
        # In SQLite, replace %s with ?
        if engine == "sqlite":
            query = query.replace("%s", "?")
        cur.execute(query, args)
        rows = cur.fetchall()
        cur.close()
        rv = [dict(r) for r in rows] if (rows and isinstance(rows[0], sqlite3.Row)) else rows
        return (rv[0] if rv else None) if one else rv
    finally:
        conn.close()

def execute_db(query: str, args: tuple = ()) -> int:
    conn = get_db_connection()
    engine = "sqlite" if isinstance(conn, sqlite3.Connection) else "postgres"
    try:
        cur = conn.cursor()
        if engine == "sqlite":
            query = query.replace("%s", "?")
        cur.execute(query, args)
        conn.commit()
        last_id = cur.lastrowid
        cur.close()
        return last_id
    finally:
        conn.close()
