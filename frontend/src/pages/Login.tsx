import React, { useState } from "react";
import { api, RFC7807Problem } from "../services/api";

interface LoginProps {
  notify?: (type: "success" | "error" | "warning" | "info", message: string) => void;
}

export const Login: React.FC<LoginProps> = ({ notify }) => {
  const [email, setEmail] = useState<string>("admin@auraglow.example.com");
  const [password, setPassword] = useState<string>("••••••••••••");
  const [mfaToken, setMfaToken] = useState<string>("123456");
  const [loading, setLoading] = useState<boolean>(false);
  const [loggedInUser, setLoggedInUser] = useState<{
    id: string;
    email: string;
    full_name: string;
    role: string;
  } | null>(() => {
    const saved = localStorage.getItem("aura_glow_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState<RFC7807Problem | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({
        email,
        password,
        mfa_token: mfaToken
      });
      localStorage.setItem("aura_glow_jwt", res.token);
      localStorage.setItem("aura_glow_user", JSON.stringify(res.user));
      setLoggedInUser(res.user);
      if (notify) notify("success", `Authenticated as ${res.user.full_name} (${res.user.role})`);
    } catch (err: unknown) {
      const p = err as RFC7807Problem;
      setError(p);
      if (notify) notify("error", `SSO Authentication failed: ${p.detail || p.title}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("aura_glow_jwt");
    localStorage.removeItem("aura_glow_user");
    setLoggedInUser(null);
    if (notify) notify("info", "Logged out from SSO session.");
  };

  return (
    <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: "480px", margin: "0 auto" }}>
      <div
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)",
          padding: "var(--space-8)",
          boxShadow: "var(--shadow-lg)"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-brand)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-inverse)",
              fontWeight: 700,
              fontSize: "var(--text-xl)",
              marginBottom: "var(--space-3)"
            }}
          >
            AG
          </div>
          <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
            Enterprise SSO Login
          </h2>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", margin: "var(--space-1) 0 0" }}>
            Aura Glow Role-Based Access Control & MFA Security Portal
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--status-error-bg)",
              color: "var(--status-error)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-xs)"
            }}
          >
            {error.detail}
          </div>
        )}

        {loggedInUser ? (
          <div>
            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-5)",
                textAlign: "center"
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "var(--text-base)" }}>
                {loggedInUser.full_name}
              </div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{loggedInUser.email}</div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: "var(--space-2)",
                  padding: "var(--space-1) var(--space-3)",
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--primary-subtle)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontSize: "var(--text-xs)"
                }}
              >
                ROLE: {loggedInUser.role}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-light)",
                backgroundColor: "var(--bg-surface)",
                color: "var(--text-main)",
                fontWeight: 600,
                fontSize: "var(--text-sm)",
                cursor: "pointer"
              }}
            >
              Log Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label
                htmlFor="ssoEmail"
                style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-1)" }}
              >
                Work Email Address:
              </label>
              <input
                id="ssoEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-main)",
                  fontSize: "var(--text-sm)"
                }}
              />
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <label
                htmlFor="ssoPassword"
                style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-1)" }}
              >
                Password:
              </label>
              <input
                id="ssoPassword"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-main)",
                  fontSize: "var(--text-sm)"
                }}
              />
            </div>

            <div style={{ marginBottom: "var(--space-6)" }}>
              <label
                htmlFor="mfaToken"
                style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-main)", marginBottom: "var(--space-1)" }}
              >
                MFA Authenticator Token (6-Digit):
              </label>
              <input
                id="mfaToken"
                type="text"
                maxLength={6}
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                style={{
                  width: "100%",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-strong)",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--text-main)",
                  fontSize: "var(--text-sm)",
                  letterSpacing: "4px",
                  textAlign: "center",
                  fontFamily: "var(--font-mono)"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "var(--primary)",
                color: "var(--text-inverse)",
                fontWeight: 700,
                fontSize: "var(--text-sm)",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              {loading ? "Authenticating..." : "Sign In via SSO"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
