"""
Order Management Routes with Idempotency Enforcement (ARCH-7237)
"""
from flask import Blueprint, request, jsonify
from app.models.order import Order
from app.models.audit import AuditLog

orders_bp = Blueprint("orders", __name__)

@orders_bp.route("/api/v1/orders", methods=["GET"])
def list_orders():
    """List orders with status filter and cursor pagination."""
    status = request.args.get("status")
    page_size = int(request.args.get("page_size", 25))

    items = Order.get_all(status=status, limit=page_size)
    return jsonify({
        "items": items,
        "total_count": len(items),
        "next_cursor": f"cursor-{len(items)}" if len(items) == page_size else None
    }), 200

@orders_bp.route("/api/v1/orders", methods=["POST"])
def create_order():
    """Submit and validate order with mandatory UUIDv7 Idempotency-Key."""
    idempotency_key = request.headers.get("Idempotency-Key")
    if not idempotency_key or not idempotency_key.strip():
        return jsonify({
            "type": "https://api.enterprise.internal/errors/validation-error",
            "title": "Bad Request",
            "status": 400,
            "detail": "Missing mandatory 'Idempotency-Key' header on order submission."
        }), 400

    clean_key = idempotency_key.strip()
    existing = Order.find_by_idempotency_key(clean_key)
    if existing:
        return jsonify({
            "type": "https://api.enterprise.internal/errors/conflict",
            "title": "Conflict",
            "status": 409,
            "detail": f"An order with Idempotency-Key '{clean_key}' was already executed."
        }), 409

    payload = request.get_json(silent=True) or {}
    items = payload.get("items") or []
    if not items and "total_amount" not in payload and "amount_minor_units" not in payload:
        return jsonify({
            "type": "https://api.enterprise.internal/errors/validation-error",
            "title": "Unprocessable Entity",
            "status": 422,
            "detail": "Order must contain at least one line item."
        }), 422

    tenant_id = request.headers.get("X-Tenant-ID", "a0000000-0000-0000-0000-000000000001")
    order = Order.create(payload, clean_key, tenant_id=tenant_id)

    # Record audit log
    AuditLog.record(
        entity_type="ORDER",
        entity_id=str(order.get("id", "new")),
        action="ORDER_CREATED",
        actor_id=payload.get("customer_email", "guest"),
        diff={"order_code": order.get("order_code"), "amount": order.get("amount")},
        tenant_id=tenant_id
    )

    return jsonify(order), 201

@orders_bp.route("/api/v1/orders/<int:order_id>", methods=["GET"])
def get_order(order_id: int):
    """Retrieve full order details including line items and payment status."""
    order = Order.get_by_id(order_id)
    if not order:
        return jsonify({
            "type": "about:blank",
            "title": "Not Found",
            "status": 404,
            "detail": f"Order {order_id} not found."
        }), 404
    return jsonify(order), 200
