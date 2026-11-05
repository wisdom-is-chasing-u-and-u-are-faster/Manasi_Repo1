import React from "react";

interface SkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  height = "20px",
  width = "100%",
  borderRadius = "var(--radius-sm)",
  count = 1
}) => {
  return (
    <div
      aria-busy="true"
      aria-label="Loading content..."
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", width: "100%" }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height,
            width,
            borderRadius,
            backgroundColor: "var(--bg-surface-elevated)",
            opacity: 0.6,
            animation: "pulse 1.5s ease-in-out infinite"
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
