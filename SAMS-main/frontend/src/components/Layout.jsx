import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import LanguageSwitch from "./LanguageSwitch.jsx";
import NotificationCenter from "./NotificationCenter.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import {
  HomeIcon,
  BookOpenIcon,
  TrophyIcon,
  BarChartIcon,
  LinkIcon,
  CreditCardIcon,
  UsersIcon,
  QrCodeIcon,
  ShieldIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  UserIcon,
} from "./UI/Icons.jsx";

function getNavItems(role, t) {
  if (role === "STUDENT") {
    return [
      { to: "/student/dashboard", label: t("dashboard"), icon: <HomeIcon size={19} />, mobilePrimary: true },
      { to: "/student/activities", label: t("activities"), icon: <BookOpenIcon size={19} />, mobilePrimary: true },
      { to: "/student/leaderboard", label: t("leaderboard"), icon: <TrophyIcon size={19} />, mobilePrimary: true },
      { to: "/student/report", label: t("report"), icon: <BarChartIcon size={19} />, mobilePrimary: true },
      { to: "/student/map-teacher", label: t("mapTeacher"), icon: <LinkIcon size={19} />, mobilePrimary: false },
      { to: "/subscription", label: t("subscription"), icon: <CreditCardIcon size={19} />, mobilePrimary: false },
    ];
  }
  if (role === "TEACHER") {
    return [
      { to: "/teacher/dashboard", label: t("dashboard"), icon: <HomeIcon size={19} />, mobilePrimary: true },
      { to: "/teacher/students", label: t("students"), icon: <UsersIcon size={19} />, mobilePrimary: true },
      { to: "/teacher/leaderboard", label: t("leaderboard"), icon: <TrophyIcon size={19} />, mobilePrimary: true },
      { to: "/subscription", label: t("subscription"), icon: <CreditCardIcon size={19} />, mobilePrimary: true },
    ];
  }
  if (role === "PARENT") {
    return [
      { to: "/parent/dashboard", label: t("dashboard"), icon: <HomeIcon size={19} />, mobilePrimary: true },
      { to: "/subscription", label: t("subscription"), icon: <CreditCardIcon size={19} />, mobilePrimary: true },
    ];
  }
  if (role === "ADMIN") {
    return [
      { to: "/admin/dashboard", label: t("dashboard"), icon: <HomeIcon size={19} />, mobilePrimary: true },
      { to: "/admin/teachers", label: t("teachers"), icon: <UsersIcon size={19} />, mobilePrimary: true },
      { to: "/admin/payments", label: t("payments"), icon: <CreditCardIcon size={19} />, mobilePrimary: true },
    ];
  }
  return [];
}

export default function Layout({ children, title, subtitle }) {
  const { role, logout } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const items = useMemo(() => getNavItems(role, t), [role, t]);
  const mobileNavItems = useMemo(() => items.filter((x) => x.mobilePrimary).slice(0, 4), [items]);

  const roleLabels = {
    STUDENT: "Student Companion",
    TEACHER: "Teacher Portal",
    PARENT: "Parent Portal",
    ADMIN: "School Admin",
  };

  const roleInitial = role ? role.charAt(0).toUpperCase() : "U";

  return (
    <div className="sams-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="sams-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sams-sidebar ${mobileDrawerOpen ? "open" : ""}`}>
        {/* Brand Header */}
        <div className="sams-sidebar-brand">
          <div className="sams-brand-mark">
            <span className="sams-brand-mark-letter">S</span>
          </div>
          <div className="sams-brand-info">
            <h2 className="sams-brand-name">{t("appName")}</h2>
            <span className="sams-brand-sub">{roleLabels[role] || "School Portal"}</span>
          </div>
          {mobileDrawerOpen && (
            <button
              type="button"
              className="sams-drawer-close-btn"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <XIcon size={20} color="white" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="sams-sidebar-nav">
          <div className="sams-nav-group-title">Navigation</div>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `sams-nav-link ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span className="sams-nav-icon">{it.icon}</span>
              <span className="sams-nav-label">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="sams-sidebar-footer">
          <div className="sams-user-card">
            <div className="sams-user-avatar">{roleInitial}</div>
            <div className="sams-user-details">
              <span className="sams-user-role-tag">{role}</span>
              <span className="sams-user-status-dot" />
            </div>
            <button
              type="button"
              className="sams-quick-logout"
              title={t("logout")}
              onClick={async () => {
                await logout();
                nav("/login");
              }}
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="sams-main-wrapper">
        {/* Topbar */}
        <header className="sams-topbar">
          <div className="sams-topbar-left">
            <button
              type="button"
              className="sams-mobile-menu-trigger"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation menu"
            >
              <MenuIcon size={22} color="var(--primary)" />
            </button>
            <div className="sams-page-headers">
              <h1 className="sams-page-heading">{title || t("dashboard")}</h1>
              {subtitle && <p className="sams-page-subheading">{subtitle}</p>}
            </div>
          </div>

          <div className="sams-topbar-right">
            <LanguageSwitch />
            <NotificationCenter />
            <button
              type="button"
              className="sams-logout-pill-btn"
              onClick={async () => {
                await logout();
                nav("/login");
              }}
            >
              <LogOutIcon size={15} />
              <span className="sams-logout-text">{t("logout")}</span>
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="sams-page-body">{children}</main>

        {/* Mobile Floating Bottom Navigation */}
        <nav className="sams-bottom-nav">
          {mobileNavItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `sams-bottom-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="sams-bottom-nav-icon">{it.icon}</span>
              <span className="sams-bottom-nav-label">{it.label}</span>
            </NavLink>
          ))}
          {/* More menu drawer trigger if extra items exist */}
          {items.length > 4 && (
            <button
              type="button"
              className="sams-bottom-nav-item"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <span className="sams-bottom-nav-icon">
                <MenuIcon size={19} />
              </span>
              <span className="sams-bottom-nav-label">More</span>
            </button>
          )}
        </nav>
      </div>

      <style>{`
        .sams-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-app);
          position: relative;
        }

        /* Sidebar */
        .sams-sidebar {
          width: 260px;
          background: var(--hero-gradient);
          color: #FFFFFF;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
          box-shadow: 4px 0 20px rgba(11, 46, 89, 0.15);
          transition: transform var(--transition-base);
        }

        .sams-sidebar-brand {
          padding: 22px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
        }

        .sams-brand-mark {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 198, 255, 0.35);
          flex-shrink: 0;
        }

        .sams-brand-mark-letter {
          font-size: 20px;
          font-weight: 900;
          color: #FFFFFF;
        }

        .sams-brand-name {
          font-size: 18px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: -0.02em;
        }

        .sams-brand-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sams-drawer-close-btn {
          margin-left: auto;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .sams-sidebar-nav {
          flex: 1;
          padding: 20px 14px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sams-nav-group-title {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 0 12px;
          margin-bottom: 8px;
        }

        .sams-nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
          font-weight: 600;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .sams-nav-link:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(3px);
        }

        .sams-nav-link.active {
          color: #FFFFFF;
          background: linear-gradient(90deg, rgba(46, 134, 193, 0.4) 0%, rgba(46, 134, 193, 0.15) 100%);
          border-left: 3px solid #38BDF8;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .sams-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        .sams-nav-link.active .sams-nav-icon {
          color: #38BDF8;
        }

        .sams-sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sams-user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.06);
          padding: 10px 12px;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sams-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #2E86C1 0%, #00C6FF 100%);
          color: white;
          font-weight: 800;
          font-size: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-user-details {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sams-user-role-tag {
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          text-transform: capitalize;
        }

        .sams-user-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ADE80;
        }

        .sams-quick-logout {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .sams-quick-logout:hover {
          color: #F87171;
          background: rgba(248, 113, 113, 0.15);
        }

        /* Main Content Wrapper */
        .sams-main-wrapper {
          flex: 1;
          margin-left: 260px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Topbar */
        .sams-topbar {
          height: 68px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .sams-topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sams-mobile-menu-trigger {
          display: none;
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sams-page-heading {
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.02em;
        }

        .sams-page-subheading {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sams-logout-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: #FFFFFF;
          border: 1.5px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-logout-pill-btn:hover {
          background: #FEF2F2;
          border-color: #FECACA;
          color: var(--danger);
        }

        /* Page Content Body */
        .sams-page-body {
          flex: 1;
          padding: 24px 28px 40px;
        }

        /* Mobile Bottom Nav */
        .sams-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 62px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid var(--border-subtle);
          display: none;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          z-index: 45;
          box-shadow: 0 -4px 16px rgba(11, 46, 89, 0.06);
        }

        .sams-bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: var(--text-secondary);
          text-decoration: none;
          background: transparent;
          border: none;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-bottom-nav-item.active {
          color: var(--primary);
        }

        .sams-bottom-nav-item.active .sams-bottom-nav-icon {
          color: var(--accent);
          transform: translateY(-1px);
        }

        .sams-bottom-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 20px;
        }

        /* Drawer Backdrop */
        .sams-drawer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(7, 30, 61, 0.5);
          backdrop-filter: blur(3px);
          z-index: 48;
        }

        /* Mobile Breakpoints */
        @media (max-width: 900px) {
          .sams-sidebar {
            transform: translateX(-100%);
          }

          .sams-sidebar.open {
            transform: translateX(0);
          }

          .sams-main-wrapper {
            margin-left: 0;
          }

          .sams-mobile-menu-trigger {
            display: flex;
          }

          .sams-page-body {
            padding: 16px 16px 80px;
          }

          .sams-topbar {
            padding: 0 16px;
          }

          .sams-logout-text {
            display: none;
          }

          .sams-bottom-nav {
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}