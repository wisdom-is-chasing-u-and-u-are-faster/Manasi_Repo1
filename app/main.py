"""
Online Cosmetic Store Website - Primary Backend WSGI Application
Entrypoint conforming to API-SPEC-001.yaml (ARCH-7237)
"""
import os
import sys
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from app.routes.health import health_bp
from app.routes.products import products_bp
from app.routes.orders import orders_bp
from app.routes.dashboard import dashboard_bp
from app.routes.audit import audit_bp
from app.routes.settings import settings_bp
from app.routes.auth import auth_bp

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "frontend" / "dist"
PUBLIC_DIR = BASE_DIR / "frontend"

def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder=str(STATIC_DIR if STATIC_DIR.exists() else PUBLIC_DIR),
        static_url_path="/"
    )

    # Enable Cross-Origin Resource Sharing (CORS)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register Route Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(auth_bp)

    # Serve static frontend or fallback
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path != "" and (STATIC_DIR / path).exists():
            return send_from_directory(str(STATIC_DIR), path)
        if (STATIC_DIR / "index.html").exists():
            return send_from_directory(str(STATIC_DIR), "index.html")
        if (PUBLIC_DIR / "index.html").exists():
            return send_from_directory(str(PUBLIC_DIR), "index.html")
        return jsonify({
            "service": "Online Cosmetic Store API",
            "version": "1.0.0",
            "status": "online",
            "endpoints": "/api/v1/*"
        }), 200

    # RFC 7807 Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            "type": "https://datatracker.ietf.org/doc/html/rfc7807",
            "title": "Bad Request",
            "status": 400,
            "detail": getattr(error, "description", "Malformed request syntax or invalid parameters.")
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "type": "https://datatracker.ietf.org/doc/html/rfc7807",
            "title": "Not Found",
            "status": 404,
            "detail": getattr(error, "description", "The requested resource was not found on this server.")
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            "type": "https://datatracker.ietf.org/doc/html/rfc7807",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An internal unexpected server error occurred."
        }), 500

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("ENVIRONMENT", "development") == "development"
    print(f"Starting Online Cosmetic Store API on http://{host}:{port}")
    app.run(host=host, port=port, debug=debug, use_reloader=False)
