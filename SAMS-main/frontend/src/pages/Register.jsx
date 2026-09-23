import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import { api } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import { Button } from "../components/UI/index.jsx";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  BookOpenIcon,
  SchoolIcon,
} from "../components/UI/Icons.jsx";

export default function Register() {
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    guardianName: "",
    school: "",
    grade: "",
    className: "",
  });

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.studentRegister(form);
      toast.show("🎉 Welcome to SAMS! Account created successfully.");
      nav("/login");
    } catch (err) {
      toast.show(err?.data?.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sams-register-page">
      <div className="sams-auth-ambient-1" />
      <div className="sams-auth-ambient-2" />

      <div className="sams-register-card-wrapper animate-fade-in">
        {/* LEFT COLUMN: Inspiration & Features */}
        <div className="sams-register-brand-pane">
          <div className="sams-auth-brand-top">
            <div className="sams-brand-cube">
              <span>S</span>
            </div>
            <div>
              <h2 className="sams-brand-wordmark">{t("appName")} 2.0</h2>
              <span className="sams-brand-submark">Student Registration</span>
            </div>
          </div>

          <div className="sams-register-hero-copy">
            <h1 className="sams-register-heading">
              Start Your Journey to<br />
              <span className="sams-highlight-cyan">Academic Excellence</span>
            </h1>
            <p className="sams-register-desc">
              Join thousands of Sri Lankan students taking charge of their study habits, tracking daily progress, and excelling in exams.
            </p>
          </div>

          <div className="sams-register-perks">
            <div className="sams-perk-item">
              <div className="sams-perk-icon">🎯</div>
              <div>
                <strong>Free Initial Trial</strong>
                <p>Full access to study logs, rankings, and analytics</p>
              </div>
            </div>
            <div className="sams-perk-item">
              <div className="sams-perk-icon">📊</div>
              <div>
                <strong>Automated Weekly Reports</strong>
                <p>Track your subject balance and daily hours</p>
              </div>
            </div>
            <div className="sams-perk-item">
              <div className="sams-perk-icon">🤝</div>
              <div>
                <strong>School Teacher Mapping</strong>
                <p>Connect with your classroom teacher via QR code</p>
              </div>
            </div>
          </div>

          <div className="sams-brand-pill-note">
            <SparklesIcon size={14} color="#38BDF8" />
            <span>Sinhala & English bilingual support included</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Registration Form */}
        <div className="sams-register-form-pane">
          <div className="sams-register-toolbar">
            <div>
              <h2 className="sams-register-form-title">{t("register")}</h2>
              <p className="sams-register-form-sub">Create your personal student account</p>
            </div>
            <LanguageSwitch />
          </div>

          <form onSubmit={handleSubmit} className="sams-register-form-fields">
            {/* Student Name */}
            <div className="sams-field">
              <label className="sams-label">{t("name")}</label>
              <input
                type="text"
                className="sams-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your Full Name (e.g. Kasun Fernando)"
                required
              />
            </div>

            {/* Email & Password */}
            <div className="sams-form-row-2">
              <div className="sams-field">
                <label className="sams-label">{t("email")}</label>
                <input
                  type="email"
                  className="sams-input"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@school.lk"
                  required
                />
              </div>

              <div className="sams-field">
                <label className="sams-label">{t("password")}</label>
                <input
                  type="password"
                  className="sams-input"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>
            </div>

            {/* Guardian Name */}
            <div className="sams-field">
              <label className="sams-label">{t("guardianName")}</label>
              <input
                type="text"
                className="sams-input"
                value={form.guardianName}
                onChange={(e) => set("guardianName", e.target.value)}
                placeholder="Parent or Guardian's Full Name"
                required
              />
            </div>

            {/* School, Grade, Class */}
            <div className="sams-form-row-3">
              <div className="sams-field" style={{ flex: 1.5 }}>
                <label className="sams-label">{t("school")}</label>
                <input
                  type="text"
                  className="sams-input"
                  value={form.school}
                  onChange={(e) => set("school", e.target.value)}
                  placeholder="School Name"
                  required
                />
              </div>

              <div className="sams-field" style={{ flex: 1 }}>
                <label className="sams-label">{t("grade")}</label>
                <input
                  type="text"
                  className="sams-input"
                  value={form.grade}
                  onChange={(e) => set("grade", e.target.value)}
                  placeholder="e.g. Grade 10"
                  required
                />
              </div>

              <div className="sams-field" style={{ flex: 1 }}>
                <label className="sams-label">{t("className")}</label>
                <input
                  type="text"
                  className="sams-input"
                  value={form.className}
                  onChange={(e) => set("className", e.target.value)}
                  placeholder="e.g. 10-A"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              iconRight={<ArrowRightIcon size={18} />}
              className="sams-reg-submit-btn"
            >
              {loading ? "Creating Account..." : "Complete Registration"}
            </Button>

            <div className="sams-reg-footer">
              <span>Already have an account?</span>
              <button
                type="button"
                className="sams-link-button"
                onClick={() => nav("/login")}
              >
                Sign in here
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .sams-register-page {
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

        .sams-register-card-wrapper {
          display: grid;
          grid-template-columns: 1.15fr 1.35fr;
          max-width: 1080px;
          width: 100%;
          background: #FFFFFF;
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
          position: relative;
          z-index: 10;
        }

        /* Brand Pane */
        .sams-register-brand-pane {
          background: linear-gradient(145deg, #071E3D 0%, #0B2E59 55%, #154360 100%);
          color: white;
          padding: 44px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
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

        .sams-register-heading {
          font-size: 28px;
          font-weight: 800;
          line-height: 1.25;
          margin: 24px 0 12px;
          letter-spacing: -0.02em;
        }

        .sams-highlight-cyan {
          color: #38BDF8;
        }

        .sams-register-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .sams-register-perks {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }

        .sams-perk-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .sams-perk-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .sams-perk-item strong {
          display: block;
          font-size: 13px;
          color: white;
        }

        .sams-perk-item p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .sams-brand-pill-note {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 8px 14px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          color: #BAE6FD;
          font-weight: 600;
        }

        /* Form Pane */
        .sams-register-form-pane {
          padding: 40px 36px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sams-register-toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .sams-register-form-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-register-form-sub {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .sams-form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .sams-form-row-3 {
          display: flex;
          gap: 12px;
        }

        .sams-reg-submit-btn {
          width: 100%;
          margin-top: 10px;
        }

        .sams-reg-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 20px;
        }

        .sams-link-button {
          background: transparent;
          border: none;
          color: var(--accent);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .sams-link-button:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .sams-register-card-wrapper {
            grid-template-columns: 1fr;
          }
          .sams-register-brand-pane {
            padding: 28px 24px;
          }
          .sams-register-form-pane {
            padding: 28px 24px;
          }
          .sams-form-row-2 {
            grid-template-columns: 1fr;
          }
          .sams-form-row-3 {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}