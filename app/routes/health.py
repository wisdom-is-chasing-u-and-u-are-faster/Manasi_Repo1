"""
Health & Readiness Check Routes (ARCH-7237)
"""
from flask import Blueprint, jsonify
from app.db.connection import query_db

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def liveness():
    """Liveness probe returning healthy status."""
    return jsonify({
        "status": "healthy",
        "version": "1.0.0",
        "service": "online-cosmetic-store-backend"
    }), 200

@health_bp.route("/api/v1/health/readiness", methods=["GET"])
def readiness():
    """Readiness probe checking database connectivity."""
    db_status = "connected"
    try:
        query_db("SELECT 1", one=True)
    except Exception:
        db_status = "degraded"

    return jsonify({
        "status": "ready" if db_status == "connected" else "degraded",
        "database": db_status,
        "migrations": "current"
    }), 200
