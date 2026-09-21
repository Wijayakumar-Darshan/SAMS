import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, School, GraduationCap, Users, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react";
import LanguageSwitch from "../components/LanguageSwitch.jsx";
import { api } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useI18n } from "../i18n/i18n.jsx";

const EMPTY = { name: "", email: "", password: "", guardianName: "", school: "", grade: "", className: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = t("name") + " is required";
    if (!form.email.trim()) e.email = t("email") + " is required";
    else if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = t("password") + " is required";
    else if (form.password.length < 6) e.password = "Use at least 6 characters";
    if (!form.guardianName.trim()) e.guardianName = t("guardianName") + " is required";
    if (!form.school.trim()) e.school = t("school") + " is required";
    if (!form.grade.trim()) e.grade = t("grade") + " is required";
    if (!form.className.trim()) e.className = t("className") + " is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.auth.studentRegister(form);
      setDone(true);
      toast.show("Account created", "success");
    } catch (err) {
      toast.show(err?.data?.message || "Registration failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="authWrap">
        <div className="card authCard" style={{ textAlign: "center" }}>
          <div className="icon-wrap" style={{ margin: "0 auto 14px", background: "var(--success-50)", color: "var(--success)", width: 64, height: 64 }}>
            <CheckCircle2 size={30} />
          </div>
          <div className="h1">You're all set!</div>
          <p className="subtitle mb-4">Your SAMS account has been created. Sign in to start tracking your study time.</p>
          <button className="btn btn-lg btn-block" type="button" onClick={() => nav("/login")}>
            {t("login")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="authWrap">
      <div className="card authCard" style={{ maxWidth: 520 }}>
        <div className="between mb-3">
          <div>
            <div className="chip chip-primary mb-2">
              <Sparkles size={12} /> Free trial included
            </div>
            <div className="h1" style={{ fontSize: 22 }}>{t("register")}</div>
            <p className="subtitle">A few quick details and you're ready to go.</p>
          </div>
          <LanguageSwitch />
        </div>

        <form onSubmit={submit} noValidate>
          <div className="nav-section-label" style={{ padding: "0 0 6px" }}>Personal information</div>
          <div className="field">
            <label className="label"><User size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{t("name")}</label>
            <input className={"input" + (errors.name ? " has-error" : "")} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="row">
            <div className="col field">
              <label className="label"><Mail size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{t("email")}</label>
              <input className={"input" + (errors.email ? " has-error" : "")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@school.lk" />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            <div className="col field">
              <label className="label"><Lock size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{t("password")}</label>
              <div className="input-wrap">
                <input
                  className={"input" + (errors.password ? " has-error" : "")}
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="At least 6 characters"
                />
                <button type="button" className="input-suffix-btn" onClick={() => setShowPw((v) => !v)} aria-label="Toggle password visibility">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
          </div>

          <div className="nav-section-label" style={{ padding: "8px 0 6px" }}>School information</div>
          <div className="field">
            <label className="label"><School size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{t("school")}</label>
            <input className={"input" + (errors.school ? " has-error" : "")} value={form.school} onChange={(e) => set("school", e.target.value)} placeholder="Your school's name" />
            {errors.school && <div className="field-error">{errors.school}</div>}
          </div>
          <div className="row">
            <div className="col field">
              <label className="label"><GraduationCap size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{t("grade")}</label>
              <input className={"input" + (errors.grade ? " has-error" : "")} value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. Grade 10" />
              {errors.grade && <div className="field-error">{errors.grade}</div>}
            </div>
            <div className="col field">
              <label className="label">{t("className")}</label>
              <input className={"input" + (errors.className ? " has-error" : "")} value={form.className} onChange={(e) => set("className", e.target.value)} placeholder="e.g. A" />
              {errors.className && <div className="field-error">{errors.className}</div>}
            </div>
          </div>

          <div className="nav-section-label" style={{ padding: "8px 0 6px" }}>Guardian information</div>
          <div className="field">
            <label className="label"><Users size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{t("guardianName")}</label>
            <input className={"input" + (errors.guardianName ? " has-error" : "")} value={form.guardianName} onChange={(e) => set("guardianName", e.target.value)} placeholder="Parent / guardian full name" />
            {errors.guardianName && <div className="field-error">{errors.guardianName}</div>}
            <div className="field-hint">Your guardian will use this name, along with your email and password, to view your progress.</div>
          </div>

          <button className="btn btn-lg btn-block mt-3" type="submit" disabled={loading}>
            {loading ? "Creating account…" : t("submit")}
          </button>
          <button type="button" className="btn btn-outline btn-block mt-2" onClick={() => nav("/login")}>
            {t("login")}
          </button>
        </form>
      </div>
    </div>
  );
}
