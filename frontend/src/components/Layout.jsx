import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpenCheck,
  Trophy,
  FileBarChart2,
  QrCode,
  CreditCard,
  Users,
  GraduationCap,
  Wallet,
  Menu,
  LogOut,
  Moon,
  Sun,
  Calendar,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import LanguageSwitch from "./LanguageSwitch.jsx";
import BrandMark from "./BrandMark.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { useTheme } from "../state/ThemeContext.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import { Avatar } from "./ui.jsx";

function navItems(role, t) {
  if (role === "STUDENT") {
    return [
      { to: "/student/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/student/activities", label: t("activities"), icon: BookOpenCheck },
      { to: "/student/leaderboard", label: t("leaderboard"), icon: Trophy },
      { to: "/student/calendar", label: t("calendar"), icon: Calendar },
      { to: "/student/report", label: t("report"), icon: FileBarChart2 },
      { to: "/student/map-teacher", label: t("mapTeacher"), icon: QrCode },
      { to: "/subscription", label: t("subscription"), icon: CreditCard },
      { to: "/profile", label: t("profileTitle"), icon: UserCircle },
    ];
  }

  if (role === "TEACHER") {
    return [
      { to: "/teacher/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/teacher/students", label: t("students"), icon: Users },
      { to: "/teacher/leaderboard", label: t("leaderboard"), icon: Trophy },
      { to: "/subscription", label: t("subscription"), icon: CreditCard },
      { to: "/profile", label: t("profileTitle"), icon: UserCircle },
    ];
  }

  if (role === "PARENT") {
    return [
      { to: "/parent/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/subscription", label: t("subscription"), icon: CreditCard },
      { to: "/profile", label: t("profileTitle"), icon: UserCircle },
    ];
  }

  if (role === "ADMIN") {
    return [
      { to: "/admin/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/admin/teachers", label: t("teachers"), icon: GraduationCap },
      { to: "/admin/students", label: t("students"), icon: Users },
      { to: "/admin/payments", label: t("payments"), icon: Wallet },
      { to: "/profile", label: t("profileTitle"), icon: UserCircle },
    ];
  }

  return [];
}

const ROLE_LABEL = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  PARENT: "Parent",
  ADMIN: "Administrator",
};

export default function Layout({ children, title, subtitle, actions }) {
  const { role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const nav = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo(() => navItems(role, t), [role, t]);

  const displayName =
    localStorage.getItem("displayName") || ROLE_LABEL[role] || "";

  const handleMobileClose = () => setMobileOpen(false);

  const handleLogout = async () => {
    await logout();
    nav("/login");
  };

  return (
    <div className={"appShell" + (collapsed ? " sidebarCollapsed" : "")}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="backdrop"
          onClick={handleMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ========== Sidebar ========== */}
      <aside className={"sidebar" + (mobileOpen ? " mobileOpen" : "")}>
        {/* Brand row */}
        <div className="brand">
          <BrandMark size={34} />

          <div className="brand-text">
            <span className="brand-name">{t("appName")}</span>
            <span className="brand-tagline">{t("appTagline")}</span>
          </div>

          {/* Desktop collapse */}
          <button
            className="sidebarCollapseBtn"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          {/* Mobile close */}
          <button
            className="sidebarMobileClose"
            type="button"
            onClick={handleMobileClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav" aria-label="Primary">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : undefined)}
                onClick={handleMobileClose}
                title={item.label}
              >
                <Icon size={18} strokeWidth={2.1} />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="sidebar-footer">
          <Avatar name={displayName} size={34} />
          <div className="sidebar-user">
            <div className="name">{displayName}</div>
            <div className="role">{ROLE_LABEL[role] || ""}</div>
          </div>
          <button
            className="icon-btn"
            type="button"
            title={t("logout")}
            aria-label={t("logout")}
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ========== Main ========== */}
      <div className="content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobileMenuBtn"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              title="Open menu"
            >
              <Menu size={18} />
            </button>

            <div className="topbar-titles">
              {title && <h1 className="topbar-title">{title}</h1>}
              {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className="topbar-right">
            {actions}
            <LanguageSwitch />
            <button
              className="icon-btn"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="container">{children}</main>
      </div>

      {/* Scoped layout polish */}
      <style>{`
        /* ---- Topbar refinements ---- */
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .topbar-titles {
          min-width: 0;
        }
        .topbar-title {
          margin: 0;
          font-size: 15.5px;
          font-weight: 800;
          color: var(--ink);
          letter-spacing: -0.015em;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .topbar-subtitle {
          margin: 1px 0 0;
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* ---- Mobile close button (only visible in drawer) ---- */
        .sidebarMobileClose {
          display: none;
          margin-left: auto;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-muted);
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .sidebarMobileClose:hover {
          background: var(--muted);
          color: var(--ink);
        }
        @media (max-width: 900px) {
          .sidebarMobileClose {
            display: inline-flex;
          }
          .sidebarCollapseBtn {
            display: none !important;
          }
        }

        /* ---- Nav label (for collapse) ---- */
        .nav-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ---- Collapsed polish ---- */
        .sidebarCollapsed .nav a {
          justify-content: center;
          padding-left: 10px;
          padding-right: 10px;
        }
        .sidebarCollapsed .nav-label {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }
        .sidebarCollapsed .brand-text {
          display: none;
        }
        .sidebarCollapsed .sidebar-user {
          display: none;
        }
        .sidebarCollapsed .sidebar-footer {
          justify-content: center;
        }
        .sidebarCollapsed .sidebarCollapseBtn {
          position: static;
          margin-left: 0;
        }
        .sidebarCollapsed .brand {
          justify-content: center;
          gap: 0;
        }
      `}</style>
    </div>
  );
}