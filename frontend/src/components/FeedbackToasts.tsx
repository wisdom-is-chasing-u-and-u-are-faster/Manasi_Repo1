import React from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface FeedbackToastsProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const FeedbackToasts: React.FC<FeedbackToastsProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        bottom: "var(--space-6)",
        right: "var(--space-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
        zIndex: 9999,
        maxWidth: "400px"
      }}
    >
      {toasts.map((toast) => {
        const bg =
          toast.type === "success"
            ? "var(--status-success-bg)"
            : toast.type === "error"
            ? "var(--status-error-bg)"
            : toast.type === "warning"
            ? "var(--status-warning-bg)"
            : "var(--status-info-bg)";

        const color =
          toast.type === "success"
            ? "var(--status-success)"
            : toast.type === "error"
            ? "var(--status-error)"
            : toast.type === "warning"
            ? "var(--status-warning)"
            : "var(--status-info)";

        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            style={{
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              backgroundColor: bg,
              color: color,
              border: `1px solid ${color}`,
              boxShadow: "var(--shadow-md)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              fontSize: "var(--text-sm)",
              fontWeight: 500
            }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                fontWeight: "bold",
                fontSize: "var(--text-base)"
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
};
