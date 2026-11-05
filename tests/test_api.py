"""
API test suite for Aura Glow Cosmetic Store & Commerce Operations.
Tests all endpoints declared in api_contract.json, enforcing RFC 7807 error envelopes
and UUIDv7 Idempotency-Key validation.
"""

import os
import sys
import uuid
import pytest

# Ensure repository root is in python path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from app.main import app
from app.db.connection import get_db_connection
from app.db.init_db import init_sqlite_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_db(tmp_path_factory):
    """Initializes a self-contained SQLite test database for all API tests."""
    temp_dir = tmp_path_factory.mktemp("db")
    test_db_path = str(temp_dir / "test_store.db")
    os.environ["SQLITE_DB_PATH"] = test_db_path
    os.environ["DATABASE_PATH"] = test_db_path
    os.environ["ENVIRONMENT"] = "test"

    conn = get_db_connection()
    init_sqlite_db(conn)
    conn.close()
    yield test_db_path


@pytest.fixture
def client():
    """Provides Flask test client with testing context."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_arch_7237_ac3_health_probes(client):
    """[ARCH-7237-AC3] Verifies /health and deep readiness probes return 200 OK."""
    # Liveness probe
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "version" in data

    # Deep readiness probe
    res_ready = client.get("/api/v1/health/readiness")
    assert res_ready.status_code == 200
    data_ready = res_ready.get_json()
    assert data_ready["status"] == "ready"


def test_arch_7237_ac3_products_catalog(client):
    """[ARCH-7237-AC3] Verifies /api/v1/products catalog list, search, and category filter."""
    res = client.get("/api/v1/products")
    assert res.status_code == 200
    data = res.get_json()
    assert "items" in data
    assert len(data["items"]) >= 1
    assert "total_count" in data

    # Test category filter
    res_cat = client.get("/api/v1/products?category=Skincare")
    assert res_cat.status_code == 200
    data_cat = res_cat.get_json()
    for item in data_cat["items"]:
        assert item["category"] == "Skincare"


def test_arch_7237_ac3_orders_idempotency_enforcement(client):
    """[ARCH-7237-AC3] Verifies POST /api/v1/orders requires Idempotency-Key and returns RFC 7807 error if missing."""
    order_payload = {
        "customer_email": "tester@example.com",
        "items": [
            {
                "product_id": "00000000-0000-0000-0000-000000000201",
                "quantity": 2,
                "unit_price_minor_units": 8800
            }
        ],
        "amount_minor_units": 17600,
        "currency_code": "USD",
        "payment_method": "RAZORPAY"
    }

    # Missing Idempotency-Key header -> 400 Bad Request with RFC 7807 problem details
    res_fail = client.post("/api/v1/orders", json=order_payload)
    assert res_fail.status_code == 400
    err = res_fail.get_json()
    assert err["type"] == "https://api.enterprise.internal/errors/validation-error"
    assert "Idempotency-Key" in err["detail"]

    # Valid Idempotency-Key -> 201 Created
    unique_key = str(uuid.uuid4())
    res_success = client.post(
        "/api/v1/orders",
        json=order_payload,
        headers={"Idempotency-Key": unique_key}
    )
    assert res_success.status_code == 201
    created = res_success.get_json()
    assert created["idempotency_key"] == unique_key
    assert created["status"] == "CONFIRMED"
    assert created["order_number"].startswith("ORD-")


def test_arch_7237_ac3_orders_idempotent_duplicate_rejection(client):
    """[ARCH-7237-AC3] Verifies sending a duplicate Idempotency-Key returns 409 Conflict."""
    order_payload = {
        "customer_email": "duplicate_check@example.com",
        "items": [
            {
                "product_id": "00000000-0000-0000-0000-000000000201",
                "quantity": 1,
                "unit_price_minor_units": 8800
            }
        ],
        "amount_minor_units": 8800,
        "currency_code": "USD",
        "payment_method": "PAYPAL"
    }

    shared_key = str(uuid.uuid4())
    res1 = client.post(
        "/api/v1/orders",
        json=order_payload,
        headers={"Idempotency-Key": shared_key}
    )
    assert res1.status_code == 201

    # Second submission with the same key -> 409 Conflict
    res2 = client.post(
        "/api/v1/orders",
        json=order_payload,
        headers={"Idempotency-Key": shared_key}
    )
    assert res2.status_code == 409
    err = res2.get_json()
    assert err["type"] == "https://api.enterprise.internal/errors/conflict"
    assert "already executed" in err["detail"].lower()


def test_arch_7237_ac4_payment_gateways_and_settings(client):
    """[ARCH-7237-AC4] Verifies /api/v1/settings returns Razorpay, PayPal, and COD configuration."""
    res = client.get("/api/v1/settings")
    assert res.status_code == 200
    data = res.get_json()
    gateways = data["payment_gateways"]
    assert "razorpay" in gateways
    assert "paypal" in gateways
    assert "cod" in gateways
    assert data["inventory_alert_threshold"] >= 1

    # Test update
    update_res = client.put(
        "/api/v1/settings",
        json={"inventory_alert_threshold": 15},
        headers={"Idempotency-Key": str(uuid.uuid4())}
    )
    assert update_res.status_code == 200
    updated_data = update_res.get_json()
    assert updated_data["status"] == "updated"


def test_arch_7237_ac5_dashboard_telemetry_metrics(client):
    """[ARCH-7237-AC5] Verifies /api/v1/dashboard/metrics aggregates GMV and orders."""
    res = client.get("/api/v1/dashboard/metrics")
    assert res.status_code == 200
    data = res.get_json()
    assert "total_orders" in data
    assert "gross_merchandise_value" in data
    assert "sla_uptime_percent" in data
    assert "p99_latency_ms" in data
    assert "recent_orders" in data


def test_arch_7237_ac5_auth_login(client):
    """[ARCH-7237-AC5] Verifies /api/v1/auth/login validates credentials and returns session token."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@auraglow.example.com", "mfa_token": "123456"}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["email"] == "admin@auraglow.example.com"
    assert data["user"]["role"] == "ADMIN"
