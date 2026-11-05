"""
Audit Log Domain Model with SHA-256 Hash Verification (ARCH-7237)
"""
import hashlib
import json
import uuid
from typing import Dict, List, Optional, Any
from app.db.connection import query_db, execute_db

class AuditLog:
    @staticmethod
    def get_all(entity_type: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        query = "SELECT * FROM audit_logs"
        params = []
        if entity_type:
            query += " WHERE UPPER(entity_type) = UPPER(%s)"
            params.append(entity_type)
        query += " ORDER BY id DESC LIMIT %s"
        params.append(limit)
        items = query_db(query, tuple(params))
        for item in items:
            # Facilitate both integer ID and string ID lookups in tests
            if isinstance(item.get("entity_id"), str) and item["entity_id"].isdigit():
                item["entity_id"] = int(item["entity_id"])
            if "payload_hash" not in item and "payload_hash_sha256" in item:
                item["payload_hash"] = item["payload_hash_sha256"]
            if "event_type" not in item and "action" in item:
                item["event_type"] = item["action"]
        return items

    @staticmethod
    def record(
        entity_type: str,
        entity_id: str,
        action: str,
        actor_id: str = "system",
        diff: Optional[Dict[str, Any]] = None,
        tenant_id: str = "a0000000-0000-0000-0000-000000000001"
    ) -> int:
        correlation_id = str(uuid.uuid4())
        diff_str = json.dumps(diff or {})
        raw_payload = f"{tenant_id}:{entity_type}:{entity_id}:{action}:{actor_id}:{diff_str}"
        payload_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

        return execute_db(
            """
            INSERT INTO audit_logs (
                name, tenant_id, entity_type, entity_id, action, event_type, actor_id,
                correlation_id, payload_hash, payload_hash_sha256, diff_json, status, amount
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                f"Audit {action} on {entity_type}",
                tenant_id,
                entity_type,
                str(entity_id),
                action,
                action,
                actor_id,
                correlation_id,
                payload_hash,
                payload_hash,
                diff_str,
                "ACTIVE",
                0.0
            )
        )

    @staticmethod
    def record_event(
        conn_or_none=None,
        event_type: str = "GENERIC_EVENT",
        entity_type: str = "UNKNOWN",
        entity_id: str = "0",
        actor_id: str = "system",
        actor_role: str = "USER",
        previous_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
        tenant_id: str = "a0000000-0000-0000-0000-000000000001"
    ) -> int:
        correlation_id = str(uuid.uuid4())
        diff = {"previous": previous_state, "new": new_state}
        diff_str = json.dumps(diff)
        raw_payload = f"{tenant_id}:{entity_type}:{entity_id}:{event_type}:{actor_id}:{diff_str}"
        payload_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

        conn = conn_or_none
        if isinstance(conn, tuple):
            conn = conn[0]

        if conn is not None and hasattr(conn, "cursor"):
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO audit_logs (
                    name, tenant_id, entity_type, entity_id, action, event_type, actor_id,
                    correlation_id, payload_hash, payload_hash_sha256, diff_json, status, amount
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"Audit {event_type} on {entity_type}",
                    tenant_id,
                    str(entity_type),
                    str(entity_id),
                    "CREATE",
                    event_type,
                    actor_id,
                    correlation_id,
                    payload_hash,
                    payload_hash,
                    diff_str,
                    "ACTIVE",
                    0.0
                )
            )
            conn.commit()
            return cur.lastrowid
        else:
            return AuditLog.record(
                entity_type=entity_type,
                entity_id=str(entity_id),
                action=event_type,
                actor_id=actor_id,
                diff=diff,
                tenant_id=tenant_id
            )
