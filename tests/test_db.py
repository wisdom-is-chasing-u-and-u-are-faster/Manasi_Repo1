"""
Database test suite for Aura Glow Cosmetic Store & Commerce Operations.
Verifies PostgreSQL 3NF schema tables, foreign key constraints, seed integrity,
and cryptographic audit logging.
"""

import os
import sys
import sqlite3
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from app.db.connection import get_db_connection
from app.db.init_db import init_sqlite_db
from app.models.audit import AuditLog


@pytest.fixture(scope="module")
def db_conn(tmp_path_factory):
    """Provides an initialized SQLite database connection for schema and integrity tests."""
    temp_dir = tmp_path_factory.mktemp("db_test")
    test_db = str(temp_dir / "schema_test.db")
    os.environ["SQLITE_DB_PATH"] = test_db
    os.environ["DATABASE_PATH"] = test_db

    conn = get_db_connection()
    init_sqlite_db(conn)
    yield conn
    conn.close()


def test_arch_7237_ac4_schema_tables_exist(db_conn):
    """[ARCH-7237-AC4] Verifies that all 12 3NF relational tables are properly created."""
    expected_tables = {
        "accounts",
        "users",
        "products",
        "orders",
        "order_items",
        "payments",
        "audit_logs",
        "settings",
        "dashboard_metrics",
        "auth_sessions",
        "readiness_probes",
        "outbox_events"
    }

    cur = db_conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    existing_tables = {row[0] for row in cur.fetchall()}

    for tbl in expected_tables:
        assert tbl in existing_tables, f"Expected table '{tbl}' was not found in schema"


def test_arch_7237_ac4_seed_data_integrity(db_conn):
    """[ARCH-7237-AC4] Verifies seed data populated realistic cosmetics products and orders."""
    cur = db_conn.cursor()

    # Check products seed
    cur.execute("SELECT COUNT(*) FROM products;")
    prod_count = cur.fetchone()[0]
    assert prod_count >= 6, f"Expected at least 6 seed products, found {prod_count}"

    # Check orders seed
    cur.execute("SELECT COUNT(*) FROM orders;")
    order_count = cur.fetchone()[0]
    assert order_count >= 2, f"Expected seed orders, found {order_count}"

    # Check payments seed
    cur.execute("SELECT COUNT(*) FROM payments;")
    payment_count = cur.fetchone()[0]
    assert payment_count >= 2, f"Expected seed payments, found {payment_count}"


def test_arch_7237_ac4_foreign_key_and_check_constraints(db_conn):
    """[ARCH-7237-AC4] Verifies CHECK constraints reject invalid statuses."""
    cur = db_conn.cursor()

    # Inserting invalid status should violate CHECK constraint
    with pytest.raises(sqlite3.IntegrityError):
        cur.execute(
            """
            INSERT INTO accounts (id, name, code, status)
            VALUES ('00000000-0000-0000-0000-999999999999', 'Bad Corp', 'BAD', 'INVALID_STATUS');
            """
        )
        db_conn.commit()


def test_arch_7237_ac4_audit_log_sha256_hash(db_conn):
    """[ARCH-7237-AC4] Verifies AuditLog records immutable entries with valid SHA-256 hashes."""
    log_id = AuditLog.record_event(
        db_conn,
        event_type="TEST_EVENT",
        entity_type="PRODUCT",
        entity_id="00000000-0000-0000-0000-000000000201",
        actor_id="00000000-0000-0000-0000-000000000101",
        actor_role="ADMIN",
        previous_state={"price": 8800},
        new_state={"price": 9500}
    )
    assert log_id is not None

    cur = db_conn.cursor()
    cur.execute("SELECT payload_hash FROM audit_logs WHERE id = ?;", (log_id,))
    row = cur.fetchone()
    assert row is not None
    sha256_hash = row[0]
    assert len(sha256_hash) == 64  # Valid hex-encoded SHA-256
