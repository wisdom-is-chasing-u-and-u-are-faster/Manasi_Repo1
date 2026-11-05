import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderTop: "1px solid var(--border-light)",
        padding: "var(--space-6) var(--space-6)",
        marginTop: "auto"
      }}
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-4)",
          fontSize: "var(--text-xs)",
          color: "var(--text-muted)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span>© 2026 Aura Glow Atelier Commerce Ops. All rights reserved.</span>
          <span>•</span>
          <span style={{ color: "var(--accent)" }}>WCAG 2.1 AA Compliant</span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <span>PostgreSQL 3NF Architecture</span>
          <span>•</span>
          <span>UUIDv7 Idempotency</span>
          <span>•</span>
          <span>RFC 7807 Error Envelopes</span>
          <span>•</span>
          <span>OpenTelemetry Telemetry</span>
        </div>
      </div>
    </footer>
  );
};
