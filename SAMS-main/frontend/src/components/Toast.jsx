import React, { createContext, useContext, useMemo, useState } from "react";
import { CheckCircleIcon, AlertCircleIcon, SparklesIcon } from "./UI/Icons.jsx";

const ToastCtx = createContext(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const value = useMemo(() => {
    function show(message, type = "success") {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }, 3800);
    }
    return { show };
  }, []);

  return (
    <ToastCtx.Provider value={value}>
      {children}

      <div className="toast-container">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <div className="toast-icon">
              {t.type === "error" ? (
                <AlertCircleIcon size={16} />
              ) : t.type === "info" ? (
                <SparklesIcon size={16} />
              ) : (
                <CheckCircleIcon size={16} />
              )}
            </div>
            <div className="toast-content">
              <div className="toast-title">
                {t.type === "error" ? "Error Notice" : t.type === "info" ? "Update" : "Success"}
              </div>
              <div className="toast-message">{t.message}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          right: 20px;
          bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
          max-width: 380px;
          width: 100%;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: var(--radius-lg);
          background: #FFFFFF;
          box-shadow: 0 12px 32px rgba(11, 46, 89, 0.16), 0 4px 12px rgba(11, 46, 89, 0.08);
          border: 1px solid var(--border-subtle);
          animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: auto;
        }

        .toast-success {
          border-left: 4px solid var(--success);
        }

        .toast-error {
          border-left: 4px solid var(--danger);
        }

        .toast-info {
          border-left: 4px solid var(--accent);
        }

        .toast-icon {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-success .toast-icon {
          background: #DCFCE7;
          color: #16A34A;
        }

        .toast-error .toast-icon {
          background: #FEE2E2;
          color: #DC2626;
        }

        .toast-info .toast-icon {
          background: var(--accent-soft);
          color: var(--accent);
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-title {
          font-size: 13px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .toast-message {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.45;
          word-break: break-word;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 480px) {
          .toast-container {
            right: 12px;
            left: 12px;
            bottom: 74px;
            max-width: none;
          }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}