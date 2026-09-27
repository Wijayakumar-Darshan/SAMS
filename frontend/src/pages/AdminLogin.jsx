import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ShieldCheck, Moon, Sun } from "lucide-react";

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
      toast.show(err?.data?.message || (lang === "si" ? "පිවිසුම අසාර්ථකයි" : "Login failed"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        .adm-wrap{
          min-height:100vh;
          background:#EEF3FC;
          display:flex;
          align-items:stretch;
          justify-content:center;
          font-family: Inter, "Noto Sans Sinhala", system-ui, sans-serif;
        }

        .adm-grid{
          width:100%;
          max-width:1100px;
          min-height:100vh;
          display:grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          background:#fff;
          box-shadow: 0 30px 80px -30px rgba(15,42,92,0.35);
        }

        @media (max-width:900px){
          .adm-grid{ grid-template-columns: 1fr; }
          .adm-left{ display:none; }
        }

        /* Left panel */
        .adm-left{
          background: linear-gradient(165deg, #14306B 0%, #0B1F4B 75%);
          color:#fff;
          padding:44px 40px 36px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          position:relative;
          overflow:hidden;
        }
        .adm-brand{
          display:flex;
          align-items:center;
          gap:10px;
        }
        .adm-mark{
          width:34px;height:34px;border-radius:9px;
          background:#fff;color:#1D4ED8;
          display:flex;align-items:center;justify-content:center;
          font-family: Fraunces, serif;
          font-weight:600;
        }
        .adm-brand-name{ font-weight:600; font-size:15px; letter-spacing:.01em; }

        .adm-hero{
          max-width:380px;
        }
        .adm-title{
          font-family: Fraunces, serif;
          font-weight:500;
          font-size:30px;
          line-height:1.22;
          letter-spacing:-0.01em;
          margin:22px 0 10px;
        }
        .adm-sub{
          font-size:14px;
          line-height:1.6;
          color:rgba(255,255,255,0.72);
          max-width:360px;
        }
        .adm-chipRow{
          display:flex;gap:10px;flex-wrap:wrap;
          margin-top:18px;
        }
        .adm-chip{
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.16);
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 12px;
          color: rgba(255,255,255,0.9);
          display:flex;align-items:center;gap:8px;
        }

        /* Right panel */
        .adm-right{
          padding:44px 46px 36px;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }
        .adm-head{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          margin-bottom:22px;
        }
        .adm-h1{
          font-family: Fraunces, serif;
          font-weight:500;
          font-size:24px;
          color:#0B1220;
        }
        .adm-hsub{
          font-size:13.5px;
          color:#5B657A;
          margin-top:4px;
        }

        .adm-field{ margin-bottom:16px; }
        .adm-label{
          display:block;
          font-size:13px;
          font-weight:500;
          color:#344054;
          margin-bottom:6px;
        }

        .adm-inputWrap{ position:relative; }
        .adm-input{
          width:100%;
          padding:11px 13px;
          border-radius:9px;
          border:1.5px solid #DCE3F0;
          font-size:14.5px;
          color:#0B1220;
        }
        .adm-input:focus{
          outline:none;
          border-color:#1D4ED8;
          box-shadow:0 0 0 3px rgba(29,78,216,0.12);
        }
        .adm-suffix{
          position:absolute;
          right:6px;
          top:50%;
          transform:translateY(-50%);
          border:none;
          background:transparent;
          padding:6px;
          border-radius:6px;
          color:#8A93A6;
          cursor:pointer;
          display:flex;
        }
        .adm-suffix:hover{ color:#1D4ED8; background:#EFF4FE; }

        .adm-submit{
          width:100%;
          padding:12px 16px;
          border-radius:9px;
          border:none;
          background:#1D4ED8;
          color:#fff;
          font-size:14.5px;
          font-weight:600;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
        }
        .adm-submit:disabled{ opacity:0.7; cursor:default; }
        .spin{ animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .adm-actions{
          display:flex;
          gap:10px;
          margin-top:12px;
        }
        .adm-outline{
          flex:1;
          padding:10px 12px;
          border-radius:9px;
          border:1.5px solid #DCE3F0;
          background:#fff;
          color:#344054;
          font-size:13.5px;
          font-weight:500;
          cursor:pointer;
        }
        .adm-outline:hover{ border-color:#1D4ED8; color:#1D4ED8; }

        .adm-note{
          margin-top:18px;
          font-size:12px;
          color:#8A93A6;
          display:flex;
          align-items:center;
          gap:8px;
        }

        .adm-badge{
          display:inline-flex;
          align-items:center;
          gap:8px;
          background:#EFF4FE;
          border:1px solid #DCE3F0;
          color:#1D4ED8;
          padding:8px 10px;
          border-radius:12px;
          font-size:12px;
          margin-top:12px;
        }

        .adm-theme-btn{
          width:34px;height:34px;border-radius:9px;border:1.5px solid #DCE3F0;
          background:#fff;color:#5B657A;display:flex;align-items:center;justify-content:center;
          cursor:pointer; transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
        }
        .adm-theme-btn:hover{ border-color:#1D4ED8; color:#1D4ED8; }

        /* ---- Dark mode: right panel only ---- */
        [data-theme="dark"] .adm-wrap { background: var(--bg); }
        [data-theme="dark"] .adm-grid { background: var(--surface); box-shadow: var(--shadow-lg); }
        [data-theme="dark"] .adm-right { background: var(--surface); }
        [data-theme="dark"] .adm-h1 { color: var(--ink); }
        [data-theme="dark"] .adm-hsub { color: var(--text-muted); }
        [data-theme="dark"] .adm-label { color: var(--text); }
        [data-theme="dark"] .adm-input { background: var(--muted); border-color: var(--border); color: var(--ink); }
        [data-theme="dark"] .adm-input:focus { border-color: var(--primary); box-shadow: var(--shadow-focus); }
        [data-theme="dark"] .adm-suffix { color: var(--text-faint); }
        [data-theme="dark"] .adm-suffix:hover { color: var(--primary); background: var(--primary-50); }
        [data-theme="dark"] .adm-submit { background: var(--primary); }
        [data-theme="dark"] .adm-outline { background: var(--muted); border-color: var(--border); color: var(--text); }
        [data-theme="dark"] .adm-outline:hover { border-color: var(--primary); color: var(--primary); }
        [data-theme="dark"] .adm-note { color: var(--text-faint); }
        [data-theme="dark"] .adm-badge { background: var(--primary-50); border-color: var(--border); color: var(--primary); }
        [data-theme="dark"] .adm-theme-btn { background: var(--muted); border-color: var(--border); color: var(--text-muted); }
        [data-theme="dark"] .adm-theme-btn:hover { border-color: var(--primary); color: var(--primary); }
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
              <div className="adm-title">
                {lang === "si" ? "පරිපාලක පුවරුව" : "Administrator Portal"}
              </div>
              <div className="adm-sub">
                {lang === "si"
                  ? "ගුරුවරුන් සෑදීම, පාසල් ව්‍යුහය, ගෙවීම් සත්‍යාපනය සහ කාලසීමා දිගු කිරීම මෙහි සිදු කරයි."
                  : "Manage teachers, school structure, verify payments, and extend expiry dates securely."}
              </div>

              <div className="adm-chipRow">
                <div className="adm-chip">
                  <ShieldCheck size={16} />
                  {lang === "si" ? "ආරක්ෂිත පිවිසුම" : "Secure access"}
                </div>
                <div className="adm-chip">
                  <span style={{ fontWeight: 700 }}>UTC</span>
                  {lang === "si" ? "ගබඩා · Colombo දර්ශනය" : "Stored · Colombo display"}
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 14 }}>
            {t("appName")} · Admin
          </div>
        </div>

        {/* RIGHT */}
        <div className="adm-right">
          <div className="adm-head">
            <div>
              <div className="adm-h1">{lang === "si" ? "Admin පිවිසුම" : "Admin Login"}</div>
              <div className="adm-hsub">
                {lang === "si" ? "පරිපාලක ගිණුමට පමණක්" : "For admin accounts only"}
              </div>
            </div>
            <div className="center-v" style={{ gap: 6 }}>
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
              <label className="adm-label">{t("email")}</label>
              <input
                className="adm-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@timetable.lk"
                type="email"
                required
              />
            </div>

            <div className="adm-field">
              <label className="adm-label">{t("password")}</label>
              <div className="adm-inputWrap">
                <input
                  className="adm-input"
                  style={{ paddingRight: 42 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPw ? "text" : "password"}
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
              {loading ? (lang === "si" ? "පිවිසෙමින්..." : "Signing in…") : (lang === "si" ? "පිවිසෙන්න" : "Sign in")}
            </button>

            <div className="adm-actions">
              <button type="button" className="adm-outline" onClick={() => nav("/login")}>
                {lang === "si" ? "පිටුපසට" : "Back"}
              </button>
              {/* <button type="button" className="adm-outline" onClick={() => nav("/subscription")}>
                {t("subscription")}
              </button> */}
            </div>

            <div className="adm-badge">
              <ShieldCheck size={16} />
              {lang === "si" ? "Admin පිවිසුම සඟවා ඇත. URL එක පමණක් භාවිතා කරන්න." : "Admin login is hidden. Use the direct URL only."}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}