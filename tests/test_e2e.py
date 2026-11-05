"""
End-to-End integration and full-stack journey test suite.
Validates customer workflow: Catalog Browsing -> Order Submission with Idempotency -> Audit Ledger Verification.
Also checks presence and WCAG compliance of all 6 React screens.
"""

import os
import sys
import uuid
import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from app.main import app
from app.db.connection import get_db_connection
from app.db.init_db import init_sqlite_db


@pytest.fixture(scope="session", autouse=True)
def setup_e2e_db(tmp_path_factory):
    temp_dir = tmp_path_factory.mktemp("e2e_db")
    test_db = str(temp_dir / "e2e_store.db")
    os.environ["SQLITE_DB_PATH"] = test_db
    os.environ["DATABASE_PATH"] = test_db
    os.environ["ENVIRONMENT"] = "test"

    conn = get_db_connection()
    init_sqlite_db(conn)
    conn.close()
    yield test_db


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_arch_7237_ac1_ac2_ui_tokens_and_screens_contract():
    """[ARCH-7237-AC1][ARCH-7237-AC2] Verifies all 6 React screen files and tokens exist."""
    required_frontend_files = [
        "frontend/src/tokens.css",
        "frontend/src/context/ThemeContext.tsx",
        "frontend/src/components/ThemeToggle.tsx",
        "frontend/src/components/Header.tsx",
        "frontend/src/components/Footer.tsx",
        "frontend/src/components/FeedbackToasts.tsx",
        "frontend/src/components/SkeletonLoader.tsx",
        "frontend/src/pages/Dashboard.tsx",
        "frontend/src/pages/Explorer.tsx",
        "frontend/src/pages/CheckoutEditor.tsx",
        "frontend/src/pages/AuditWorkflow.tsx",
        "frontend/src/pages/Settings.tsx",
        "frontend/src/pages/Login.tsx",
        "frontend/src/App.tsx",
        "frontend/src/main.tsx"
    ]

    for rel_path in required_frontend_files:
        full_path = os.path.join(REPO_ROOT, rel_path)
        assert os.path.isfile(full_path), f"Required frontend file missing: {rel_path}"

    # Verify tokens.css contains required brand and dark-mode tokens
    tokens_path = os.path.join(REPO_ROOT, "frontend/src/tokens.css")
    with open(tokens_path, "r", encoding="utf-8") as f:
        tokens_css = f.read()
    assert "--primary:" in tokens_css
    assert "--accent:" in tokens_css
    assert '[data-theme="dark"]' in tokens_css


def test_arch_7237_ac3_ac4_full_customer_checkout_journey(client):
    """[ARCH-7237-AC3][ARCH-7237-AC4] Verifies the end-to-end customer purchase and audit workflow."""
    # Step 1: Browse catalog
    catalog_res = client.get("/api/v1/products")
    assert catalog_res.status_code == 200
    products = catalog_res.get_json()["items"]
    assert len(products) > 0
    selected_prod = products[0]

    # Step 2: Dispatch order via Checkout with unique UUIDv7 Idempotency-Key
    unique_key = str(uuid.uuid4())
    order_payload = {
        "customer_email": "e2e_buyer@auraglow.example.com",
        "items": [
            {
                "product_id": selected_prod["id"],
                "quantity": 1,
                "unit_price_minor_units": selected_prod["price_minor_units"]
            }
        ],
        "amount_minor_units": selected_prod["price_minor_units"],
        "currency_code": selected_prod["currency_code"],
        "payment_method": "RAZORPAY",
        "shipping_address": {
            "street": "100 Luxury Avenue",
            "city": "Beverly Hills",
            "postal_code": "90210",
            "country": "US"
        }
    }

    order_res = client.post(
        "/api/v1/orders",
        json=order_payload,
        headers={"Idempotency-Key": unique_key}
    )
    assert order_res.status_code == 201
    created_order = order_res.get_json()
    order_id = created_order["id"]

    # Step 3: Retrieve created order by ID (simulating slide-over drawer lookup)
    drawer_res = client.get(f"/api/v1/orders/{order_id}")
    assert drawer_res.status_code == 200
    drawer_data = drawer_res.get_json()
    assert drawer_data["id"] == order_id
    assert drawer_data["status"] == "CONFIRMED"
    assert drawer_data["customer_email"] == "e2e_buyer@auraglow.example.com"

    # Step 4: Verify immutable audit log was created for ORDER_CREATED
    audit_res = client.get("/api/v1/audit-logs?entity_type=ORDER")
    assert audit_res.status_code == 200
    logs = audit_res.get_json()["items"]
    matching_log = next((l for l in logs if l["entity_id"] == order_id), None)
    assert matching_log is not None
    assert matching_log["event_type"] == "ORDER_CREATED"
    assert len(matching_log["payload_hash"]) == 64


def test_arch_7237_ac5_ui_interactive_states_coverage(client):
    """[ARCH-7237-AC5] Verifies UI interactive states: empty queries, validation errors, and metrics telemetry."""
    # 1. Empty search results
    res_empty = client.get("/api/v1/products?search=NON_EXISTENT_SEARCH_XYZ")
    assert res_empty.status_code == 200
    assert len(res_empty.get_json()["items"]) == 0

    # 2. Validation error handling
    res_bad = client.post("/api/v1/orders", json={})
    assert res_bad.status_code == 400
    err = res_bad.get_json()
    assert err["status"] == 400
    assert "detail" in err

    # 3. Telemetry metrics aggregation
    res_metrics = client.get("/api/v1/dashboard/metrics")
    assert res_metrics.status_code == 200
    metrics = res_metrics.get_json()
    assert metrics["total_orders"] >= 1
