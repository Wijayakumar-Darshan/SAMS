import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

const ToastCtx = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const value = useMemo(() => {
    function show(message, type = "success") {
      setItems((prev) => {
        // avoid duplicate toasts for the same message/type stacking up
        if (prev.some((x) => x.message === message && x.type === type)) {
          return prev;
        }

        const id = generateId();

        setTimeout(() => {
          setItems((cur) => cur.filter((x) => x.id !== id));
        }, 3600);

        return [...prev, { id, message, type }];
      });
    }

    function dismiss(id) {
      setItems((prev) => prev.filter((x) => x.id !== id));
    }

    return { show, dismiss };
  }, []);

  return (
    <ToastCtx.Provider value={value}>
      {children}

      <div className="toastStack">
        {items.map((item) => {
          const Icon = ICONS[item.type] || Info;

          return (
            <div
              key={item.id}
              className={"toastItem " + item.type}
              role="status"
            >
              <Icon
                size={18}
                style={{ flexShrink: 0, marginTop: 1 }}
              />

              <div style={{ flex: 1 }}>
                {item.message}
              </div>

              <button
                type="button"
                className="btn-ghost"
                style={{ padding: 2, border: 0 }}
                onClick={() => value.dismiss(item.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { return useContext(ToastCtx); }
