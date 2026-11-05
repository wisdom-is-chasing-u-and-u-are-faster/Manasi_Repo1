"""
Product Catalog Routes (ARCH-7237)
"""
from flask import Blueprint, request, jsonify
from app.models.catalog import Product

products_bp = Blueprint("products", __name__)

@products_bp.route("/api/v1/products", methods=["GET"])
def list_products():
    """List cosmetics catalog with category filter, search, and pagination."""
    category = request.args.get("category")
    search = request.args.get("search")
    page_size = int(request.args.get("page_size", 25))

    items = Product.get_all(category=category, search=search, limit=page_size)
    return jsonify({
        "items": items,
        "total_count": len(items),
        "next_cursor": f"cursor-{len(items)}" if len(items) == page_size else None
    }), 200

@products_bp.route("/api/v1/products/<int:product_id>", methods=["GET"])
def get_product(product_id: int):
    """Retrieve single product by ID."""
    product = Product.get_by_id(product_id)
    if not product:
        return jsonify({
            "type": "about:blank",
            "title": "Not Found",
            "status": 404,
            "detail": f"Product {product_id} not found."
        }), 404
    return jsonify(product), 200
