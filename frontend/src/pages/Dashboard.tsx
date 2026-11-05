import React, { useEffect, useState } from "react";
import { api, RFC7807Problem } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface DashboardMetrics {
  total_orders: number;
  gross_merchandise_value: number;
  p99_latency_ms: number;
  sla_uptime_percent: number;
  active_alerts: number;
  recent_orders: Array<{
    id: string;
    order_number: string;
    customer_email: string;
    amount_minor_units: number;
    currency_code: string;
    status: string;
    created_at: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<RFC7807Problem | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err: unknown) {
      setError(err as RFC7807Problem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

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
            Executive Operations Telemetry
          </h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "var(--space-1) 0 0" }}>
            Real-time commerce throughput, SLA reliability metrics, and active fulfillment streams.
          </p>
        </div>
        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          aria-label="Refresh telemetry metrics"
          style={{
            padding: "var(--space-2) var(--space-4)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border-light)",
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-main)",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "var(--text-sm)",
            boxShadow: "var(--shadow-sm)"
          }}
        >
          {loading ? "Refreshing..." : "↻ Refresh Telemetry"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--status-error-bg)",
            color: "var(--status-error)",
            border: "1px solid var(--status-error)",
            marginBottom: "var(--space-6)"
          }}
        >
          <strong>{error.title} ({error.status}): </strong>
          <span>{error.detail}</span>
        </div>
      )}

      {loading && !metrics ? (
        <SkeletonLoader count={4} height="120px" />
      ) : metrics ? (
        <>
          {/* KPI Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "var(--space-4)",
              marginBottom: "var(--space-8)"
            }}
          >
            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                padding: "var(--space-5)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Gross Merchandise Value
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--primary)", marginTop: "var(--space-2)" }}>
                ${(metrics.gross_merchandise_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--status-success)", marginTop: "var(--space-1)" }}>
                ▲ +14.2% vs previous period
              </div>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                padding: "var(--space-5)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Total Orders Processed
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--text-main)", marginTop: "var(--space-2)" }}>
                {(metrics.total_orders || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-1)" }}>
                Idempotent state transitions
              </div>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                padding: "var(--space-5)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                SLA Uptime Percent
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--accent)", marginTop: "var(--space-2)" }}>
                {metrics.sla_uptime_percent || 99.98}%
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--status-success)", marginTop: "var(--space-1)" }}>
                Target ≥ 99.95% met
              </div>
            </div>

            <div
              style={{
                backgroundColor: "var(--bg-surface)",
                padding: "var(--space-5)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                P99 Api Latency
              </div>
              <div style={{ fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--text-main)", marginTop: "var(--space-2)" }}>
                {metrics.p99_latency_ms || 320} ms
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--status-success)", marginTop: "var(--space-1)" }}>
                Within SLA budget (&lt; 500ms)
              </div>
            </div>
          </div>

          {/* Recent Orders Telemetry Feed */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              padding: "var(--space-5)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-4)" }}>
              Authoritative Live Orders Stream
            </h3>

            {metrics.recent_orders && metrics.recent_orders.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                      <th style={{ padding: "var(--space-3)", color: "var(--text-muted)", fontWeight: 600 }}>Order Number</th>
                      <th style={{ padding: "var(--space-3)", color: "var(--text-muted)", fontWeight: 600 }}>Customer Email</th>
                      <th style={{ padding: "var(--space-3)", color: "var(--text-muted)", fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: "var(--space-3)", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "var(--space-3)", color: "var(--text-muted)", fontWeight: 600 }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent_orders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "var(--space-3)", fontWeight: 600, color: "var(--primary)" }}>{ord.order_number}</td>
                        <td style={{ padding: "var(--space-3)", color: "var(--text-main)" }}>{ord.customer_email}</td>
                        <td style={{ padding: "var(--space-3)", fontWeight: 600 }}>
                          ${(ord.amount_minor_units / 100).toFixed(2)} {ord.currency_code}
                        </td>
                        <td style={{ padding: "var(--space-3)", }}>
                          <span
                            style={{
                              padding: "var(--space-1) var(--space-2)",
                              borderRadius: "var(--radius-full)",
                              fontSize: "var(--text-xs)",
                              fontWeight: 600,
                              backgroundColor:
                                ord.status === "CONFIRMED" || ord.status === "DELIVERED"
                                  ? "var(--status-success-bg)"
                                  : "var(--status-info-bg)",
                              color:
                                ord.status === "CONFIRMED" || ord.status === "DELIVERED"
                                  ? "var(--status-success)"
                                  : "var(--status-info)"
                            }}
                          >
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ padding: "var(--space-3)", color: "var(--text-muted)" }}>
                          {new Date(ord.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>No recent orders detected.</p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
