"""
Immutable Compliance Audit Ledger Routes (ARCH-7237)
"""
from flask import Blueprint, request, jsonify
from app.models.audit import AuditLog

audit_bp = Blueprint("audit", __name__)

@audit_bp.route("/api/v1/audit-logs", methods=["GET"])
def list_audit_logs():
    """Retrieve cryptographic SHA-256 compliance audit log ledger."""
    limit = int(request.args.get("limit", 50))
    entity_type = request.args.get("entity_type")
    logs = AuditLog.get_all(entity_type=entity_type, limit=limit)
    return jsonify({
        "items": logs,
        "total_count": len(logs),
        "compliance_standard": "PCI-DSS v4.0 / GDPR Article 30"
    }), 200
