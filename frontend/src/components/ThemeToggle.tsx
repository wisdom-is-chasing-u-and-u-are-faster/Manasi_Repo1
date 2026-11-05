import React from "react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--space-2)",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-full)",
        border: "1px solid var(--border-light)",
        backgroundColor: "var(--bg-surface-elevated)",
        color: "var(--text-main)",
        cursor: "pointer",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
        transition: "var(--transition-fast)"
      }}
    >
      <span>{theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
    </button>
  );
};
