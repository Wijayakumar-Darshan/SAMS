import React, { useEffect, useMemo, useRef, useState } from "react";
import { BellIcon, CheckCircleIcon, ClockIcon, XIcon, AwardIcon, SparklesIcon } from "./UI/Icons.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useI18n } from "../i18n/i18n.jsx";

export default function NotificationCenter() {
  const { role } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const panelRef = useRef(null);

  const endpoint = role === "STUDENT"
    ? "/api/student/me/notifications"
    : role === "TEACHER"
    ? "/api/teacher/me/notifications"
    : null;

  async function loadNotifications() {
    if (!endpoint) return;
    try {
      setLoading(true);
      const data = await api.get(endpoint);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line
  }, [role]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markRead(id) {
    try {
      const readUrl = role === "STUDENT"
        ? `/api/student/me/notifications/${id}/read`
        : `/api/teacher/me/notifications/${id}/read`;
      await api.post(readUrl, {});
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch {
      // ignore
    }
  }

  const unreadCount = useMemo(() => {
    return items.filter((x) => !x.read).length;
  }, [items]);

  const displayedItems = useMemo(() => {
    if (filter === "unread") {
      return items.filter((x) => !x.read);
    }
    return items;
  }, [items, filter]);

  if (!endpoint) return null;

  return (
    <div className="sams-notif-wrap" ref={panelRef}>
      <button
        type="button"
        className="sams-notif-btn"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) loadNotifications();
        }}
        aria-label="Notifications"
      >
        <BellIcon size={20} color="var(--primary)" />
        {unreadCount > 0 && (
          <span className="sams-notif-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="sams-notif-dropdown">
          <div className="sams-notif-header">
            <div className="sams-notif-title-row">
              <h3>{t("notifications")}</h3>
              {unreadCount > 0 && (
                <span className="sams-notif-count-tag">{unreadCount} new</span>
              )}
            </div>
            <div className="sams-notif-tabs">
              <button
                type="button"
                className={`sams-notif-tab ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`sams-notif-tab ${filter === "unread" ? "active" : ""}`}
                onClick={() => setFilter("unread")}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          <div className="sams-notif-list">
            {loading && items.length === 0 ? (
              <div className="sams-notif-empty">
                <span>Loading notifications...</span>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="sams-notif-empty">
                <SparklesIcon size={28} color="var(--accent)" />
                <p>{t("noNotifications")}</p>
              </div>
            ) : (
              displayedItems.map((n) => (
                <div
                  key={n.id}
                  className={`sams-notif-item ${!n.read ? "unread" : ""}`}
                >
                  <div className="sams-notif-icon">
                    <AwardIcon size={16} />
                  </div>
                  <div className="sams-notif-content">
                    <p className="sams-notif-msg">{n.message}</p>
                    <div className="sams-notif-meta">
                      <ClockIcon size={12} />
                      <span>{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      className="sams-notif-read-btn"
                      onClick={() => markRead(n.id)}
                      title={t("markRead")}
                    >
                      <CheckCircleIcon size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .sams-notif-wrap {
          position: relative;
        }

        .sams-notif-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: #FFFFFF;
          border: 1.5px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }

        .sams-notif-btn:hover {
          background: var(--bg-card-muted);
          border-color: var(--accent);
          transform: translateY(-1px);
        }

        .sams-notif-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--danger);
          color: white;
          font-size: 10px;
          font-weight: 800;
          height: 18px;
          min-width: 18px;
          padding: 0 4px;
          border-radius: var(--radius-pill);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          animation: pulseGlow 2s infinite;
        }

        .sams-notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          max-width: 90vw;
          background: #FFFFFF;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-xl);
          z-index: 100;
          overflow: hidden;
          animation: scaleIn 0.2s ease;
        }

        .sams-notif-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card-muted);
        }

        .sams-notif-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .sams-notif-title-row h3 {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-notif-count-tag {
          font-size: 11px;
          font-weight: 700;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 2px 8px;
          border-radius: var(--radius-pill);
        }

        .sams-notif-tabs {
          display: flex;
          gap: 6px;
        }

        .sams-notif-tab {
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          border-radius: var(--radius-pill);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-notif-tab.active {
          background: #FFFFFF;
          color: var(--primary);
          box-shadow: var(--shadow-xs);
        }

        .sams-notif-list {
          max-height: 380px;
          overflow-y: auto;
        }

        .sams-notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          transition: background var(--transition-fast);
        }

        .sams-notif-item:last-child {
          border-bottom: none;
        }

        .sams-notif-item:hover {
          background: var(--bg-card-muted);
        }

        .sams-notif-item.unread {
          background: #F0F9FF;
        }

        .sams-notif-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-notif-content {
          flex: 1;
          min-width: 0;
        }

        .sams-notif-msg {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-main);
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .sams-notif-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .sams-notif-read-btn {
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }

        .sams-notif-read-btn:hover {
          color: var(--success);
        }

        .sams-notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 36px 20px;
          text-align: center;
          color: var(--text-secondary);
          gap: 10px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
