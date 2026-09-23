import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import { Button } from "../components/UI/index.jsx";
import {
  UserIcon,
  ShieldIcon,
  BookOpenIcon,
  SchoolIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClockIcon,
} from "../components/UI/Icons.jsx";

const ROLE_TABS = [
  { key: "STUDENT", label: "Student", icon: "🎓" },
  { key: "TEACHER_OTP", label: "Teacher OTP", icon: "🔑" },
  { key: "TEACHER_PW", label: "Teacher PW", icon: "👩‍🏫" },
  { key: "PARENT", label: "Parent", icon: "👨‍👩‍👧" },
  { key: "ADMIN", label: "Admin", icon: "🛡️" },
];

export default function Login() {
  const { t } = useI18n();
  const toast = useToast();
  const auth = useAuth();
  const nav = useNavigate();

  const [tab, setTab] = useState("STUDENT");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "STUDENT") {
        const data = await api.auth.studentLogin({ email, password });
        auth.setSession(data);
        toast.show("Welcome back! Let's make progress today.");
        nav("/student/dashboard");
      } else if (tab === "TEACHER_OTP") {
        const data = await api.auth.teacherLoginOtp({ email: otpEmail, otp });
        auth.setSession(data);
        toast.show("Teacher login verified");
        nav("/teacher/dashboard");
      } else if (tab === "TEACHER_PW") {
        const data = await api.auth.teacherLoginPassword({ email, password });
        auth.setSession(data);
        toast.show("Welcome back Teacher!");
        nav("/teacher/dashboard");
      } else if (tab === "PARENT") {
        const data = await api.auth.parentLogin({
          guardianName,
          studentEmail,
          studentPassword,
        });
        auth.setSession(data);
        toast.show("Welcome to Parent Companion Portal");
        nav("/parent/dashboard");
      } else if (tab === "ADMIN") {
        const data = await api.auth.adminLogin({ email, password });
        auth.setSession(data);
        toast.show("Admin access granted");
        nav("/admin/dashboard");
      }
    } catch (err) {
      const code = err?.data?.error;
      const msg = err?.data?.message || "Login failed, please check your credentials";
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

  function fillDemo(type) {
    if (type === "student") {
      setTab("STUDENT");
      setEmail("student@timetable.lk");
      setPassword("student123");
    } else if (type === "teacherOtp") {
      setTab("TEACHER_OTP");
      setOtpEmail("teacher@timetable.lk");
      setOtp("481902");
    } else if (type === "admin") {
      setTab("ADMIN");
      setEmail("admin@timetable.lk");
      setPassword("admin123");
    } else if (type === "parent") {
      setTab("PARENT");
      setGuardianName("Mala Perera");
      setStudentEmail("student@timetable.lk");
      setStudentPassword("student123");
    }
  }

  return (
    <div className="sams-auth-page">
      {/* Background ambient accents */}
      <div className="sams-auth-ambient-1" />
      <div className="sams-auth-ambient-2" />

      <div className="sams-auth-card-wrapper animate-fade-in">
        {/* LEFT COLUMN: Educational Branding & Motivation */}
        <div className="sams-auth-brand-pane">
          <div className="sams-auth-brand-top">
            <div className="sams-brand-cube">
              <span>S</span>
            </div>
            <div>
              <h2 className="sams-brand-wordmark">{t("appName")} 2.0</h2>
              <span className="sams-brand-submark">Timetable.lk Companion</span>
            </div>
          </div>

          <div className="sams-auth-hero-copy">
            <h1 className="sams-auth-hero-heading">
              Study Smarter.<br />
              <span className="sams-highlight-cyan">Track Progress.</span><br />
              Excel Together.
            </h1>
            <p className="sams-auth-hero-desc">
              The modern educational timetable companion for Sri Lankan school students, teachers, and parents.
            </p>
          </div>

          <div className="sams-auth-points-list">
            <div className="sams-auth-point">
              <div className="point-icon"><CheckCircleIcon size={16} /></div>
              <span>Daily focused study routine & momentum tracking</span>
            </div>
            <div className="sams-auth-point">
              <div className="point-icon"><CheckCircleIcon size={16} /></div>
              <span>Supportive teacher & parent star ratings</span>
            </div>
            <div className="sams-auth-point">
              <div className="point-icon"><CheckCircleIcon size={16} /></div>
              <span>Academic leaderboard & WhatsApp status cards</span>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="sams-demo-switch-box">
            <span className="sams-demo-title">Quick Demo Login:</span>
            <div className="sams-demo-buttons-row">
              <button type="button" onClick={() => fillDemo("student")} className="sams-demo-pill">
                Student
              </button>
              <button type="button" onClick={() => fillDemo("teacherOtp")} className="sams-demo-pill">
                Teacher OTP
              </button>
              <button type="button" onClick={() => fillDemo("parent")} className="sams-demo-pill">
                Parent
              </button>
              <button type="button" onClick={() => fillDemo("admin")} className="sams-demo-pill">
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern Form Panel */}
        <div className="sams-auth-form-pane">
          <div className="sams-form-top-toolbar">
            <div>
              <h2 className="sams-form-action-title">{t("login")}</h2>
              <p className="sams-form-action-sub">Choose your role to continue</p>
            </div>
            <LanguageSwitch />
          </div>

          {/* Role Segmented Buttons */}
          <div className="sams-role-pills-container">
            {ROLE_TABS.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`sams-role-tab ${tab === r.key ? "active" : ""}`}
                onClick={() => setTab(r.key)}
              >
                <span className="sams-role-icon">{r.icon}</span>
                <span className="sams-role-txt">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="sams-login-inputs-form">
            {/* Student, Teacher Password, Admin Inputs */}
            {(tab === "STUDENT" || tab === "TEACHER_PW" || tab === "ADMIN") && (
              <>
                <div className="sams-field">
                  <label className="sams-label">{t("email")}</label>
                  <input
                    type="email"
                    className="sams-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.lk"
                    required
                  />
                </div>

                <div className="sams-field">
                  <label className="sams-label">{t("password")}</label>
                  <input
                    type="password"
                    className="sams-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </>
            )}

            {/* Teacher OTP Inputs */}
            {tab === "TEACHER_OTP" && (
              <>
                <div className="sams-field">
                  <label className="sams-label">{t("email")}</label>
                  <input
                    type="email"
                    className="sams-input"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="teacher@school.lk"
                    required
                  />
                </div>

                <div className="sams-field">
                  <label className="sams-label">{t("otp")}</label>
                  <input
                    type="text"
                    className="sams-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit temporary OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </>
            )}

            {/* Parent Inputs */}
            {tab === "PARENT" && (
              <>
                <div className="sams-field">
                  <label className="sams-label">{t("guardianName")}</label>
                  <input
                    type="text"
                    className="sams-input"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                  />
                </div>

                <div className="sams-field">
                  <label className="sams-label">{t("studentEmail")}</label>
                  <input
                    type="email"
                    className="sams-input"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="child@school.lk"
                    required
                  />
                </div>

                <div className="sams-field">
                  <label className="sams-label">{t("studentPassword")}</label>
                  <input
                    type="password"
                    className="sams-input"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="Child's password"
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              iconRight={<ArrowRightIcon size={18} />}
              className="sams-login-btn-full"
            >
              {loading ? "Signing in..." : t("submit")}
            </Button>

            {/* Registration & Subscription Links */}
            <div className="sams-auth-footer-links">
              <span>New student?</span>
              <button
                type="button"
                className="sams-auth-link"
                onClick={() => nav("/register")}
              >
                Create an account
              </button>
              <span>·</span>
              <button
                type="button"
                className="sams-auth-link"
                onClick={() => nav("/subscription")}
              >
                Bank Subscription
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .sams-auth-page {
          min-height: 100vh;
          background: #061B36;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .sams-auth-ambient-1 {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(46, 134, 193, 0.25) 0%, transparent 70%);
          top: -150px;
          left: -100px;
          pointer-events: none;
        }

        .sams-auth-ambient-2 {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 198, 255, 0.18) 0%, transparent 70%);
          bottom: -200px;
          right: -150px;
          pointer-events: none;
        }

        .sams-auth-card-wrapper {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          max-width: 1020px;
          width: 100%;
          background: #FFFFFF;
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
          position: relative;
          z-index: 10;
        }

        /* Brand Pane */
        .sams-auth-brand-pane {
          background: linear-gradient(145deg, #071E3D 0%, #0B2E59 55%, #154360 100%);
          color: white;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }

        .sams-auth-brand-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sams-brand-cube {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
          color: white;
          font-weight: 900;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 198, 255, 0.4);
        }

        .sams-brand-wordmark {
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .sams-brand-submark {
          font-size: 12px;
          color: #BAE6FD;
          font-weight: 600;
        }

        .sams-auth-hero-heading {
          font-size: 30px;
          font-weight: 800;
          line-height: 1.25;
          margin: 28px 0 14px;
          letter-spacing: -0.02em;
        }

        .sams-highlight-cyan {
          color: #38BDF8;
        }

        .sams-auth-hero-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .sams-auth-points-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 28px;
        }

        .sams-auth-point {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.9);
        }

        .point-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.2);
          color: #38BDF8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Demo Switcher */
        .sams-demo-switch-box {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius-lg);
          padding: 12px 14px;
        }

        .sams-demo-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #BAE6FD;
          display: block;
          margin-bottom: 8px;
        }

        .sams-demo-buttons-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .sams-demo-pill {
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.06);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-demo-pill:hover {
          background: #38BDF8;
          color: #061B36;
          border-color: #38BDF8;
        }

        /* Form Pane */
        .sams-auth-form-pane {
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sams-form-top-toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .sams-form-action-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-form-action-sub {
          font-size: 13px;
          color: var(--text-secondary);
        }

        /* Role Pills */
        .sams-role-pills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 24px;
        }

        .sams-role-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-pill);
          border: 1.5px solid var(--border-subtle);
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-role-tab:hover {
          border-color: var(--accent);
          color: var(--primary);
        }

        .sams-role-tab.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(11, 46, 89, 0.25);
        }

        .sams-login-btn-full {
          width: 100%;
          margin-top: 10px;
        }

        .sams-auth-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 24px;
        }

        .sams-auth-link {
          background: transparent;
          border: none;
          color: var(--accent);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .sams-auth-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 860px) {
          .sams-auth-card-wrapper {
            grid-template-columns: 1fr;
          }
          .sams-auth-brand-pane {
            padding: 28px 24px;
          }
          .sams-auth-hero-heading {
            font-size: 24px;
            margin: 16px 0 8px;
          }
          .sams-auth-form-pane {
            padding: 28px 24px;
          }
        }
      `}</style>
    </div>
  );
}