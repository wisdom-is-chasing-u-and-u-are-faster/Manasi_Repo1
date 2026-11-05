"""Routes module initialization."""
from .health import health_bp
from .products import products_bp
from .orders import orders_bp
from .dashboard import dashboard_bp
from .audit import audit_bp
from .settings import settings_bp
from .auth import auth_bp

__all__ = [
    "health_bp",
    "products_bp",
    "orders_bp",
    "dashboard_bp",
    "audit_bp",
    "settings_bp",
    "auth_bp",
]
