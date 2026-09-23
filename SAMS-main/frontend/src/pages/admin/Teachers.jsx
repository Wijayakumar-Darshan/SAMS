import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button, Badge } from "../../components/UI/index.jsx";
import {
  UsersIcon,
  SchoolIcon,
  CheckCircleIcon,
  CopyIcon,
  RefreshCwIcon,
  PlusIcon,
  ShieldIcon,
} from "../../components/UI/Icons.jsx";

export default function AdminTeachers() {
  const { t } = useI18n();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("create"); // "create" | "school"

  // Teacher creation form
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    school: "",
    grade: "",
    className: "",
    email: "",
    otp: "",
  });
  const [created, setCreated] = useState(null);
  const [creating, setCreating] = useState(false);

  // School structure
  const [schools, setSchools] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [gradeName, setGradeName] = useState("");
  const [gradeSchoolId, setGradeSchoolId] = useState("");
  const [className, setClassName] = useState("");
  const [classGradeId, setClassGradeId] = useState("");
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);

  async function loadSchools() {
    try {
      const s = await api.get("/api/admin/schools");
      setSchools(Array.isArray(s) ? s : []);
    } catch {
      // ignore
    }
  }

  async function loadGrades(schoolId) {
    if (!schoolId) {
      setGrades([]);
      return;
    }
    try {
      const g = await api.get(`/api/admin/grades?schoolId=${schoolId}`);
      setGrades(Array.isArray(g) ? g : []);
    } catch {
      setGrades([]);
    }
  }

  async function loadClasses(gradeId) {
    if (!gradeId) {
      setClasses([]);
      return;
    }
    try {
      const c = await api.get(`/api/admin/classes?gradeId=${gradeId}`);
      setClasses(Array.isArray(c) ? c : []);
    } catch {
      setClasses([]);
    }
  }

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line
  }, []);

  function setTF(k, v) {
    setTeacherForm((p) => ({ ...p, [k]: v }));
  }

  async function handleCreateTeacher(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...teacherForm };
      if (!payload.otp) delete payload.otp;
      const d = await api.post("/api/admin/teachers", payload);
      setCreated(d);
      toast.show("Teacher registered successfully!");
      setTeacherForm({
        name: "",
        school: "",
        grade: "",
        className: "",
        email: "",
        otp: "",
      });
    } catch (err) {
      toast.show(err?.data?.message || "Failed to create teacher", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRegenOtp() {
    if (!created?.teacherId) return;
    try {
      const d = await api.post(
        `/api/admin/teachers/${created.teacherId}/regenerate-otp`,
        {}
      );
      setCreated((p) => ({ ...p, otp: d.otp }));
      toast.show("OTP regenerated successfully");
    } catch (err) {
      toast.show(err?.data?.message || "Failed to regenerate OTP", "error");
    }
  }

  function copyToClipboard(text, label = "Item") {
    navigator.clipboard.writeText(text);
    toast.show(`${label} copied to clipboard!`);
  }

  // School structure handlers
  async function handleAddSchool(e) {
    e.preventDefault();
    if (!schoolName.trim()) return;
    try {
      await api.post("/api/admin/schools", { name: schoolName.trim() });
      toast.show("School added successfully");
      setSchoolName("");
      await loadSchools();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to add school", "error");
    }
  }

  async function handleAddGrade(e) {
    e.preventDefault();
    if (!gradeName.trim() || !gradeSchoolId) return;
    try {
      await api.post("/api/admin/grades", {
        name: gradeName.trim(),
        schoolId: Number(gradeSchoolId),
      });
      toast.show("Grade added successfully");
      setGradeName("");
      await loadGrades(gradeSchoolId);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to add grade", "error");
    }
  }

  async function handleAddClass(e) {
    e.preventDefault();
    if (!className.trim() || !classGradeId) return;
    try {
      await api.post("/api/admin/classes", {
        name: className.trim(),
        gradeId: Number(classGradeId),
      });
      toast.show("Class added successfully");
      setClassName("");
      await loadClasses(classGradeId);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to add class", "error");
    }
  }

  return (
    <Layout
      title={t("teachers")}
      subtitle="Register teacher accounts, manage temporary OTPs, and configure school structure"
    >
      <div className="sams-admin-teachers-container">
        {/* Navigation Tabs */}
        <div className="sams-tab-pills">
          <button
            type="button"
            className={`sams-tab-pill ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <UsersIcon size={16} />
            <span>Create Teacher Account</span>
          </button>
          <button
            type="button"
            className={`sams-tab-pill ${activeTab === "school" ? "active" : ""}`}
            onClick={() => setActiveTab("school")}
          >
            <SchoolIcon size={16} />
            <span>School Structure Setup</span>
          </button>
        </div>

        {activeTab === "create" ? (
          <div className="sams-create-teacher-layout">
            {/* Form Card */}
            <Card className="sams-create-teacher-card">
              <div className="sams-admin-sec-header">
                <div className="sams-admin-badge-icon">
                  <UsersIcon size={20} color="var(--primary)" />
                </div>
                <div>
                  <h2 className="sams-admin-sec-title">{t("createTeacher")}</h2>
                  <p className="sams-admin-sec-desc">
                    Enter the teacher’s professional information to generate an account
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateTeacher} className="sams-teacher-form">
                <div className="sams-form-grid-2">
                  <div className="sams-field">
                    <label className="sams-label">{t("name")}</label>
                    <input
                      type="text"
                      className="sams-input"
                      value={teacherForm.name}
                      onChange={(e) => setTF("name", e.target.value)}
                      placeholder="e.g. Mrs. Mala Perera"
                      required
                    />
                  </div>

                  <div className="sams-field">
                    <label className="sams-label">{t("email")}</label>
                    <input
                      type="email"
                      className="sams-input"
                      value={teacherForm.email}
                      onChange={(e) => setTF("email", e.target.value)}
                      placeholder="teacher@school.lk"
                      required
                    />
                  </div>
                </div>

                <div className="sams-form-grid-3">
                  <div className="sams-field">
                    <label className="sams-label">{t("school")}</label>
                    <input
                      type="text"
                      className="sams-input"
                      value={teacherForm.school}
                      onChange={(e) => setTF("school", e.target.value)}
                      placeholder="School Name"
                      required
                    />
                  </div>

                  <div className="sams-field">
                    <label className="sams-label">{t("grade")}</label>
                    <input
                      type="text"
                      className="sams-input"
                      value={teacherForm.grade}
                      onChange={(e) => setTF("grade", e.target.value)}
                      placeholder="e.g. Grade 10"
                      required
                    />
                  </div>

                  <div className="sams-field">
                    <label className="sams-label">{t("className")}</label>
                    <input
                      type="text"
                      className="sams-input"
                      value={teacherForm.className}
                      onChange={(e) => setTF("className", e.target.value)}
                      placeholder="e.g. 10-A"
                      required
                    />
                  </div>
                </div>

                <div className="sams-field">
                  <label className="sams-label">
                    <span>Optional Custom OTP</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Leave empty to auto-generate</span>
                  </label>
                  <input
                    type="text"
                    className="sams-input"
                    value={teacherForm.otp}
                    onChange={(e) => setTF("otp", e.target.value)}
                    placeholder="6-digit custom OTP (optional)"
                    maxLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={creating}
                  icon={<PlusIcon size={18} />}
                  className="sams-btn-submit"
                >
                  Create Teacher Account
                </Button>
              </form>
            </Card>

            {/* Created Account Feedback & OTP Showcase (Prompt Requirement 26) */}
            {created && (
              <Card className="sams-otp-feedback-card animate-scale-in">
                <div className="sams-otp-head">
                  <div className="sams-success-check-badge">
                    <CheckCircleIcon size={24} color="#16A34A" />
                  </div>
                  <div>
                    <h3 className="sams-otp-title">{t("teacherAccountCreated")}</h3>
                    <p className="sams-otp-sub">{t("mappingCodeNote")}</p>
                  </div>
                </div>

                {/* OTP Box */}
                <div className="sams-otp-showcase">
                  <span className="sams-otp-label">{t("temporaryOtp")}</span>
                  <div className="sams-otp-dots-row">
                    <span className="sams-otp-value">{created.otp}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<CopyIcon size={14} />}
                      onClick={() => copyToClipboard(created.otp, "OTP")}
                    >
                      {t("copyOtp")}
                    </Button>
                  </div>
                </div>

                {/* Mapping Code Box */}
                <div className="sams-mapping-code-box">
                  <span className="sams-otp-label">{t("mappingCode")}</span>
                  <div className="sams-otp-dots-row">
                    <span className="sams-code-val">{created.mappingCode}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<CopyIcon size={14} />}
                      onClick={() => copyToClipboard(created.mappingCode, "Teacher Code")}
                    >
                      {t("copy")}
                    </Button>
                  </div>
                </div>

                <div className="sams-otp-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RefreshCwIcon size={14} />}
                    onClick={handleRegenOtp}
                  >
                    {t("regenerateOtp")}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* School Structure Builder */
          <div className="sams-school-structure-grid">
            {/* 1. Add School */}
            <Card className="sams-structure-card">
              <h3 className="sams-structure-title">1. {t("addSchool")}</h3>
              <form onSubmit={handleAddSchool} className="sams-structure-form">
                <input
                  type="text"
                  className="sams-input"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="School name (e.g. Royal College)"
                  required
                />
                <Button type="submit" variant="primary" size="md" icon={<PlusIcon size={15} />}>
                  {t("addSchool")}
                </Button>
              </form>

              <div className="sams-structure-chips-list">
                {schools.map((sc) => (
                  <Badge key={sc.id} variant="neutral" size="md">
                    {sc.name}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* 2. Add Grade */}
            <Card className="sams-structure-card">
              <h3 className="sams-structure-title">2. {t("addGrade")}</h3>
              <form onSubmit={handleAddGrade} className="sams-structure-form">
                <select
                  className="sams-select"
                  value={gradeSchoolId}
                  onChange={(e) => {
                    setGradeSchoolId(e.target.value);
                    loadGrades(e.target.value);
                  }}
                  required
                >
                  <option value="">Select School</option>
                  {schools.map((sc) => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  className="sams-input"
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  placeholder="Grade name (e.g. Grade 11)"
                  required
                />
                <Button type="submit" variant="primary" size="md" icon={<PlusIcon size={15} />}>
                  {t("addGrade")}
                </Button>
              </form>

              <div className="sams-structure-chips-list">
                {grades.map((gr) => (
                  <Badge key={gr.id} variant="purple" size="md">
                    {gr.name}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* 3. Add Class */}
            <Card className="sams-structure-card">
              <h3 className="sams-structure-title">3. {t("addClass")}</h3>
              <form onSubmit={handleAddClass} className="sams-structure-form">
                <select
                  className="sams-select"
                  value={classGradeId}
                  onChange={(e) => {
                    setClassGradeId(e.target.value);
                    loadClasses(e.target.value);
                  }}
                  required
                >
                  <option value="">Select Grade</option>
                  {grades.map((gr) => (
                    <option key={gr.id} value={gr.id}>{gr.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  className="sams-input"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Class name (e.g. 11-B)"
                  required
                />
                <Button type="submit" variant="primary" size="md" icon={<PlusIcon size={15} />}>
                  {t("addClass")}
                </Button>
              </form>

              <div className="sams-structure-chips-list">
                {classes.map((cl) => (
                  <Badge key={cl.id} variant="info" size="md">
                    {cl.name}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      <style>{`
        .sams-admin-teachers-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .sams-tab-pills {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }

        .sams-tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-pill);
          border: 1.5px solid var(--border-subtle);
          background: #FFFFFF;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-tab-pill.active {
          background: var(--primary);
          color: #FFFFFF;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(11, 46, 89, 0.2);
        }

        /* Create Layout */
        .sams-create-teacher-layout {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        .sams-create-teacher-card {
          padding: 28px;
        }

        .sams-admin-sec-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }

        .sams-admin-badge-icon {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-md);
          background: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-admin-sec-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-admin-sec-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .sams-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .sams-form-grid-3 {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr;
          gap: 14px;
        }

        .sams-btn-submit {
          width: 100%;
          margin-top: 8px;
        }

        /* OTP Feedback Card */
        .sams-otp-feedback-card {
          padding: 28px;
          background: #FFFFFF;
          border: 1.5px solid #86EFAC;
          box-shadow: 0 10px 25px -5px rgba(22, 163, 74, 0.15);
        }

        .sams-otp-head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 20px;
        }

        .sams-success-check-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #DCFCE7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-otp-title {
          font-size: 17px;
          font-weight: 800;
          color: #166534;
        }

        .sams-otp-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-otp-showcase, .sams-mapping-code-box {
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 14px;
          margin-bottom: 14px;
        }

        .sams-otp-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 6px;
        }

        .sams-otp-dots-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sams-otp-value {
          font-family: var(--font-mono);
          font-size: 26px;
          font-weight: 900;
          color: var(--primary);
          letter-spacing: 4px;
        }

        .sams-code-val {
          font-family: var(--font-mono);
          font-size: 22px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 2px;
        }

        .sams-otp-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 10px;
        }

        /* School Structure Grid */
        .sams-school-structure-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .sams-structure-card {
          padding: 22px;
        }

        .sams-structure-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 16px;
        }

        .sams-structure-form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .sams-structure-chips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        @media (max-width: 900px) {
          .sams-create-teacher-layout {
            grid-template-columns: 1fr;
          }
          .sams-school-structure-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}