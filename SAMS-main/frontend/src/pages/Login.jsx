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
} from "lucide-react";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import { useI18n } from "../i18n/i18n.jsx";

// Roles shown to normal users (Admin is hidden)
const ROLES = [
  { key: "STUDENT", label: "Student", icon: GraduationCap },
  { key: "TEACHER", label: "Teacher", icon: Lock },
  { key: "PARENT", label: "Parent", icon: Users },
];

// Original vector illustration (unchanged)
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
      <circle cx="360" cy="70" r="130" fill="#3B82F6" opacity="0.15" />
      <circle cx="60" cy="330" r="110" fill="#1D4ED8" opacity="0.18" />

      <rect x="44" y="64" width="320" height="260" rx="22" fill="#0B1F4B" opacity="0.25" />
      <rect x="40" y="58" width="320" height="260" rx="22" fill="#FFFFFF" />

      <rect x="40" y="58" width="320" height="52" rx="22" fill="#1D4ED8" />
      <circle cx="64" cy="84" r="5" fill="#93C5FD" />
      <rect x="80" y="79" width="90" height="10" rx="5" fill="rgba(255,255,255,0.85)" />
      <circle cx="330" cy="84" r="12" fill="rgba(255,255,255,0.15)" />
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
              fill="#0F2A5C"
            >
              {d}
            </text>
            <rect x={x} y={144} width={colWidth} height={150} rx="10" fill="#EFF4FE" />
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

      <circle cx="378" cy="150" r="30" fill="#0F2A5C" />
      <circle cx="378" cy="150" r="21" fill="#FFFFFF" />
      <line x1="378" y1="150" x2="378" y2="137" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />
      <line x1="378" y1="150" x2="387" y2="153" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" />

      <rect x="18" y="288" width="150" height="62" rx="16" fill="#FFFFFF" />
      <circle cx="50" cy="319" r="17" fill="#DBEAFE" />
      <path
        d="M50 308c5 5 8 9 8 14a8 8 0 1 1-16 0c0-2 1-4 2-6 1 3 3 4 4 3-1-3 0-7 2-11Z"
        fill="#1D4ED8"
      />
      <text x="76" y="315" fontFamily="Inter, sans-serif" fontSize="14" fontWeight="700" fill="#0F2A5C">
        12-day streak
      </text>
      <text x="76" y="331" fontFamily="Inter, sans-serif" fontSize="11" fill="#5B657A">
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

  const [tab, setTab] = useState("STUDENT");
  const [teacherMode, setTeacherMode] = useState("password"); // "password" | "otp"
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Shared email/password (used for STUDENT and TEACHER password)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Teacher OTP fields
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Parent fields
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
    // Teacher defaults to password login
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
      const msg = err?.data?.message || (lang === "si"
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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        .lp-wrap {
          min-height: 100vh;
          display: flex;
          align-items: stretch;
          justify-content: center;
          background: #EEF3FC;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 0;
        }
        .lp-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
          width: 100%;
          max-width: 1180px;
          margin: auto;
          min-height: 100vh;
          box-shadow: 0 30px 80px -30px rgba(15, 42, 92, 0.35);
          background: #FFFFFF;
        }
        @media (max-width: 900px) {
          .lp-grid { grid-template-columns: 1fr; }
          .lp-promo { display: none; }
        }

        .lp-promo {
          position: relative;
          background: linear-gradient(165deg, #14306B 0%, #0B1F4B 75%);
          color: #fff;
          padding: 44px 40px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        .lp-promo-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-mark {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #FFFFFF;
          color: #1D4ED8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-weight: 600;
          font-size: 17px;
        }
        .lp-brand-name { font-weight: 600; font-size: 15px; letter-spacing: 0.01em; }
        .lp-promo-mid { max-width: 380px; margin-top: 8px; }
        .lp-headline {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: 30px;
          line-height: 1.24;
          letter-spacing: -0.01em;
          margin: 20px 0 10px;
        }
        .lp-sub { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.72); max-width: 360px; }
        .lp-illustration-wrap { margin-top: 18px; }
        .lp-illustration { width: 100%; max-width: 390px; height: auto; display: block; }
        .lp-stats {
          display: flex;
          gap: 32px;
          margin-top: 22px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.14);
        }
        .lp-stat-num { font-family: 'Fraunces', serif; font-weight: 500; font-size: 21px; }
        .lp-stat-label { font-size: 12px; color: rgba(255,255,255,0.62); margin-top: 2px; }

        .lp-form-panel {
          padding: 44px 46px 36px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          animation: lpRise 0.5s ease both;
        }
        @keyframes lpRise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .lp-form-panel { animation: none; } }

        .lp-form-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
        .lp-title { font-family: 'Fraunces', serif; font-weight: 500; font-size: 24px; color: #0B1220; }
        .lp-title-sub { font-size: 13.5px; color: #5B657A; margin-top: 4px; }
        .lp-mobile-brand { display: none; align-items: center; gap: 9px; margin-bottom: 22px; }
        @media (max-width: 900px) { .lp-mobile-brand { display: flex; } }

        .lp-role-label { font-size: 12.5px; color: #5B657A; margin-bottom: 8px; }
        .lp-roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 24px; }
        @media (max-width: 420px) { .lp-roles { grid-template-columns: repeat(2, 1fr); } }
        .lp-role-btn {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 12px 6px; border-radius: 10px; border: 1.5px solid #DCE3F0;
          background: #FBFCFE; color: #5B657A; font-size: 12px; font-weight: 500;
          cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .lp-role-btn:hover { border-color: #93C5FD; color: #1D4ED8; }
        .lp-role-btn.active { border-color: #1D4ED8; background: #1D4ED8; color: #fff; }
        .lp-role-btn:focus-visible { outline: 2px solid #1D4ED8; outline-offset: 2px; }

        .lp-field { margin-bottom: 16px; }
        .lp-label { display: block; font-size: 13px; font-weight: 500; color: #344054; margin-bottom: 6px; }
        .lp-input-wrap { position: relative; }
        .lp-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 13px; border-radius: 9px; border: 1.5px solid #DCE3F0;
          background: #fff; font-size: 14.5px; font-family: inherit; color: #0B1220;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .lp-input::placeholder { color: #A2AABB; }
        .lp-input:focus { outline: none; border-color: #1D4ED8; box-shadow: 0 0 0 3px rgba(29,78,216,0.12); }
        .lp-input-suffix {
          position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #8A93A6; padding: 6px; border-radius: 6px;
          cursor: pointer; display: flex;
        }
        .lp-input-suffix:hover { color: #1D4ED8; background: #EFF4FE; }

        .lp-mini-link {
          margin-top: -6px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #1D4ED8;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
          cursor: pointer;
        }
        .lp-mini-link:hover { text-decoration: underline; }

        .lp-submit {
          width: 100%; margin-top: 6px; padding: 12px 16px; border-radius: 9px; border: none;
          background: #1D4ED8; color: #fff; font-size: 14.5px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .lp-submit:hover:not(:disabled) { background: #1741B8; }
        .lp-submit:active:not(:disabled) { transform: translateY(1px); }
        .lp-submit:disabled { opacity: 0.7; cursor: default; }
        .lp-spin { animation: lpSpin 0.8s linear infinite; }
        @keyframes lpSpin { to { transform: rotate(360deg); } }

        .lp-secondary { display: flex; gap: 10px; margin-top: 12px; }
        .lp-outline-btn {
          flex: 1; padding: 10px 12px; border-radius: 9px; border: 1.5px solid #DCE3F0;
          background: #fff; color: #344054; font-size: 13.5px; font-weight: 500;
          cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease;
        }
        .lp-outline-btn:hover { border-color: #1D4ED8; color: #1D4ED8; }

        .lp-security-note { display: flex; align-items: center; gap: 7px; margin-top: 22px; font-size: 12px; color: #8A93A6; }

        .lp-demo {
          margin-top: 18px;
          border: 1px dashed #DCE3F0;
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 12px;
          color: #8A93A6;
        }
        .lp-demo summary { cursor: pointer; font-weight: 600; color: #5B657A; }
        .lp-demo-list { margin-top: 8px; display: grid; gap: 3px; font-family: 'SFMono-Regular', Menlo, monospace; font-size: 11.5px; }
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
                {lang === "si" ? "ඔබගේ සම්පූර්ණ අධ්‍යයන කාලසටහන එකම තැනක." : "Your whole study schedule, in one place."}
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

          <div className="lp-stats">
            <div>
              <div className="lp-stat-num">3</div>
              <div className="lp-stat-label">{lang === "si" ? "භූමිකා" : "Roles"}</div>
            </div>
            <div>
              <div className="lp-stat-num">EN · සිං</div>
              <div className="lp-stat-label">{lang === "si" ? "භාෂා 2" : "Bilingual interface"}</div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="lp-form-panel">
          <div className="lp-form-head">
            <div>
              <div className="lp-title">{t("login")}</div>
              <p className="lp-title-sub">{txt.signInSubtitle}</p>
            </div>
            <LanguageSwitch />
          </div>

          <div className="lp-role-label">{lang === "si" ? "මම පිවිසෙන්නේ" : "I'm signing in as"}</div>

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
                  <Icon size={17} />
                  {r.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit}>
            {/* Student login + Teacher password login share the same fields */}
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
                      style={{ paddingRight: 40 }}
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

                {/* Teacher only: show OTP toggle */}
                {tab === "TEACHER" && (
                  <button
                    type="button"
                    className="lp-mini-link"
                    onClick={() => setTeacherMode("otp")}
                  >
                    <KeyRound size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                    {txt.teacherOtpLogin}
                  </button>
                )}
              </>
            )}

            {/* Teacher OTP login */}
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
                  <Lock size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                  {txt.teacherUsePw}
                </button>
              </>
            )}

            {/* Parent login */}
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
              {loading && <Loader2 size={16} className="lp-spin" />}
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
            <LockKeyhole size={13} />
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
              <div style={{ marginTop: 8, fontSize: 12 }}>
                {txt.adminHiddenNote}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}