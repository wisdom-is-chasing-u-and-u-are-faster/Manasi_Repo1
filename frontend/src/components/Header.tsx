import React from "react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  healthStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, healthStatus = "healthy" }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", badge: "01" },
    { id: "explorer", label: "Catalog & Orders", badge: "02" },
    { id: "checkout", label: "Checkout Console", badge: "03" },
    { id: "audit", label: "Audit Ledger", badge: "04" },
    { id: "settings", label: "Settings", badge: "05" },
    { id: "login", label: "SSO Login", badge: "06" }
  ];

  return (
    <header
      role="banner"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-light)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow-sm)"
      }}
    >
      <div
        style={{
          maxWidth: "1440px",
          margin: "0 auto",
          padding: "var(--space-3) var(--space-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-4)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-brand)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-inverse)",
              fontWeight: 700,
              fontSize: "var(--text-lg)"
            }}
          >
            AG
          </div>
          <div>
            <h1
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 700,
                color: "var(--text-main)",
                margin: 0,
                lineHeight: 1.2
              }}
            >
              Aura Glow
            </h1>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              Cosmetic Atelier & Commerce Operations
            </span>
          </div>
        </div>

        <nav aria-label="Main Navigation" style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          {tabs.map((tab) => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: active ? "1px solid var(--primary)" : "1px solid transparent",
                  backgroundColor: active ? "var(--primary-subtle)" : "transparent",
                  color: active ? "var(--primary)" : "var(--text-main)",
                  fontSize: "var(--text-sm)",
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  transition: "var(--transition-fast)"
                }}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div
            aria-label={`API Health: ${healthStatus}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-2)",
              fontSize: "var(--text-xs)",
              padding: "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-full)",
              backgroundColor: healthStatus === "healthy" ? "var(--status-success-bg)" : "var(--status-warning-bg)",
              color: healthStatus === "healthy" ? "var(--status-success)" : "var(--status-warning)",
              fontWeight: 600
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: healthStatus === "healthy" ? "var(--status-success)" : "var(--status-warning)"
              }}
            />
            {healthStatus.toUpperCase()}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
