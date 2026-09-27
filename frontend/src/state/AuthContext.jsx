import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";

const AuthCtx = createContext(null);

function connectNotifications(accessToken, onMessage) {
  if (!accessToken) return () => {};

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${proto}://${location.host}/ws/notifications?token=${encodeURIComponent(accessToken)}`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      onMessage(msg);
    } catch {
      onMessage({ type: "TEXT", message: String(evt.data) });
    }
  };

  return () => {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  };
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [teacherPasswordSet, setTeacherPasswordSet] = useState(
    localStorage.getItem("teacherPasswordSet") === "true"
  );

  // WebSocket notifications
  useEffect(() => {
    const access = api.storage.getAccess();
    const stop = connectNotifications(access, (msg) => {
      if (msg?.message) toast.show(msg.message, "info");
    });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]); // reconnect after login/logout

  const value = useMemo(() => {
    function setSession({ accessToken, refreshToken, role, passwordSet }) {
      api.storage.setTokens({ accessToken, refreshToken });
      if (role) {
        localStorage.setItem("role", role);
        setRole(role);
      }
      if (role === "TEACHER") {
        const ps = !!passwordSet;
        localStorage.setItem("teacherPasswordSet", String(ps));
        setTeacherPasswordSet(ps);
      }
    }

    function clearSession() {
      const refreshToken = api.storage.getRefresh();
      api.storage.clear();
      setRole("");
      setTeacherPasswordSet(false);
      return refreshToken;
    }

    async function logout() {
      const refreshToken = api.storage.getRefresh();
      clearSession();
      if (refreshToken) {
        try {
          await api.auth.logout({ refreshToken });
        } catch {
          /* ignore */
        }
      }
    }

    return {
      role,
      teacherPasswordSet,
      setSession,
      setTeacherPasswordSet: (v) => {
        setTeacherPasswordSet(v);
        localStorage.setItem("teacherPasswordSet", String(v));
      },
      logout
    };
  }, [role, teacherPasswordSet]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}