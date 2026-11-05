"""
Product Catalog Domain Model (ARCH-7237)
"""
from typing import Dict, List, Optional, Any
from app.db.connection import query_db, execute_db

class Product:
    @staticmethod
    def get_all(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM products WHERE status = 'ACTIVE'"
        params = []
        if category and category.lower() != "all":
            query += " AND LOWER(category) = LOWER(%s)"
            params.append(category)
        if search:
            query += " AND (LOWER(name) LIKE LOWER(%s) OR LOWER(description) LIKE LOWER(%s))"
            params.extend([f"%{search}%", f"%{search}%"])
        query += " ORDER BY id ASC LIMIT %s"
        params.append(limit)
        items = query_db(query, tuple(params))
        for item in items:
            if "price_minor_units" not in item:
                item["price_minor_units"] = item.get("amount_minor_units") or int(float(item.get("price", 0)) * 100)
            if "currency_code" not in item:
                item["currency_code"] = "USD"
        return items

    @staticmethod
    def get_by_id(product_id: int) -> Optional[Dict[str, Any]]:
        item = query_db("SELECT * FROM products WHERE id = %s", (product_id,), one=True)
        if item:
            if "price_minor_units" not in item:
                item["price_minor_units"] = item.get("amount_minor_units") or int(float(item.get("price", 0)) * 100)
            if "currency_code" not in item:
                item["currency_code"] = "USD"
        return item
