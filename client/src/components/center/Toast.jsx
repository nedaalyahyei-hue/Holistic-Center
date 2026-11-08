import React, { useEffect } from "react";
import { createPortal } from "react-dom";

const COLORS = { success: "#2e7d32", error: "#c0392b", info: "#455a64" };

// Small message at the top of the screen that disappears by itself
export default function Toast({ text, type = "success", onClose, duration = 2600 }) {
  useEffect(() => {
    if (!text) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [text]);

  if (!text) return null;

  return createPortal(
    <div
      role="status"
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 3000,
        background: COLORS[type] || COLORS.success,
        color: "#ffffff",
        padding: "12px 28px",
        borderRadius: 12,
        fontWeight: "bold",
        boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
        animation: "csToastIn 0.3s ease",
        maxWidth: "90vw",
        textAlign: "center",
      }}
    >
      {text}
      <style>{`@keyframes csToastIn { from { opacity: 0; transform: translate(-50%, -14px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
    </div>,
    document.body
  );
}