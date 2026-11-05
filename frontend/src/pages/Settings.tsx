import React, { useEffect, useState } from "react";
import { api, RFC7807Problem } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";

interface SettingsData {
  payment_gateways: {
    razorpay: { enabled: boolean; key_id: string; webhook_verified: boolean };
    paypal: { enabled: boolean; client_id: string; sandbox: boolean };
    cod: { enabled: boolean; max_order_limit: number };
  };
  inventory_alert_threshold: number;
  rbac_roles: Array<{ role: string; description: string; permissions: string[] }>;
}

interface SettingsProps {
  notify?: (type: "success" | "error" | "warning" | "info", message: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ notify }) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<RFC7807Problem | null>(null);

  // Form states
  const [razorpayEnabled, setRazorpayEnabled] = useState<boolean>(true);
  const [paypalEnabled, setPaypalEnabled] = useState<boolean>(true);
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  const [inventoryThreshold, setInventoryThreshold] = useState<number>(10);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setRazorpayEnabled(data.payment_gateways?.razorpay?.enabled ?? true);
      setPaypalEnabled(data.payment_gateways?.paypal?.enabled ?? true);
      setCodEnabled(data.payment_gateways?.cod?.enabled ?? true);
      setInventoryThreshold(data.inventory_alert_threshold ?? 10);
    } catch (err: unknown) {
      setError(err as RFC7807Problem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      payment_gateways: {
        razorpay: { ...settings?.payment_gateways?.razorpay, enabled: razorpayEnabled },
        paypal: { ...settings?.payment_gateways?.paypal, enabled: paypalEnabled },
        cod: { ...settings?.payment_gateways?.cod, enabled: codEnabled }
      },
      inventory_alert_threshold: inventoryThreshold
    };

    try {
      await api.updateSettings(payload);
      if (notify) notify("success", "Store governance settings updated successfully!");
      fetchSettings();
    } catch (err: unknown) {
      const p = err as RFC7807Problem;
      setError(p);
      if (notify) notify("error", `Failed to update settings: ${p.detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "var(--space-6)", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
          Store Governance & Commerce Settings
        </h2>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", margin: "var(--space-1) 0 0" }}>
          Configure payment gateway adapters, inventory threshold notifications, and tenant RBAC roles.
        </p>
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

      {loading && !settings ? (
        <SkeletonLoader count={3} height="140px" />
      ) : settings ? (
        <form onSubmit={handleSave}>
          {/* Payment Gateway Configurations */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              padding: "var(--space-5)",
              marginBottom: "var(--space-6)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", marginBottom: "var(--space-4)" }}>
              Payment Gateway Adapters
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
              {/* Razorpay */}
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--bg-surface-elevated)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>Razorpay Gateway</span>
                  <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={razorpayEnabled}
                      onChange={(e) => setRazorpayEnabled(e.target.checked)}
                    />
                    <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)" }}>Enabled</span>
                  </label>
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
                  Key ID: {settings.payment_gateways?.razorpay?.key_id || "rzp_live_***"}
                </div>
              </div>

              {/* PayPal */}
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--bg-surface-elevated)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>PayPal Express</span>
                  <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={paypalEnabled}
                      onChange={(e) => setPaypalEnabled(e.target.checked)}
                    />
                    <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)" }}>Enabled</span>
                  </label>
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
                  Client ID: {settings.payment_gateways?.paypal?.client_id || "paypal_client_***"}
                </div>
              </div>

              {/* COD */}
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-4)",
                  backgroundColor: "var(--bg-surface-elevated)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-main)" }}>Cash on Delivery (COD)</span>
                  <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={codEnabled}
                      onChange={(e) => setCodEnabled(e.target.checked)}
                    />
                    <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)" }}>Enabled</span>
                  </label>
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
                  Max Order Limit: ${settings.payment_gateways?.cod?.max_order_limit || 500}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Alert Threshold */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              padding: "var(--space-5)",
              marginBottom: "var(--space-6)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", margin: "0 0 var(--space-2)" }}>
              Inventory Telemetry Thresholds
            </h3>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
              Trigger automated low-stock warnings when inventory level dips below this number.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <input
                type="number"
                min="1"
                max="1000"
                value={inventoryThreshold}
                onChange={(e) => setInventoryThreshold(parseInt(e.target.value) || 1)}
                style={{
                  width: "120px",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-main)",
                  fontSize: "var(--text-sm)"
                }}
              />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>units remaining in warehouse</span>
            </div>
          </div>

          {/* RBAC Roles Summary */}
          <div
            style={{
              backgroundColor: "var(--bg-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              padding: "var(--space-5)",
              marginBottom: "var(--space-6)",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-main)", marginBottom: "var(--space-3)" }}>
              Configured RBAC Roles
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                    <th style={{ padding: "var(--space-2) var(--space-3)", color: "var(--text-muted)" }}>Role</th>
                    <th style={{ padding: "var(--space-2) var(--space-3)", color: "var(--text-muted)" }}>Description</th>
                    <th style={{ padding: "var(--space-2) var(--space-3)", color: "var(--text-muted)" }}>Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.rbac_roles?.map((r) => (
                    <tr key={r.role} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "var(--space-2) var(--space-3)", fontWeight: 600, color: "var(--primary)" }}>{r.role}</td>
                      <td style={{ padding: "var(--space-2) var(--space-3)", color: "var(--text-main)" }}>{r.description}</td>
                      <td style={{ padding: "var(--space-2) var(--space-3)" }}>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--accent)" }}>{r.permissions.join(", ")}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "var(--space-3) var(--space-6)",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: "var(--primary)",
              color: "var(--text-inverse)",
              fontWeight: 700,
              fontSize: "var(--text-sm)",
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Saving Governance Changes..." : "Save Settings"}
          </button>
        </form>
      ) : null}
    </div>
  );
};
