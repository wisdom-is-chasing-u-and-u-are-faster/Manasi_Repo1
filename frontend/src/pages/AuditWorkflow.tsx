import React, { useEffect, useState } from "react";
import { api, RFC7807Problem } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface AuditLogItem {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  actor_id: string;
  actor_role: string;
  payload_hash: string;
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  created_at: string;
}

export const AuditWorkflow: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<RFC7807Problem | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAuditLogs({
        entity_type: entityFilter || undefined
      });
      setLogs(res.items || []);
    } catch (err: unknown) {
      setError(err as RFC7807Problem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1440px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
          gap: "var(--space-4)"
        }}
      >
        <div>
          <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
            Immutable Compliance Audit Ledger
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "var(--space-1) 0 0" }}>
            Cryptographically sealed SHA-256 state transition ledger for SOX & GDPR compliance auditing.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {["", "ORDER", "PRODUCT", "SETTINGS"].map((ent) => {
            const active = entityFilter === ent;
            return (
              <button
                key={ent || "all"}
                type="button"
                onClick={() => setEntityFilter(ent)}
                style={{
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  border: active ? "1px solid var(--accent)" : "1px solid var(--border-light)",
                  backgroundColor: active ? "var(--accent)" : "var(--bg-surface)",
                  color: active ? "var(--text-inverse)" : "var(--text-main)",
                  cursor: "pointer"
                }}
              >
                {ent || "All Entities"}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--status-error-bg)",
            color: "var(--status-error)",
            marginBottom: "var(--space-6)"
          }}
        >
          {error.detail}
        </div>
      )}

      {loading ? (
        <SkeletonLoader count={5} height="70px" />
      ) : logs.length > 0 ? (
        <div
          style={{
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-sm)",
            overflow: "hidden"
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-surface-elevated)", textAlign: "left" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-muted)", fontWeight: 600 }}>Event & Entity</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-muted)", fontWeight: 600 }}>Actor ID / Role</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-muted)", fontWeight: 600 }}>SHA-256 Payload Hash</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-muted)", fontWeight: 600 }}>Timestamp</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-muted)", fontWeight: 600 }}>State Diff</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{log.event_type}</div>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--accent)" }}>
                            {log.entity_type} ({log.entity_id.substring(0, 8)}...)
                          </span>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <div style={{ fontWeight: 500, color: "var(--text-main)" }}>{log.actor_role}</div>
                          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{log.actor_id.substring(0, 8)}...</div>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <code
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "var(--text-xs)",
                              backgroundColor: "var(--bg-surface-elevated)",
                              padding: "var(--space-1) var(--space-2)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--accent-gold)"
                            }}
                          >
                            {log.payload_hash ? `${log.payload_hash.substring(0, 16)}...` : "N/A"}
                          </code>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            style={{
                              padding: "var(--space-1) var(--space-2)",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border-light)",
                              backgroundColor: "var(--bg-surface-elevated)",
                              color: "var(--text-main)",
                              fontSize: "var(--text-xs)",
                              cursor: "pointer"
                            }}
                          >
                            {isExpanded ? "Hide Diff" : "Inspect Diff"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ backgroundColor: "var(--bg-surface-elevated)" }}>
                          <td colSpan={5} style={{ padding: "var(--space-4)" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                              <div>
                                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--status-error)" }}>
                                  Previous State:
                                </span>
                                <pre
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-xs)",
                                    backgroundColor: "var(--bg-surface)",
                                    padding: "var(--space-3)",
                                    borderRadius: "var(--radius-sm)",
                                    overflowX: "auto",
                                    border: "1px solid var(--border-light)",
                                    marginTop: "var(--space-1)"
                                  }}
                                >
                                  {JSON.stringify(log.previous_state, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--status-success)" }}>
                                  New State (Cryptographically Sealed):
                                </span>
                                <pre
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "var(--text-xs)",
                                    backgroundColor: "var(--bg-surface)",
                                    padding: "var(--space-3)",
                                    borderRadius: "var(--radius-sm)",
                                    overflowX: "auto",
                                    border: "1px solid var(--border-light)",
                                    marginTop: "var(--space-1)"
                                  }}
                                >
                                  {JSON.stringify(log.new_state, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-10)",
            backgroundColor: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border-strong)"
          }}
        >
          <p style={{ color: "var(--text-muted)" }}>No audit ledger records found.</p>
        </div>
      )}
    </div>
  );
};
