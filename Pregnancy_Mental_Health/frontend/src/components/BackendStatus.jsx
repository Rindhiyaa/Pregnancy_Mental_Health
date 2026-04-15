import React, { useEffect, useState } from "react";
import { setBackendStatusCallback } from "../utils/api.js";

export default function BackendStatus() {
  const [status, setStatus] = useState("online");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setBackendStatusCallback((nextStatus) => {
      setStatus(nextStatus);
      setVisible(nextStatus !== "online");
    });
  }, []);

  if (!visible) return null;

  const isSleeping = status === "sleeping";

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        width: "min(92vw, 520px)",
        background: isSleeping
          ? "linear-gradient(135deg, #fff7ed, #ffedd5)"
          : "linear-gradient(135deg, #fee2e2, #fecaca)",
        color: "#7c2d12",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        borderRadius: "16px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: 600,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: isSleeping ? "#f59e0b" : "#ef4444",
          flexShrink: 0,
          animation: "pulse 1.2s infinite",
        }}
      />
      <div style={{ lineHeight: 1.45 }}>
        {isSleeping
          ? "Server is waking up. Please wait a few seconds..."
          : "Server is temporarily unavailable. Trying to reconnect..."}
      </div>
      <div 
        style={{ 
          marginLeft: "auto", 
          cursor: "pointer", 
          fontSize: "18px",
          opacity: 0.7,
          transition: "opacity 0.2s"
        }} 
        onClick={() => setVisible(false)}
        onMouseEnter={(e) => e.target.style.opacity = "1"}
        onMouseLeave={(e) => e.target.style.opacity = "0.7"}
        title="Dismiss"
      >
        ×
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.6; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}