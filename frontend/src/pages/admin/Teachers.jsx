import { useEffect, useMemo, useState } from "react";
import {
  UserPlus,
  School,
  Layers,
  Grid3x3,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  Search,
  Users,
  CloudOff,
  Eye,
  EyeOff,
  Copy,
  Pencil,
  Trash2,
} from "lucide-react";

import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Avatar, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

const EMPTY_TEACHER = { name: "", school: "", grade: "", className: "", email: "", otp: "" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Teachers() {
  const { t } = useI18n();
  const toast = useToast();

  const [teacherForm, setTeacherForm] = useState(EMPTY_TEACHER);
  const [errors, setErrors] = useState({});
  const [creating, setCreating] = useState(false);

  const [created, setCreated] = useState(null); // response of create teacher
  const [regeneratingId, setRegeneratingId] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(false);
  const [query, setQuery] = useState("");
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_TEACHER);

  // OTP visibility per teacherId
  const [otpVisible, setOtpVisible] = useState({}); // { [teacherId]: true/false }

  // School structure UI states
  const [schools, setSchools] = useState([]);
  const [schoolName, setSchoolName] = useState("");

  const [gradeName, setGradeName] = useState("");
  const [gradeSchoolId, setGradeSchoolId] = useState("");
  const [grades, setGrades] = useState([]);

  const [className, setClassName] = useState("");
  const [classGradeId, setClassGradeId] = useState("");
  const [classes, setClasses] = useState([]);

  async function loadSchools() {
    try {
      setSchools(await api.get("/api/admin/schools"));
    } catch {
      // ignore, UI will show errors on add actions
    }
  }

  async function loadGrades(schoolId) {
    if (!schoolId) {
      setGrades([]);
      return;
    }
    try {
      setGrades(await api.get(`/api/admin/grades?schoolId=${schoolId}`));
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
      setClasses(await api.get(`/api/admin/classes?gradeId=${gradeId}`));
    } catch {
      setClasses([]);
    }
  }

  async function loadTeachers() {
    setLoadingList(true);
    setListError(false);
    try {
      const list = await api.get("/api/admin/teachers");
      setTeachers(Array.isArray(list) ? list : []);
    } catch {
      setListError(true);
      setTeachers([]);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadSchools();
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTF(k, v) {
    setTeacherForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  }

  function validate() {
    const e = {};
    if (!teacherForm.name.trim()) e.name = "Name is required";
    if (!teacherForm.school.trim()) e.school = "School is required";
    if (!teacherForm.grade.trim()) e.grade = "Grade is required";
    if (!teacherForm.className.trim()) e.className = "Class is required";
    if (!teacherForm.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(teacherForm.email.trim())) e.email = "Enter a valid email";

    // otp is optional; if given must be 6 digits
    if (teacherForm.otp && !/^\d{6}$/.test(teacherForm.otp.trim())) {
      e.otp = "OTP must be 6 digits or leave blank";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function createTeacher() {
    if (!validate()) return;

    setCreating(true);
    try {
      const payload = {
        name: teacherForm.name.trim(),
        school: teacherForm.school.trim(),
        grade: teacherForm.grade.trim(),
        className: teacherForm.className.trim(),
        email: teacherForm.email.trim(),
        otp: teacherForm.otp.trim(),
      };
      if (!payload.otp) delete payload.otp;

      const d = await api.post("/api/admin/teachers", payload);
      setCreated(d);
      setTeacherForm(EMPTY_TEACHER);
      toast.show("Teacher created successfully", "success");

      await loadTeachers();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to create teacher", "error");
    } finally {
      setCreating(false);
    }
  }

  async function regenOtpForTeacher(teacherId) {
    setRegeneratingId(teacherId);
    try {
      const d = await api.post(`/api/admin/teachers/${teacherId}/regenerate-otp`, {});
      toast.show("OTP regenerated", "success");

      // update local list OTP + passwordSet
      setTeachers((prev) =>
        prev.map((x) =>
          x.teacherId === teacherId
            ? { ...x, otp: d.otp, passwordSet: false }
            : x
        )
      );

      // also update "created" card if same teacher
      setCreated((p) => (p?.teacherId === teacherId ? { ...p, otp: d.otp } : p));
    } catch (err) {
      toast.show(err?.data?.message || "Failed to regenerate OTP", "error");
    } finally {
      setRegeneratingId(null);
    }
  }

  function toggleOtp(teacherId) {
    setOtpVisible((p) => ({ ...p, [teacherId]: !p[teacherId] }));
  }
  function startEditTeacher(tt) {
    setEditingTeacher(tt.teacherId);
    setEditForm({ name: tt.name || "", school: tt.school || "", grade: tt.grade || "", className: tt.className || "", email: tt.email || "", otp: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveTeacherEdit() {
    try {
      await api.put(`/api/admin/teachers/${editingTeacher}`, {
        name: editForm.name, school: editForm.school, grade: editForm.grade,
        className: editForm.className, email: editForm.email
      });
      toast.show("Teacher updated", "success");
      setEditingTeacher(null);
      await loadTeachers();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to update teacher", "error");
    }
  }

  async function deleteTeacher(teacherId) {
    if (!window.confirm("Delete this teacher? This cannot be undone.")) return;
    try {
      await api.del(`/api/admin/teachers/${teacherId}`);
      toast.show("Teacher deleted", "success");
      await loadTeachers();
    } catch (err) {
      toast.show(err?.data?.message || "Delete failed. Check related records.", "error");
    }
  }

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value || "");
      toast.show(`${label} copied`, "success");
    } catch {
      toast.show("Copy failed", "error");
    }
  }

  const filteredTeachers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((x) =>
      `${x.name || ""} ${x.email || ""} ${x.school || ""}`.toLowerCase().includes(q)
    );
  }, [teachers, query]);

  return (
    <Layout title={t("teachers")} subtitle={`${teachers.length} teachers`}>
      <div className="stack" style={{ gap: 20 }}>
        {editingTeacher && (
          <div className="card">
            <div className="between">
              <div><div className="h2">Edit teacher</div><p className="subtitle">Update teacher account details.</p></div>
              <button className="btn btn-outline" onClick={() => setEditingTeacher(null)}>Cancel</button>
            </div>
            <div className="crudForm">
              {["name","email","school","grade","className"].map(k => (
                <div className="field" key={k}>
                  <label className="label">{k === "className" ? "Class" : k[0].toUpperCase()+k.slice(1)}</label>
                  <input className="input" value={editForm[k]} onChange={e=>setEditForm({...editForm,[k]:e.target.value})}/>
                </div>
              ))}
            </div>
            <button className="btn" onClick={saveTeacherEdit}>Save changes</button>
          </div>
        )}
        {/* Top row: Create teacher + School structure */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Create teacher */}
          <div className="card" style={{ flex: "1 1 380px" }}>
            <div className="center-v mb-1" style={{ gap: 8 }}>
              <UserPlus size={18} style={{ color: "var(--primary)" }} />
              <div className="h2" style={{ marginBottom: 0 }}>{t("createTeacher")}</div>
            </div>

            <p className="subtitle mb-3">
              Add a new teacher. System generates OTP + mapping code. Admin should share them privately.
            </p>

            <div className="field">
              <label className="label">{t("name")}</label>
              <input
                className={"input" + (errors.name ? " has-error" : "")}
                value={teacherForm.name}
                onChange={(e) => setTF("name", e.target.value)}
                placeholder="Full name"
              />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>

            <div className="field">
              <label className="label">{t("email")}</label>
              <input
                className={"input" + (errors.email ? " has-error" : "")}
                value={teacherForm.email}
                onChange={(e) => setTF("email", e.target.value)}
                placeholder="teacher@school.lk"
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>

            <div className="field">
              <label className="label">{t("school")}</label>
              <input
                className={"input" + (errors.school ? " has-error" : "")}
                value={teacherForm.school}
                onChange={(e) => setTF("school", e.target.value)}
              />
              {errors.school && <div className="field-error">{errors.school}</div>}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="field" style={{ flex: "1 1 160px" }}>
                <label className="label">{t("grade")}</label>
                <input
                  className={"input" + (errors.grade ? " has-error" : "")}
                  value={teacherForm.grade}
                  onChange={(e) => setTF("grade", e.target.value)}
                />
                {errors.grade && <div className="field-error">{errors.grade}</div>}
              </div>

              <div className="field" style={{ flex: "1 1 160px" }}>
                <label className="label">{t("className")}</label>
                <input
                  className={"input" + (errors.className ? " has-error" : "")}
                  value={teacherForm.className}
                  onChange={(e) => setTF("className", e.target.value)}
                />
                {errors.className && <div className="field-error">{errors.className}</div>}
              </div>
            </div>

            <div className="field">
              <label className="label">
                {t("otp")} <span className="faint">(optional — auto-generated if left blank)</span>
              </label>
              <input
                className={"input" + (errors.otp ? " has-error" : "")}
                value={teacherForm.otp}
                onChange={(e) => setTF("otp", e.target.value)}
                placeholder="Leave blank to auto-generate"
              />
              {errors.otp && <div className="field-error">{errors.otp}</div>}
            </div>

            <button className="btn btn-block" type="button" onClick={createTeacher} disabled={creating}>
              {creating ? "Creating…" : t("submit")}
            </button>

            {/* Created teacher card */}
            {created && (
              <div className="card mt-4" style={{ background: "var(--success-50)", border: "1px solid var(--success-100)" }}>
                <div className="center-v mb-2" style={{ gap: 8 }}>
                  <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                  <strong style={{ fontSize: 14 }}>Teacher created</strong>
                </div>

                <div className="field-hint mb-2">{t("mappingCodeNote")}</div>

                <div className="stack" style={{ gap: 6, fontSize: 13.5 }}>
                  <div className="between"><span className="muted">Teacher ID</span><strong>{created.teacherId}</strong></div>

                  <div className="between">
                    <span className="muted">{t("otp")}</span>
                    <strong className="center-v" style={{ gap: 8 }}>
                      <KeyRound size={13} /> {created.otp}
                      <button
                        className="btn btn-outline btn-sm"
                        type="button"
                        onClick={() => copyText("OTP", created.otp)}
                        style={{ marginLeft: 8 }}
                      >
                        <Copy size={13} /> Copy
                      </button>
                    </strong>
                  </div>

                  <div className="between">
                    <span className="muted">{t("mappingCode")}</span>
                    <strong className="center-v" style={{ gap: 8 }}>
                      {created.mappingCode}
                      <button
                        className="btn btn-outline btn-sm"
                        type="button"
                        onClick={() => copyText("Mapping code", created.mappingCode)}
                      >
                        <Copy size={13} /> Copy
                      </button>
                    </strong>
                  </div>

                  <div className="between"><span className="muted">{t("trialExpiryDate")}</span><strong>{created.trialExpDate}</strong></div>
                </div>

                <button
                  className="btn btn-outline btn-sm mt-3"
                  type="button"
                  onClick={() => regenOtpForTeacher(created.teacherId)}
                  disabled={regeneratingId === created.teacherId}
                >
                  <RefreshCw size={13} /> {regeneratingId === created.teacherId ? "Regenerating…" : t("regenerateOtp")}
                </button>
              </div>
            )}
          </div>

          {/* School structure */}
          <div className="card" style={{ flex: "1 1 340px" }}>
            <div className="h2">{t("schoolStructure")}</div>

            {/* Add School */}
            <div className="card card-flat" style={{ background: "var(--muted)", marginBottom: 12 }}>
              <div className="center-v mb-2" style={{ gap: 8 }}>
                <School size={15} style={{ color: "var(--primary)" }} />
                <strong style={{ fontSize: 13.5 }}>{t("addSchool")}</strong>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="input"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="School name"
                  style={{ flex: "1 1 200px" }}
                />
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={!schoolName.trim()}
                  onClick={async () => {
                    try {
                      await api.post("/api/admin/schools", { name: schoolName });
                      setSchoolName("");
                      toast.show("School added", "success");
                      await loadSchools();
                    } catch (err) {
                      toast.show(err?.data?.message || "Failed to add school", "error");
                    }
                  }}
                >
                  {t("save")}
                </button>
              </div>
            </div>

            {/* Add Grade */}
            <div className="card card-flat" style={{ background: "var(--muted)", marginBottom: 12 }}>
              <div className="center-v mb-2" style={{ gap: 8 }}>
                <Layers size={15} style={{ color: "var(--primary)" }} />
                <strong style={{ fontSize: 13.5 }}>{t("addGrade")}</strong>
              </div>

              <select
                className="select mb-2"
                value={gradeSchoolId}
                onChange={(e) => {
                  setGradeSchoolId(e.target.value);
                  loadGrades(e.target.value);
                }}
              >
                <option value="">Select {t("school")}</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="input"
                  value={gradeName}
                  onChange={(e) => setGradeName(e.target.value)}
                  placeholder={t("grade")}
                  style={{ flex: "1 1 200px" }}
                />
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={!gradeName.trim() || !gradeSchoolId}
                  onClick={async () => {
                    try {
                      await api.post("/api/admin/grades", { name: gradeName, schoolId: Number(gradeSchoolId) });
                      setGradeName("");
                      toast.show("Grade added", "success");
                      await loadGrades(gradeSchoolId);
                    } catch (err) {
                      toast.show(err?.data?.message || "Failed to add grade", "error");
                    }
                  }}
                >
                  {t("save")}
                </button>
              </div>
            </div>

            {/* Add Class */}
            <div className="card card-flat" style={{ background: "var(--muted)" }}>
              <div className="center-v mb-2" style={{ gap: 8 }}>
                <Grid3x3 size={15} style={{ color: "var(--primary)" }} />
                <strong style={{ fontSize: 13.5 }}>{t("addClass")}</strong>
              </div>

              <select
                className="select mb-2"
                value={classGradeId}
                onChange={(e) => {
                  setClassGradeId(e.target.value);
                  loadClasses(e.target.value);
                }}
              >
                <option value="">Select {t("grade")}</option>
                {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="input"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder={t("className")}
                  style={{ flex: "1 1 200px" }}
                />
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={!className.trim() || !classGradeId}
                  onClick={async () => {
                    try {
                      await api.post("/api/admin/classes", { name: className, gradeId: Number(classGradeId) });
                      setClassName("");
                      toast.show("Class added", "success");
                      await loadClasses(classGradeId);
                    } catch (err) {
                      toast.show(err?.data?.message || "Failed to add class", "error");
                    }
                  }}
                >
                  {t("save")}
                </button>
              </div>

              {classes.length > 0 && (
                <div className="center-v mt-2" style={{ gap: 6, flexWrap: "wrap" }}>
                  {classes.map((c) => <span key={c.id} className="badge">{c.name}</span>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teachers table */}
        <div className="card">
          <div className="between mb-3">
            <div className="center-v" style={{ gap: 8 }}>
              <Users size={17} style={{ color: "var(--primary)" }} />
              <div className="h2" style={{ marginBottom: 0 }}>All teachers</div>
            </div>

            <div className="input-wrap" style={{ maxWidth: 260 }}>
              <input
                className="input"
                style={{ paddingLeft: 34 }}
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-faint)"
                }}
              />
            </div>
          </div>

          {loadingList ? (
            <Skeleton height={120} radius={12} />
          ) : listError ? (
            <ErrorState icon={<CloudOff size={20} />} title={t("couldntLoad")} onRetry={loadTeachers} retryLabel={t("tryAgain")} />
          ) : filteredTeachers.length === 0 ? (
            <EmptyState icon={<Users size={20} />} title="No teachers yet" message="Teachers you create will appear here." />
          ) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>{t("school")}</th>
                    <th>{t("grade")} / {t("className")}</th>
                    <th>{t("otp")}</th>
                    <th>{t("mappingCode")}</th>
                    <th>{t("trialExpiryDate")}</th>
                    <th>Password</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((tt) => {
                    const showOtp = !!otpVisible[tt.teacherId];
                    const otpText = tt.otp || "";
                    const masked = otpText ? "••••••" : "";

                    return (
                      <tr key={tt.teacherId}>
                        <td>
                          <div className="center-v" style={{ gap: 8 }}>
                            <Avatar name={tt.name} size="sm" />
                            <div>
                              <div style={{ fontWeight: 600 }}>{tt.name}</div>
                              <div className="faint" style={{ fontSize: 11.5 }}>{tt.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>{tt.school || ""}</td>
                        <td>{(tt.grade || "") + " " + (tt.className || "")}</td>

                        <td>
                          <div className="center-v" style={{ gap: 8, flexWrap: "wrap" }}>
                            <span className="badge badge-primary" style={{ fontFamily: "monospace" }}>
                              {showOtp ? otpText : masked}
                            </span>
                            <button
                              className="btn btn-outline btn-sm"
                              type="button"
                              onClick={() => toggleOtp(tt.teacherId)}
                              disabled={!otpText}
                              title={showOtp ? "Hide OTP" : "Show OTP"}
                            >
                              {showOtp ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button
                              className="btn btn-outline btn-sm"
                              type="button"
                              onClick={() => copyText("OTP", otpText)}
                              disabled={!otpText}
                              title="Copy OTP"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="center-v" style={{ gap: 8, flexWrap: "wrap" }}>
                            <span className="badge badge-primary" style={{ fontFamily: "monospace" }}>
                              {tt.mappingCode || ""}
                            </span>
                            <button
                              className="btn btn-outline btn-sm"
                              type="button"
                              onClick={() => copyText("Mapping code", tt.mappingCode || "")}
                              disabled={!tt.mappingCode}
                              title="Copy mapping code"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>

                        <td>{tt.tierExpDate || tt.trialExpDate || ""}</td>

                        <td>
                          {/* Password can never be displayed (BCrypt hash only). Show status only. */}
                          {tt.passwordSet
                            ? <span className="badge badge-success">Set</span>
                            : <span className="badge badge-warning">Pending</span>}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className="center-v" style={{ justifyContent: "flex-end", flexWrap: "wrap" }}>
                            <button className="btn btn-outline btn-sm" type="button" onClick={() => startEditTeacher(tt)}><Pencil size={13}/> Edit</button>
                            <button className="btn btn-outline btn-sm" type="button" onClick={() => regenOtpForTeacher(tt.teacherId)} disabled={regeneratingId === tt.teacherId} title="Regenerate OTP"><RefreshCw size={14} /></button>
                            <button className="btn btn-danger btn-sm" type="button" onClick={() => deleteTeacher(tt.teacherId)}><Trash2 size={13}/> Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}