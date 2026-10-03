import { useEffect, useMemo, useState } from "react";
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
  SlidersHorizontal,
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
      {
        to: "/student/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      {
        to: "/student/activities",
        label: t("activities"),
        icon: BookOpenCheck,
      },
      {
        to: "/student/leaderboard",
        label: t("leaderboard"),
        icon: Trophy,
      },
      {
        to: "/student/calendar",
        label: t("calendar"),
        icon: Calendar,
      },
      {
        to: "/student/report",
        label: t("report"),
        icon: FileBarChart2,
      },
      {
        to: "/student/map-teacher",
        label: t("mapTeacher"),
        icon: QrCode,
      },
      {
        to: "/subscription",
        label: t("subscription"),
        icon: CreditCard,
      },
      {
        to: "/profile",
        label: t("profileTitle"),
        icon: UserCircle,
      },
    ];
  }

  if (role === "TEACHER") {
    return [
      {
        to: "/teacher/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      {
        to: "/teacher/students",
        label: t("students"),
        icon: Users,
      },
      {
        to: "/teacher/leaderboard",
        label: t("leaderboard"),
        icon: Trophy,
      },
      {
        to: "/subscription",
        label: t("subscription"),
        icon: CreditCard,
      },
      {
        to: "/profile",
        label: t("profileTitle"),
        icon: UserCircle,
      },
    ];
  }

  if (role === "PARENT") {
    return [
      {
        to: "/parent/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      {
        to: "/subscription",
        label: t("subscription"),
        icon: CreditCard,
      },
      {
        to: "/profile",
        label: t("profileTitle"),
        icon: UserCircle,
      },
    ];
  }

  if (role === "ADMIN") {
    return [
      {
        to: "/admin/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      {
        to: "/admin/teachers",
        label: t("teachers"),
        icon: GraduationCap,
      },
      {
        to: "/admin/students",
        label: t("students"),
        icon: Users,
      },
      {
        to: "/admin/payments",
        label: t("payments"),
        icon: Wallet,
      },
      {
        to: "/profile",
        label: t("profileTitle"),
        icon: UserCircle,
      },
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

/**
 * Responsive media-query hook.
 * Includes fallback support for older Safari versions.
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia(query);

    const handleChange = () => {
      setMatches(mediaQuery.matches);
    };

    handleChange();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

export default function Layout({
  children,
  title,
  subtitle,
  actions,
}) {
  const { role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();

  /*
   * Use the same breakpoint for:
   * - mobile sidebar
   * - mobile menu button
   * - mobile action dropdown
   */
  const isMobile = useMediaQuery("(max-width: 900px)");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

  const items = useMemo(() => navItems(role, t), [role, t]);

  const displayName =
    localStorage.getItem("displayName") ||
    ROLE_LABEL[role] ||
    "";

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  function openMobileSidebar() {
    setShowMobileActions(false);
    setMobileOpen(true);
  }

  function toggleMobileActions() {
    setMobileOpen(false);
    setShowMobileActions((current) => !current);
  }

  async function handleLogout() {
    closeMobileSidebar();
    setShowMobileActions(false);

    await logout();
    navigate("/login");
  }

  /*
   * Reset mobile-only states when switching back to desktop.
   */
  useEffect(() => {
    if (isMobile) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setShowMobileActions(false);
  }, [isMobile]);

  /*
   * Prevent the page behind the sidebar from scrolling.
   */
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  /*
   * Close the sidebar or mobile actions using Escape.
   */
  useEffect(() => {
    if (!mobileOpen && !showMobileActions) return undefined;

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      setMobileOpen(false);
      setShowMobileActions(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, showMobileActions]);

  return (
    <div
      className={
        "appShell" +
        (collapsed ? " sidebarCollapsed" : "")
      }
    >
      {/* Mobile sidebar background overlay */}
      {mobileOpen && (
        <button
          className="backdrop"
          type="button"
          onClick={closeMobileSidebar}
          aria-label="Close navigation menu"
        />
      )}

      {/* ─────────────────────────────────────
          Sidebar
      ───────────────────────────────────── */}
      <aside
        className={
          "sidebar" + (mobileOpen ? " mobileOpen" : "")
        }
        aria-label="Application navigation"
      >
        <div className="brand">
          <BrandMark size={34} />

          <div className="brand-text">
            <span className="brand-name">
              {t("appName")}
            </span>

            <span className="brand-tagline">
              {t("appTagline")}
            </span>
          </div>

          {/* Desktop collapse button */}
          <button
            className="sidebarCollapseBtn"
            type="button"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            title={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <PanelLeftClose size={16} />
            )}
          </button>

          {/* Mobile close button */}
          <button
            className="sidebarMobileClose"
            type="button"
            onClick={closeMobileSidebar}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="nav" aria-label="Primary navigation">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "active" : undefined
                }
                onClick={closeMobileSidebar}
                title={item.label}
              >
                <Icon
                  className="nav-icon"
                  size={18}
                  strokeWidth={2.1}
                />

                <span className="nav-label">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Avatar name={displayName} size={34} />

          <div className="sidebar-user">
            <div className="name">
              {displayName}
            </div>

            <div className="role">
              {ROLE_LABEL[role] || ""}
            </div>
          </div>

          <button
            className="icon-btn sidebarLogoutBtn"
            type="button"
            title={t("logout")}
            aria-label={t("logout")}
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─────────────────────────────────────
          Main content
      ───────────────────────────────────── */}
      <div className="content">
        <header className="topbar">
          {/* First/top row */}
          <div className="topbar-left">
            <button
              className="mobileMenuBtn"
              type="button"
              onClick={openMobileSidebar}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={19} />
            </button>

            <div className="topbar-titles">
              {title && (
                <h1 className="topbar-title">
                  {title}
                </h1>
              )}

              {subtitle && (
                <p className="topbar-subtitle">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Visible only at 900px and below */}
            <button
              className={
                "icon-btn topbar-more" +
                (showMobileActions ? " active" : "")
              }
              type="button"
              onClick={toggleMobileActions}
              aria-label={
                showMobileActions
                  ? "Close page actions"
                  : "Open page actions"
              }
              aria-expanded={showMobileActions}
              aria-controls="layout-action-panel"
              title={
                showMobileActions
                  ? "Close actions"
                  : "More actions"
              }
            >
              {showMobileActions ? (
                <X size={17} />
              ) : (
                <SlidersHorizontal size={17} />
              )}
            </button>
          </div>

          {/*
           * Desktop:
           * Always visible on the right.
           *
           * Mobile:
           * Hidden until topbar-more is clicked.
           */}
          <div
            id="layout-action-panel"
            className={
              "topbar-actionPanel" +
              (showMobileActions ? " isOpen" : "")
            }
          >
            <div className="topbar-actions">
              {actions && (
                <div className="topbar-pageActions">
                  {actions}
                </div>
              )}

              <div className="topbar-language">
                <LanguageSwitch />
              </div>

              <button
                className="icon-btn topbar-themeBtn"
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? (
                  <Sun size={16} />
                ) : (
                  <Moon size={16} />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="container">
          {children}
        </main>
      </div>

      <style>{`
        /* ============================================
           GENERAL WIDTH / OVERFLOW PROTECTION
        ============================================ */

        .appShell,
        .appShell *,
        .appShell *::before,
        .appShell *::after {
          box-sizing: border-box;
        }

        .appShell {
          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          overflow-x: hidden;
        }

        .content {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }

        .container {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        /* ============================================
           DESKTOP TOPBAR
        ============================================ */

        .topbar {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;

          overflow-x: hidden;
        }

        .topbar-left {
          flex: 1 1 auto;
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-titles {
          flex: 1 1 auto;
          min-width: 0;
        }

        .topbar-title {
          margin: 0;
          max-width: 100%;

          color: var(--ink, #0f172a);
          font-size: 15.5px;
          font-weight: 800;
          letter-spacing: -0.015em;
          line-height: 1.25;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .topbar-subtitle {
          margin: 2px 0 0;
          max-width: 100%;

          color: var(--text-muted, #64748b);
          font-size: 12.5px;
          line-height: 1.3;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Desktop action panel */
        .topbar-actionPanel {
          flex: 0 1 auto;
          min-width: 0;
          max-width: 65%;
          margin-left: auto;
        }

        .topbar-actions {
          width: 100%;
          max-width: 100%;
          min-width: 0;

          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
        }

        .topbar-pageActions {
          min-width: 0;
          max-width: 100%;

          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 8px;
        }

        .topbar-actions > *,
        .topbar-pageActions > * {
          min-width: 0;
          max-width: 100%;
        }

        .topbar-pageActions .btn {
          min-width: 0 !important;
          max-width: 100%;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .topbar-language {
          min-width: 0;
          max-width: 100%;
        }

        .topbar-themeBtn {
          flex: 0 0 auto;
        }

        /* Hidden on desktop */
        .topbar-more,
        .mobileMenuBtn {
          display: none !important;
        }

        /* ============================================
           SIDEBAR GENERAL
        ============================================ */

        .nav-label {
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-icon {
          flex: 0 0 auto;
        }

        .sidebarMobileClose {
          display: none;
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          margin-left: auto;

          border: 1px solid var(--border, #e2e8f0);
          border-radius: 10px;
          background: var(--surface, #ffffff);
          color: var(--text-muted, #64748b);

          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .sidebarMobileClose:hover {
          background: var(--muted, #f8fafc);
          color: var(--ink, #0f172a);
        }

        /* ============================================
           DESKTOP COLLAPSED SIDEBAR
        ============================================ */

        .sidebarCollapsed .nav a {
          position: relative;
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
          white-space: nowrap;
          border: 0;
        }

        .sidebarCollapsed .brand-text,
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

        /* ============================================
           MOBILE / TABLET
        ============================================ */

        @media (max-width: 900px) {
          /*
           * Topbar changes from a horizontal row into
           * a contained dropdown layout.
           */
          .topbar {
            height: auto !important;
            min-height: 0;

            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;

            gap: 0;
            padding-top: 10px;
            padding-bottom: 10px;

            overflow: hidden;
          }

          .topbar-left {
            width: 100%;
            max-width: 100%;
            min-width: 0;

            display: flex;
            align-items: center;
            gap: 9px;
          }

          .topbar-titles {
            flex: 1 1 0;
            min-width: 0;
          }

          .topbar-title {
            font-size: 15px;
          }

          .topbar-subtitle {
            font-size: 11.5px;
          }

          .mobileMenuBtn,
          .topbar-more {
            display: inline-flex !important;
            align-items: center;
            justify-content: center;

            flex: 0 0 36px;
            width: 36px;
            height: 36px;

            padding: 0;
            border-radius: 10px;
          }

          .topbar-more {
            margin-left: auto;
          }

          .topbar-more.active {
            color: var(--primary, #2563eb);
            background: var(--primary-50, #eff6ff);
            border-color: var(--primary-200, #bfdbfe);
          }

          /*
           * Action panel is hidden until the mobile
           * options button is pressed.
           */
          .topbar-actionPanel {
            display: none;
            width: 100%;
            max-width: 100%;
            min-width: 0;

            margin: 0;
          }

          .topbar-actionPanel.isOpen {
            display: block;

            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid
              var(--border-soft, #e2e8f0);

            animation: layoutActionsOpen 160ms ease-out;
          }

          .topbar-actions {
            width: 100%;
            min-width: 0;

            display: flex;
            align-items: center;
            justify-content: flex-start;
            flex-wrap: wrap;

            column-gap: 8px;
            row-gap: 8px;
          }

          /*
           * Page actions receive their own full row.
           * Print/download buttons can wrap safely.
           */
          .topbar-pageActions {
            flex: 1 1 100%;
            width: 100%;

            display: flex;
            justify-content: flex-start;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }

          .topbar-pageActions .btn {
            flex: 1 1 140px;
            width: auto;
            max-width: 100%;
            justify-content: center;
          }

          .topbar-language {
            flex: 0 1 auto;
            max-width: calc(100% - 46px);
          }

          .topbar-language > * {
            max-width: 100%;
          }

          /*
           * Mobile sidebar drawer
           */
          .sidebar {
            position: fixed !important;
            inset: 0 auto 0 0 !important;
            z-index: 1001 !important;

            width: min(94vw, 420px) !important;
            max-width: 420px !important;
            height: 100vh !important;
            height: 100dvh !important;
            min-height: 0 !important;

            display: flex !important;
            flex-direction: column;

            overflow: hidden !important;
            transform: translateX(-105%) !important;
            transition: transform 200ms ease !important;

            box-shadow: 20px 0 50px
              rgba(15, 23, 42, 0.22);
          }

          .sidebar.mobileOpen {
            transform: translateX(0) !important;
          }

          .sidebar .brand {
            flex: 0 0 auto;
            min-height: 58px;
            padding: 10px 12px;
          }

          .sidebar .brand-text {
            display: flex;
            min-width: 0;
          }

          .sidebar .brand-name,
          .sidebar .brand-tagline {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .sidebarMobileClose {
            display: inline-flex !important;
          }

          .sidebarCollapseBtn {
            display: none !important;
          }

          /*
           * Compact two-column navigation.
           * This prevents a long vertical mobile menu.
           */
          .sidebar .nav {
            flex: 1 1 auto;
            min-height: 0;

            display: grid !important;
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
            grid-auto-rows: minmax(66px, auto);
            align-content: start;

            gap: 8px !important;
            padding: 10px 12px !important;

            overflow-y: auto !important;
            overflow-x: hidden !important;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
          }

          .sidebar .nav a {
            width: 100%;
            min-width: 0;
            min-height: 66px;

            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            gap: 7px !important;
            padding: 9px 6px !important;
            margin: 0 !important;

            text-align: center;
            border-radius: 12px;
          }

          .sidebar .nav a .nav-icon {
            flex: 0 0 auto;
            width: 20px;
            height: 20px;
          }

          .sidebar .nav-label {
            position: static !important;
            width: auto !important;
            height: auto !important;
            margin: 0 !important;
            clip: auto !important;

            display: -webkit-box;
            max-width: 100%;

            font-size: 11.5px;
            line-height: 1.2;
            text-align: center;

            white-space: normal;
            overflow: hidden;
            overflow-wrap: anywhere;

            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .sidebar .sidebar-footer {
            flex: 0 0 auto;
            width: 100%;
            min-width: 0;

            margin-top: auto;
            padding: 10px 12px;

            border-top: 1px solid
              var(--border-soft, #e2e8f0);
          }

          .sidebar .sidebar-user {
            flex: 1 1 auto;
            min-width: 0;
          }

          .sidebar .sidebar-user .name,
          .sidebar .sidebar-user .role {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /*
           * Backdrop is a real button so it supports
           * click and keyboard accessibility.
           */
          .backdrop {
            position: fixed !important;
            inset: 0 !important;
            z-index: 1000 !important;

            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;

            border: 0;
            background: rgba(15, 23, 42, 0.55);
            cursor: default;
          }
        }

        /* ============================================
           SMALL PHONES
        ============================================ */

        @media (max-width: 520px) {
          .topbar {
            padding-left: 10px;
            padding-right: 10px;
          }

          .container {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .topbar-pageActions .btn {
            flex: 1 1 100%;
            width: 100%;
          }

          .sidebar {
            width: min(94vw, 360px) !important;
          }

          .sidebar .nav {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        /* ============================================
           TABLETS / LANDSCAPE MOBILE
           Four-column compact navigation
        ============================================ */

        @media (min-width: 600px) and (max-width: 900px) {
          .sidebar {
            width: min(94vw, 520px) !important;
            max-width: 520px !important;
          }

          .sidebar .nav {
            grid-template-columns:
              repeat(4, minmax(0, 1fr)) !important;
            grid-auto-rows: minmax(64px, auto);
          }

          .sidebar .nav a {
            min-height: 64px;
          }
        }

        @keyframes layoutActionsOpen {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sidebar,
          .topbar-actionPanel.isOpen {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}