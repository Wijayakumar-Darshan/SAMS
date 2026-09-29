import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck, Moon, Sun, Lock, ArrowLeft } from "lucide-react";

import LanguageSwitch from "../components/LanguageSwitch.jsx";
import BrandMark from "../components/BrandMark.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useTheme } from "../state/ThemeContext.jsx";
import { useI18n } from "../i18n/i18n.jsx";

export default function AdminLogin() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const auth = useAuth();
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState("admin@timetable.lk");
  const [password, setPassword] = useState("admin123");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.auth.adminLogin({ email, password });
      auth.setSession(data);
      toast.show(lang === "si" ? "සාර්ථකයි" : "Logged in", "success");
      nav("/admin/dashboard");
    } catch (err) {
      toast.show(
        err?.data?.message || (lang === "si" ? "පිවිසුම අසාර්ථකයි" : "Login failed"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        .adm-wrap {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(29, 78, 216, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 85% 15%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
            #F4F7FC;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: Inter, "Noto Sans Sinhala", system-ui, sans-serif;
        }

        .adm-grid {
          width: 100%;
          max-width: 980px;
          min-height: 560px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(15, 42, 92, 0.04),
            0 24px 64px -16px rgba(15, 42, 92, 0.18);
        }

        @media (max-width: 860px) {
          .adm-grid {
            grid-template-columns: 1fr;
            min-height: auto;
            max-width: 440px;
          }
          .adm-left { display: none; }
          .adm-right { padding: 32px 28px 28px; }
        }

        /* ── Left panel ── */
        .adm-left {
          background: linear-gradient(160deg, #0F2A5C 0%, #0A1C42 55%, #081633 100%);
          color: #fff;
          padding: 40px 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .adm-left::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 10% 90%, rgba(59, 130, 246, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 10%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
          pointer-events: none;
        }
        .adm-left > * { position: relative; z-index: 1; }

        .adm-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .adm-brand-name {
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.01em;
        }

        .adm-hero { margin-top: 48px; max-width: 340px; }
        .adm-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(147, 197, 253, 0.9);
          margin-bottom: 14px;
        }
        .adm-title {
          font-family: Fraunces, serif;
          font-weight: 500;
          font-size: 28px;
          line-height: 1.25;
          letter-spacing: -0.02em;
          margin: 0 0 12px;
        }
        .adm-sub {
          font-size: 14px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.68);
        }

        .adm-chipRow {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 28px;
        }
        .adm-chip {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 7px 11px;
          border-radius: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.88);
          display: flex;
          align-items: center;
          gap: 7px;
          backdrop-filter: blur(4px);
        }

        .adm-footer {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 16px;
          margin-top: 32px;
        }

        /* ── Right panel ── */
        .adm-right {
          padding: 44px 44px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .adm-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 28px;
        }
        .adm-h1 {
          font-family: Fraunces, serif;
          font-weight: 500;
          font-size: 24px;
          color: #0B1220;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .adm-hsub {
          font-size: 13.5px;
          color: #64748B;
          margin-top: 5px;
        }
        .adm-tools {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .adm-field { margin-bottom: 18px; }
        .adm-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 7px;
        }

        .adm-inputWrap { position: relative; }
        .adm-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          font-size: 14.5px;
          color: #0F172A;
          background: #fff;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .adm-input::placeholder { color: #94A3B8; }
        .adm-input:hover { border-color: #CBD5E1; }
        .adm-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12);
        }

        .adm-suffix {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          padding: 7px;
          border-radius: 7px;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          transition: color 0.12s, background 0.12s;
        }
        .adm-suffix:hover {
          color: #2563EB;
          background: #EFF6FF;
        }

        .adm-submit {
          width: 100%;
          padding: 13px 16px;
          border-radius: 10px;
          border: none;
          background: #1D4ED8;
          color: #fff;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 1px 2px rgba(29, 78, 216, 0.2);
        }
        .adm-submit:hover:not(:disabled) {
          background: #1E40AF;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
        }
        .adm-submit:active:not(:disabled) { transform: scale(0.985); }
        .adm-submit:disabled { opacity: 0.7; cursor: default; }

        .spin { animation: adm-spin 0.75s linear infinite; }
        @keyframes adm-spin { to { transform: rotate(360deg); } }

        .adm-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }
        .adm-outline {
          flex: 1;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: #fff;
          color: #475569;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: border-color 0.12s, color 0.12s, background 0.12s;
        }
        .adm-outline:hover {
          border-color: #2563EB;
          color: #1D4ED8;
          background: #F8FAFC;
        }

        .adm-badge {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #F0F7FF;
          border: 1px solid #DBEAFE;
          color: #1E40AF;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 12.5px;
          line-height: 1.45;
          margin-top: 20px;
        }
        .adm-badge svg { flex-shrink: 0; margin-top: 1px; }

        .adm-theme-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: #fff;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.12s, color 0.12s, background 0.12s;
        }
        .adm-theme-btn:hover {
          border-color: #2563EB;
          color: #1D4ED8;
          background: #F8FAFC;
        }

        /* ── Dark mode ── */
        [data-theme="dark"] .adm-wrap {
          background:
            radial-gradient(ellipse 80% 60% at 20% 40%, rgba(37, 99, 235, 0.1) 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 85% 15%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
            var(--bg, #0B1220);
        }
        [data-theme="dark"] .adm-grid {
          background: var(--surface, #111827);
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.05),
            0 24px 64px -16px rgba(0, 0, 0, 0.5);
        }
        [data-theme="dark"] .adm-right { background: var(--surface, #111827); }
        [data-theme="dark"] .adm-h1 { color: var(--ink, #F1F5F9); }
        [data-theme="dark"] .adm-hsub { color: var(--text-muted, #94A3B8); }
        [data-theme="dark"] .adm-label { color: var(--text, #CBD5E1); }
        [data-theme="dark"] .adm-input {
          background: var(--muted, #1E293B);
          border-color: var(--border, #334155);
          color: var(--ink, #F1F5F9);
        }
        [data-theme="dark"] .adm-input:hover { border-color: #475569; }
        [data-theme="dark"] .adm-input:focus {
          border-color: var(--primary, #3B82F6);
          box-shadow: 0 0 0 3.5px rgba(59, 130, 246, 0.2);
        }
        [data-theme="dark"] .adm-suffix { color: var(--text-faint, #64748B); }
        [data-theme="dark"] .adm-suffix:hover {
          color: var(--primary, #3B82F6);
          background: rgba(59, 130, 246, 0.12);
        }
        [data-theme="dark"] .adm-submit { background: var(--primary, #2563EB); }
        [data-theme="dark"] .adm-submit:hover:not(:disabled) { background: #1D4ED8; }
        [data-theme="dark"] .adm-outline {
          background: var(--muted, #1E293B);
          border-color: var(--border, #334155);
          color: var(--text, #CBD5E1);
        }
        [data-theme="dark"] .adm-outline:hover {
          border-color: var(--primary, #3B82F6);
          color: var(--primary, #3B82F6);
          background: rgba(59, 130, 246, 0.08);
        }
        [data-theme="dark"] .adm-badge {
          background: rgba(37, 99, 235, 0.1);
          border-color: rgba(59, 130, 246, 0.25);
          color: #93C5FD;
        }
        [data-theme="dark"] .adm-theme-btn {
          background: var(--muted, #1E293B);
          border-color: var(--border, #334155);
          color: var(--text-muted, #94A3B8);
        }
        [data-theme="dark"] .adm-theme-btn:hover {
          border-color: var(--primary, #3B82F6);
          color: var(--primary, #3B82F6);
        }
      `}</style>

      <div className="adm-grid">
        {/* LEFT */}
        <div className="adm-left">
          <div>
            <div className="adm-brand">
              <BrandMark size={34} />
              <div className="adm-brand-name">{t("appName")}</div>
            </div>

            <div className="adm-hero">
              <div className="adm-kicker">
                <Lock size={12} />
                {lang === "si" ? "පරිපාලක" : "Administrator"}
              </div>
              <h1 className="adm-title">
                {lang === "si" ? "පරිපාලක පුවරුව" : "Administrator Portal"}
              </h1>
              <p className="adm-sub">
                {lang === "si"
                  ? "ගුරුවරුන් සෑදීම, පාසල් ව්‍යුහය, ගෙවීම් සත්‍යාපනය සහ කාලසීමා දිගු කිරීම මෙහි සිදු කරයි."
                  : "Manage teachers, school structure, verify payments, and extend expiry dates securely."}
              </p>

              <div className="adm-chipRow">
                <div className="adm-chip">
                  <ShieldCheck size={15} />
                  {lang === "si" ? "ආරක්ෂිත පිවිසුම" : "Secure access"}
                </div>
                <div className="adm-chip">
                  <span style={{ fontWeight: 700, fontSize: 11 }}>UTC</span>
                  {lang === "si" ? "ගබඩා · Colombo දර්ශනය" : "Stored · Colombo display"}
                </div>
              </div>
            </div>
          </div>

          <div className="adm-footer">
            {t("appName")} · Admin
          </div>
        </div>

        {/* RIGHT */}
        <div className="adm-right">
          <div className="adm-head">
            <div>
              <h2 className="adm-h1">
                {lang === "si" ? "Admin පිවිසුම" : "Admin Login"}
              </h2>
              <p className="adm-hsub">
                {lang === "si" ? "පරිපාලක ගිණුමට පමණක්" : "For admin accounts only"}
              </p>
            </div>
            <div className="adm-tools">
              <button
                type="button"
                className="adm-theme-btn"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <LanguageSwitch />
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-email">
                {t("email")}
              </label>
              <input
                id="adm-email"
                className="adm-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@timetable.lk"
                type="email"
                autoComplete="username"
                required
              />
            </div>

            <div className="adm-field">
              <label className="adm-label" htmlFor="adm-password">
                {t("password")}
              </label>
              <div className="adm-inputWrap">
                <input
                  id="adm-password"
                  className="adm-input"
                  style={{ paddingRight: 44 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="adm-suffix"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="adm-submit" type="submit" disabled={loading}>
              {loading && <Loader2 size={16} className="spin" />}
              {loading
                ? lang === "si"
                  ? "පිවිසෙමින්..."
                  : "Signing in…"
                : lang === "si"
                  ? "පිවිසෙන්න"
                  : "Sign in"}
            </button>

            <div className="adm-actions">
              <button
                type="button"
                className="adm-outline"
                onClick={() => nav("/login")}
              >
                <ArrowLeft size={15} />
                {lang === "si" ? "පිටුපසට" : "Back"}
              </button>
            </div>

            <div className="adm-badge">
              <ShieldCheck size={16} />
              <span>
                {lang === "si"
                  ? "Admin පිවිසුම සඟවා ඇත. URL එක පමණක් භාවිතා කරන්න."
                  : "Admin login is hidden. Use the direct URL only."}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}