"""
Order Domain Model with Idempotency Support (ARCH-7237)
"""
import json
import uuid
from typing import Dict, List, Optional, Any
from app.db.connection import query_db, execute_db

class Order:
    @staticmethod
    def find_by_idempotency_key(key: str) -> Optional[Dict[str, Any]]:
        return query_db("SELECT * FROM orders WHERE idempotency_key = %s", (key,), one=True)

    @staticmethod
    def get_all(status: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM orders"
        params = []
        if status and status.upper() != "ALL":
            query += " WHERE UPPER(status) = UPPER(%s)"
            params.append(status)
        query += " ORDER BY id DESC LIMIT %s"
        params.append(limit)
        orders = query_db(query, tuple(params))
        for o in orders:
            if not o.get("order_number") and o.get("order_code"):
                o["order_number"] = o["order_code"]
        return orders

    @staticmethod
    def get_by_id(order_id: int) -> Optional[Dict[str, Any]]:
        order = query_db("SELECT * FROM orders WHERE id = %s", (order_id,), one=True)
        if not order:
            return None
        items = query_db("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
        order["items"] = items or []
        payment = query_db("SELECT * FROM payments WHERE order_id = %s", (order_id,), one=True)
        order["payment"] = payment
        if not order.get("order_number") and order.get("order_code"):
            order["order_number"] = order["order_code"]
        return order

    @staticmethod
    def create(data: Dict[str, Any], idempotency_key: str, tenant_id: str = "a0000000-0000-0000-0000-000000000001") -> Dict[str, Any]:
        existing = Order.find_by_idempotency_key(idempotency_key)
        if existing:
            return Order.get_by_id(existing["id"])

        order_code = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        customer_name = data.get("customer_name") or data.get("name") or "Valued Guest"
        customer_email = data.get("customer_email") or data.get("email") or "customer@example.com"
        payment_method = data.get("payment_method") or "Razorpay"
        shipping_address = json.dumps(data.get("shipping_address") or {})
        items = data.get("items") or []

        amount_minor = data.get("amount_minor_units")
        if amount_minor is not None:
            total_amount = float(amount_minor) / 100.0
        else:
            total_amount = sum(float(i.get("price", i.get("unit_price_minor_units", 0) / 100.0)) * int(i.get("quantity", 1)) for i in items)
            if total_amount == 0 and "total_amount" in data:
                total_amount = float(data["total_amount"])
            amount_minor = int(total_amount * 100)

        currency_code = data.get("currency_code", "USD")

        order_id = execute_db(
            """
            INSERT INTO orders (
                name, tenant_id, account_id, created_by_user_id, idempotency_key,
                order_code, status, amount_minor_units, currency_code,
                customer_name, customer_email, payment_method, shipping_address,
                order_number, payment_status, shipping_status, amount
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                f"Order {order_code}",
                tenant_id,
                1,
                1,
                idempotency_key,
                order_code,
                "CONFIRMED",
                amount_minor,
                currency_code,
                customer_name,
                customer_email,
                payment_method,
                shipping_address,
                order_code,
                "PAID",
                "PREPARING",
                total_amount
            )
        )

        for item in items:
            product_id = item.get("product_id", 1)
            if isinstance(product_id, str) and not product_id.isdigit():
                prod_fk = 1
            else:
                prod_fk = int(product_id)
            execute_db(
                """
                INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    order_id,
                    prod_fk,
                    item.get("name", "Cosmetic Item"),
                    int(item.get("quantity", 1)),
                    float(item.get("price", float(item.get("unit_price_minor_units", 0)) / 100.0)),
                    float(item.get("subtotal", float(item.get("unit_price_minor_units", 0)) / 100.0 * int(item.get("quantity", 1))))
                )
            )

        return Order.get_by_id(order_id)
