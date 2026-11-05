"""
Store Governance & Settings Routes (ARCH-7237)
"""
import json
from flask import Blueprint, request, jsonify
from app.db.connection import query_db, execute_db
from app.models.audit import AuditLog

settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/api/v1/settings", methods=["GET"])
def get_settings():
    """Retrieve store settings including payment gateways and inventory thresholds."""
    row = query_db("SELECT * FROM settings WHERE id = 1", one=True)
    if not row:
        return jsonify({
            "payment_gateways": {"razorpay": True, "paypal": True, "cod": True},
            "inventory_alert_threshold": 15,
            "rbac_roles": {"admin": ["read", "write", "delete"], "operator": ["read", "write"]},
            "status": "ACTIVE"
        }), 200

    gateways = row.get("payment_gateways")
    if isinstance(gateways, str):
        try:
            gateways = json.loads(gateways)
        except Exception:
            gateways = {"razorpay": True, "paypal": True, "cod": True}

    roles = row.get("rbac_roles")
    if isinstance(roles, str):
        try:
            roles = json.loads(roles)
        except Exception:
            roles = {"admin": ["read", "write", "delete"], "operator": ["read", "write"]}

    return jsonify({
        "payment_gateways": gateways or {"razorpay": True, "paypal": True, "cod": True},
        "inventory_alert_threshold": row.get("inventory_alert_threshold", 15),
        "rbac_roles": roles or {"admin": ["read", "write", "delete"], "operator": ["read", "write"]},
        "status": row.get("status", "ACTIVE")
    }), 200

@settings_bp.route("/api/v1/settings", methods=["PUT"])
def update_settings():
    """Update store settings with audit logging."""
    payload = request.get_json(silent=True) or {}
    gateways = json.dumps(payload.get("payment_gateways", {"razorpay": True, "paypal": True, "cod": True}))
    threshold = int(payload.get("inventory_alert_threshold", 15))
    roles = json.dumps(payload.get("rbac_roles", {"admin": ["read", "write", "delete"]}))

    execute_db(
        """
        UPDATE settings
        SET payment_gateways = %s, inventory_alert_threshold = %s, rbac_roles = %s
        WHERE id = 1
        """,
        (gateways, threshold, roles)
    )

    AuditLog.record(
        entity_type="settings",
        entity_id="1",
        action="UPDATE",
        actor_id="admin@cosmetics.atelier",
        diff=payload
    )

    res, _ = get_settings()
    data = res.get_json()
    data["status"] = "updated"
    return jsonify(data), 200
