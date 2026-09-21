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
  Sun
} from "lucide-react";
import LanguageSwitch from "./LanguageSwitch.jsx";
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
      { to: "/student/report", label: t("report"), icon: FileBarChart2 },
      { to: "/student/map-teacher", label: t("mapTeacher"), icon: QrCode },
      { to: "/subscription", label: t("subscription"), icon: CreditCard }
    ];
  }
  if (role === "TEACHER") {
    return [
      { to: "/teacher/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/teacher/students", label: t("students"), icon: Users },
      { to: "/teacher/leaderboard", label: t("leaderboard"), icon: Trophy },
      { to: "/subscription", label: t("subscription"), icon: CreditCard }
    ];
  }
  if (role === "PARENT") {
    return [
      { to: "/parent/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/subscription", label: t("subscription"), icon: CreditCard }
    ];
  }
  if (role === "ADMIN") {
    return [
      { to: "/admin/dashboard", label: t("dashboard"), icon: LayoutDashboard },
      { to: "/admin/teachers", label: t("teachers"), icon: GraduationCap },
      { to: "/admin/payments", label: t("payments"), icon: Wallet }
    ];
  }
  return [];
}

const ROLE_LABEL = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  PARENT: "Parent",
  ADMIN: "Administrator"
};

export default function Layout({ children, title, subtitle, actions }) {
  const { role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => navItems(role, t), [role, t]);
  const displayName = localStorage.getItem("displayName") || ROLE_LABEL[role] || "";

  return (
    <div className="appShell">
      {mobileOpen && <div className="backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={"sidebar " + (mobileOpen ? "mobileOpen" : "")}>
        <div className="brand">
          <div className="brand-mark">S</div>
          {t("appName")}
        </div>

        <nav className="nav" aria-label="Primary">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                {it.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Avatar name={displayName} />
          <div className="sidebar-user">
            <div className="name">{displayName}</div>
            <div className="role">{ROLE_LABEL[role] || ""}</div>
          </div>
          <button
            className="icon-btn"
            type="button"
            title={t("logout")}
            aria-label={t("logout")}
            onClick={async () => {
              await logout();
              nav("/login");
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="content">
        <div className="topbar">
          <div className="center-v">
            <button
              className="mobileMenuBtn"
              onClick={() => setMobileOpen(true)}
              type="button"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              {title && <div style={{ fontWeight: 800, fontSize: 15.5, color: "var(--ink)" }}>{title}</div>}
              {subtitle && <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{subtitle}</div>}
            </div>
          </div>

          <div className="center-v">
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
        </div>

        <div className="container">{children}</div>
      </div>
    </div>
  );
}
