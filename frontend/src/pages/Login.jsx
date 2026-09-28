import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Lock,
  KeyRound,
  Users,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Moon,
  Sun,
  BookOpen,
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import BrandMark from "../components/BrandMark.jsx";
import { useTheme } from "../state/ThemeContext.jsx";
import { useI18n } from "../i18n/i18n.jsx";

// Roles shown to normal users (Admin is hidden)
const ROLES = [
  { key: "STUDENT", label: "Student", icon: GraduationCap },
  { key: "TEACHER", label: "Teacher", icon: BookOpen },
  { key: "PARENT", label: "Parent", icon: Users },
];

// Illustration (kept, slightly tuned colors)
function PlannerIllustration() {
  const days = ["M", "T", "W", "T", "F"];
  const colWidth = 50;
  const colGap = 10;
  const startX = 46;
  const taskColors = ["#93C5FD", "#60A5FA", "#3B82F6", "#BFDBFE"];
  const dayTasks = [
    [0.7, 0.45],
    [0.55, 0.3, 0.4],
    [0.65, 0.5],
    [0.4, 0.6, 0.3],
    [0.5, 0.35],
  ];

  return (
    <svg viewBox="0 0 440 400" className="lp-illustration" aria-hidden="true">
      <circle cx="360" cy="70" r="130" fill="#38BDF8" opacity="0.18" />
      <circle cx="60" cy="330" r="110" fill="#2563EB" opacity="0.2" />

      <rect x="44" y="64" width="320" height="260" rx="22" fill="#0B1F4B" opacity="0.2" />
      <rect x="40" y="58" width="320" height="260" rx="22" fill="#FFFFFF" />

      <rect x="40" y="58" width="320" height="52" rx="22" fill="#2563EB" />
      <circle cx="64" cy="84" r="5" fill="#93C5FD" />
      <rect x="80" y="79" width="90" height="10" rx="5" fill="rgba(255,255,255,0.9)" />
      <circle cx="330" cy="84" r="12" fill="rgba(255,255,255,0.18)" />
      <path d="M325 84 l3 3 l7 -7" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {days.map((d, i) => {
        const x = startX + i * (colWidth + colGap);
        return (
          <g key={i}>
            <text
              x={x + colWidth / 2}
              y={132}
              textAnchor="middle"
              fontFamily="Inter, sans-serif"
              fontSize="12"
              fontWeight="600"
              fill="#0F172A"
            >
              {d}
            </text>
            <rect x={x} y={144} width={colWidth} height={150} rx="10" fill="#EFF6FF" />
            {dayTasks[i].map((h, j) => (
              <rect
                key={j}
                x={x + 6}
                y={154 + j * 46}
                width={colWidth - 12}
                height={34 * h}
                rx="6"
                fill={taskColors[(i + j) % taskColors.length]}
              />
            ))}
          </g>
        );
      })}

      <circle cx="378" cy="150" r="30" fill="#0F172A" />
      <circle cx="378" cy="150" r="21" fill="#FFFFFF" />
      <line x1="378" y1="150" x2="378" y2="137" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
      <line x1="378" y1="150" x2="387" y2="153" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />

      <rect x="18" y="288" width="150" height="62" rx="16" fill="#FFFFFF" />
      <circle cx="50" cy="319" r="17" fill="#DBEAFE" />
      <path
        d="M50 308c5 5 8 9 8 14a8 8 0 1 1-16 0c0-2 1-4 2-6 1 3 3 4 4 3-1-3 0-7 2-11Z"
        fill="#2563EB"
      />
      <text x="76" y="315" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#0F172A">
        12-day streak
      </text>
      <text x="76" y="331" fontFamily="Inter, sans-serif" fontSize="11" fill="#64748B">
        Keep today going
      </text>
    </svg>
  );
}

export default function Login() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const auth = useAuth();
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [tab, setTab] = useState("STUDENT");
  const [teacherMode, setTeacherMode] = useState("password");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  const txt = {
    teacherPwLogin: lang === "si" ? "ගුරු මුරපදයෙන් පිවිසෙන්න" : "Teacher password login",
    teacherOtpLogin: lang === "si" ? "පළමු වරට OTP භාවිතා කරන්න" : "First time? Use OTP",
    teacherUsePw: lang === "si" ? "මුරපදයෙන් පිවිසෙන්න" : "Use password login",
    signInSubtitle: lang === "si" ? "ඔබගේ ඩැෂ්බෝඩ් වෙත යාම සඳහා පිවිසෙන්න" : "Sign in to continue to your dashboard",
    signingIn: lang === "si" ? "පිවිසෙමින්..." : "Signing in…",
    adminHiddenNote: lang === "si" ? "Admin පිවිසුම /admin-login වෙතින්" : "Admin login is at /admin-login",
  };

  function switchTab(next) {
    setTab(next);
    if (next !== "TEACHER") setTeacherMode("password");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === "STUDENT") {
        const data = await api.auth.studentLogin({ email, password });
        auth.setSession(data);
        toast.show(lang === "si" ? "සාර්ථකයි" : "Welcome back!", "success");
        nav("/student/dashboard");
      }

      if (tab === "TEACHER") {
        if (teacherMode === "otp") {
          const data = await api.auth.teacherLoginOtp({ email: otpEmail, otp });
          auth.setSession(data);
          toast.show(lang === "si" ? "සාර්ථකයි" : "Welcome back!", "success");
          nav("/teacher/dashboard");
        } else {
          const data = await api.auth.teacherLoginPassword({ email, password });
          auth.setSession(data);
          toast.show(lang === "si" ? "සාර්ථකයි" : "Welcome back!", "success");
          nav("/teacher/dashboard");
        }
      }

      if (tab === "PARENT") {
        const data = await api.auth.parentLogin({ guardianName, studentEmail, studentPassword });
        auth.setSession(data);
        toast.show(lang === "si" ? "සාර්ථකයි" : "Welcome back!", "success");
        nav("/parent/dashboard");
      }
    } catch (err) {
      const code = err?.data?.error;
      const msg =
        err?.data?.message ||
        (lang === "si"
          ? "පිවිසුම අසාර්ථකයි. නැවත උත්සාහ කරන්න."
          : "Login failed. Please check your details and try again.");

      if (code === "TRIAL_EXPIRED") {
        toast.show(msg, "error");
        nav("/subscription");
        return;
      }
      toast.show(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lp-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        .lp-wrap {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          justify-content: center;
          background: #F4F7FF;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0;
        }

        .lp-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          width: 100%;
          max-width: 1140px;
          margin: auto;
          min-height: 100vh;
          background: #FFFFFF;
          box-shadow: 0 25px 60px -20px rgba(15, 23, 42, 0.18);
        }

        @media (max-width: 900px) {
          .lp-grid { grid-template-columns: 1fr; }
          .lp-promo { display: none; }
        }

        /* ===== Left Promo Panel ===== */
        .lp-promo {
          position: relative;
          background: linear-gradient(145deg, #1E3A8A 0%, #1E40AF 45%, #0F766E 100%);
          color: #fff;
          padding: 40px 36px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        .lp-promo::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 15% 30%, rgba(56, 189, 248, 0.22) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 85% 70%, rgba(16, 185, 129, 0.18) 0%, transparent 50%);
          pointer-events: none;
        }

        .lp-promo-top {
          display: flex;
          align-items: center;
          gap: 11px;
          position: relative;
          z-index: 1;
        }

        .lp-mark {
          width: 36px;
          height: 36px;
          border-radius: 11px;
          background: #FFFFFF;
          color: #2563EB;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 17px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }

        .lp-brand-name {
          font-weight: 700;
          font-size: 15.5px;
          letter-spacing: -0.01em;
        }

        .lp-promo-mid {
          max-width: 380px;
          margin-top: 12px;
          position: relative;
          z-index: 1;
        }

        .lp-headline {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: clamp(26px, 2.8vw, 30px);
          line-height: 1.22;
          letter-spacing: -0.02em;
          margin: 18px 0 12px;
        }

        .lp-sub {
          font-size: 14.5px;
          line-height: 1.65;
          color: rgba(255,255,255,0.82);
          max-width: 340px;
        }

        .lp-illustration-wrap {
          margin-top: 20px;
          position: relative;
          z-index: 1;
        }

        .lp-illustration {
          width: 100%;
          max-width: 380px;
          height: auto;
          display: block;
          filter: drop-shadow(0 12px 28px rgba(0,0,0,0.2));
        }

        /* ===== Right Form Panel ===== */
        .lp-form-panel {
          padding: 40px 42px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #FFFFFF;
          animation: lpRise 0.45s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        @keyframes lpRise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-form-panel { animation: none; }
        }

        .lp-form-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .lp-title {
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 26px;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .lp-title-sub {
          font-size: 14px;
          color: #64748B;
          margin-top: 5px;
        }

        .lp-mobile-brand {
          display: none;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
        }
        @media (max-width: 900px) {
          .lp-mobile-brand { display: flex; }
        }

        .lp-head-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lp-theme-btn {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .lp-theme-btn:hover {
          border-color: #2563EB;
          color: #2563EB;
          background: #EFF6FF;
        }

        /* Role selector */
        .lp-role-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          margin-bottom: 10px;
        }

        .lp-roles {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 26px;
        }
        @media (max-width: 420px) {
          .lp-roles { grid-template-columns: 1fr 1fr; }
        }

        .lp-role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 14px 8px;
          border-radius: 14px;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          color: #64748B;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lp-role-btn:hover {
          border-color: #93C5FD;
          color: #2563EB;
          background: #EFF6FF;
          transform: translateY(-1px);
        }
        .lp-role-btn.active {
          border-color: #2563EB;
          background: #2563EB;
          color: #fff;
          box-shadow: 0 6px 16px -4px rgba(37, 99, 235, 0.4);
        }
        .lp-role-btn:focus-visible {
          outline: 2px solid #2563EB;
          outline-offset: 2px;
        }

        /* Form fields */
        .lp-field {
          margin-bottom: 16px;
        }

        .lp-label {
          display: block;
          font-size: 13.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 7px;
        }

        .lp-input-wrap {
          position: relative;
        }

        .lp-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 14.5px;
          font-family: inherit;
          color: #0F172A;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .lp-input::placeholder {
          color: #94A3B8;
        }
        .lp-input:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .lp-input-suffix {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94A3B8;
          padding: 7px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          transition: all 0.15s ease;
        }
        .lp-input-suffix:hover {
          color: #2563EB;
          background: #EFF6FF;
        }

        .lp-mini-link {
          margin-top: -4px;
          margin-bottom: 14px;
          font-size: 13.5px;
          font-weight: 500;
          color: #2563EB;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
        }
        .lp-mini-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        /* Submit */
        .lp-submit {
          width: 100%;
          margin-top: 8px;
          padding: 13px 18px;
          border-radius: 12px;
          border: none;
          background: #2563EB;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px -3px rgba(37, 99, 235, 0.45);
        }
        .lp-submit:hover:not(:disabled) {
          background: #1D4ED8;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -4px rgba(37, 99, 235, 0.5);
        }
        .lp-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .lp-submit:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .lp-spin {
          animation: lpSpin 0.8s linear infinite;
        }
        @keyframes lpSpin {
          to { transform: rotate(360deg); }
        }

        /* Secondary buttons */
        .lp-secondary {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .lp-outline-btn {
          flex: 1;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #334155;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .lp-outline-btn:hover {
          border-color: #2563EB;
          color: #2563EB;
          background: #EFF6FF;
        }

        .lp-security-note {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
          font-size: 12.5px;
          color: #94A3B8;
        }

        .lp-demo {
          margin-top: 18px;
          border: 1px dashed #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12.5px;
          color: #94A3B8;
        }
        .lp-demo summary {
          cursor: pointer;
          font-weight: 600;
          color: #64748B;
        }
        .lp-demo-list {
          margin-top: 10px;
          display: grid;
          gap: 4px;
          font-family: 'SFMono-Regular', Menlo, monospace;
          font-size: 11.5px;
        }

        /* ===== Dark mode ===== */
        [data-theme="dark"] .lp-wrap {
          background: #0B1120;
        }
        [data-theme="dark"] .lp-grid {
          background: #151E32;
          box-shadow: 0 25px 60px -20px rgba(0, 0, 0, 0.5);
        }
        [data-theme="dark"] .lp-form-panel {
          background: #151E32;
        }
        [data-theme="dark"] .lp-title {
          color: #F1F5F9;
        }
        [data-theme="dark"] .lp-title-sub {
          color: #94A3B8;
        }
        [data-theme="dark"] .lp-role-label {
          color: #94A3B8;
        }
        [data-theme="dark"] .lp-role-btn {
          background: #0F172A;
          border-color: #1E293B;
          color: #94A3B8;
        }
        [data-theme="dark"] .lp-role-btn:hover {
          border-color: #3B82F6;
          color: #3B82F6;
          background: #1E293B;
        }
        [data-theme="dark"] .lp-role-btn.active {
          background: #3B82F6;
          border-color: #3B82F6;
          color: #fff;
          box-shadow: 0 6px 16px -4px rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .lp-label {
          color: #E2E8F0;
        }
        [data-theme="dark"] .lp-input {
          background: #0F172A;
          border-color: #1E293B;
          color: #F1F5F9;
        }
        [data-theme="dark"] .lp-input::placeholder {
          color: #64748B;
        }
        [data-theme="dark"] .lp-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.18);
        }
        [data-theme="dark"] .lp-input-suffix {
          color: #64748B;
        }
        [data-theme="dark"] .lp-input-suffix:hover {
          color: #3B82F6;
          background: #1E293B;
        }
        [data-theme="dark"] .lp-submit {
          background: #3B82F6;
          box-shadow: 0 4px 14px -3px rgba(59, 130, 246, 0.4);
        }
        [data-theme="dark"] .lp-submit:hover:not(:disabled) {
          background: #60A5FA;
        }
        [data-theme="dark"] .lp-outline-btn {
          background: #0F172A;
          border-color: #1E293B;
          color: #E2E8F0;
        }
        [data-theme="dark"] .lp-outline-btn:hover {
          border-color: #3B82F6;
          color: #3B82F6;
          background: #1E293B;
        }
        [data-theme="dark"] .lp-security-note {
          color: #64748B;
        }
        [data-theme="dark"] .lp-mini-link {
          color: #60A5FA;
        }
        [data-theme="dark"] .lp-demo {
          border-color: #1E293B;
          color: #64748B;
        }
        [data-theme="dark"] .lp-demo summary {
          color: #94A3B8;
        }
        [data-theme="dark"] .lp-theme-btn {
          background: #0F172A;
          border-color: #1E293B;
          color: #94A3B8;
        }
        [data-theme="dark"] .lp-theme-btn:hover {
          border-color: #3B82F6;
          color: #3B82F6;
          background: #1E293B;
        }
      `}</style>

      <div className="lp-grid">
        {/* Promo panel */}
        <div className="lp-promo">
          <div>
            <div className="lp-promo-top">
              <div className="lp-mark">S</div>
              <div className="lp-brand-name">{t("appName")}</div>
            </div>

            <div className="lp-promo-mid">
              <h1 className="lp-headline">
                {lang === "si"
                  ? "ඔබගේ සම්පූර්ණ අධ්‍යයන කාලසටහන එකම තැනක."
                  : "Your whole study schedule, in one place."}
              </h1>
              <p className="lp-sub">
                {lang === "si"
                  ? "ඔබගේ සතිය සැලසුම් කරගන්න, සියලු විෂයන් පාලනය කරන්න, සහ ප්‍රගතිය බලන්න."
                  : "Plan your week, keep every subject on track, and watch your streak grow — built for students, trusted by teachers and parents."}
              </p>
            </div>

            <div className="lp-illustration-wrap">
              <PlannerIllustration />
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="lp-form-panel">
          <div className="lp-mobile-brand">
            <BrandMark size={32} />
            <span style={{ fontWeight: 700, fontSize: 15.5 }}>{t("appName")}</span>
          </div>

          <div className="lp-form-head">
            <div>
              <div className="lp-title">{t("login")}</div>
              <p className="lp-title-sub">{txt.signInSubtitle}</p>
            </div>
            <div className="lp-head-actions">
              <button
                type="button"
                className="lp-theme-btn"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <LanguageSwitch />
            </div>
          </div>

          <div className="lp-role-label">
            {lang === "si" ? "මම පිවිසෙන්නේ" : "I'm signing in as"}
          </div>

          <div className="lp-roles" role="tablist" aria-label="Select account type">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = tab === r.key;
              return (
                <button
                  key={r.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={"lp-role-btn" + (active ? " active" : "")}
                  onClick={() => switchTab(r.key)}
                >
                  <Icon size={18} strokeWidth={2.1} />
                  {r.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit}>
            {/* Student + Teacher password */}
            {(tab === "STUDENT" || (tab === "TEACHER" && teacherMode === "password")) && (
              <>
                <div className="lp-field">
                  <label className="lp-label">{t("email")}</label>
                  <input
                    className="lp-input"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.lk"
                  />
                </div>

                <div className="lp-field">
                  <label className="lp-label">{t("password")}</label>
                  <div className="lp-input-wrap">
                    <input
                      className="lp-input"
                      style={{ paddingRight: 44 }}
                      type={showPw ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="lp-input-suffix"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {tab === "TEACHER" && (
                  <button
                    type="button"
                    className="lp-mini-link"
                    onClick={() => setTeacherMode("otp")}
                  >
                    <KeyRound size={14} />
                    {txt.teacherOtpLogin}
                  </button>
                )}
              </>
            )}

            {/* Teacher OTP */}
            {tab === "TEACHER" && teacherMode === "otp" && (
              <>
                <div className="lp-field">
                  <label className="lp-label">{t("email")}</label>
                  <input
                    className="lp-input"
                    type="email"
                    required
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="teacher@school.lk"
                  />
                </div>

                <div className="lp-field">
                  <label className="lp-label">{t("otp")}</label>
                  <input
                    className="lp-input"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                  />
                </div>

                <button
                  type="button"
                  className="lp-mini-link"
                  onClick={() => setTeacherMode("password")}
                >
                  <Lock size={14} />
                  {txt.teacherUsePw}
                </button>
              </>
            )}

            {/* Parent */}
            {tab === "PARENT" && (
              <>
                <div className="lp-field">
                  <label className="lp-label">{t("guardianName")}</label>
                  <input
                    className="lp-input"
                    required
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder={lang === "si" ? "භාරකරුගේ නම" : "Guardian full name"}
                  />
                </div>

                <div className="lp-field">
                  <label className="lp-label">{t("studentEmail")}</label>
                  <input
                    className="lp-input"
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="child@school.lk"
                  />
                </div>

                <div className="lp-field">
                  <label className="lp-label">{t("studentPassword")}</label>
                  <input
                    className="lp-input"
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <button className="lp-submit" type="submit" disabled={loading}>
              {loading && <Loader2 size={17} className="lp-spin" />}
              {loading ? txt.signingIn : t("submit")}
            </button>

            <div className="lp-secondary">
              <button type="button" className="lp-outline-btn" onClick={() => nav("/register")}>
                {t("register")}
              </button>
              <button type="button" className="lp-outline-btn" onClick={() => nav("/subscription")}>
                {t("subscription")}
              </button>
            </div>
          </form>

          <div className="lp-security-note">
            <LockKeyhole size={14} />
            {lang === "si"
              ? "ඔබගේ තොරතුරු ආරක්ෂිතයි."
              : "Your details are encrypted and never shared."}
          </div>

          {import.meta.env.DEV && (
            <details className="lp-demo">
              <summary>Demo credentials (dev only)</summary>
              <div className="lp-demo-list">
                <div>Admin: admin@timetable.lk / admin123</div>
                <div>Admin login URL: /admin-login</div>
                <div>Teacher OTP: teacher@timetable.lk / 481902</div>
                <div>Student: student@timetable.lk / student123</div>
                <div>Parent: guardian "Mala Perera" + student email + student password</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12 }}>{txt.adminHiddenNote}</div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}