import { useEffect, useMemo, useState } from "react";
import { UserPlus, School, Layers, Grid3x3, CheckCircle2, RefreshCw, KeyRound, Search, Users, CloudOff } from "lucide-react";
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
  const [created, setCreated] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const [teachers, setTeachers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(false);
  const [query, setQuery] = useState("");

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
      setSchools(await api.get("/api/admin/schools"));
    } catch {
      /* handled elsewhere */
    }
  }

  async function loadGrades(schoolId) {
    if (!schoolId) return setGrades([]);
    try {
      setGrades(await api.get(`/api/admin/grades?schoolId=${schoolId}`));
    } catch {
      /* handled elsewhere */
    }
  }

  async function loadClasses(gradeId) {
    if (!gradeId) return setClasses([]);
    try {
      setClasses(await api.get(`/api/admin/classes?gradeId=${gradeId}`));
    } catch {
      /* handled elsewhere */
    }
  }

  async function loadTeachers() {
    setLoadingList(true);
    setListError(false);
    try {
      setTeachers(await api.get("/api/admin/teachers"));
    } catch {
      setListError(true);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchools();
    loadTeachers();
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
    else if (!EMAIL_RE.test(teacherForm.email)) e.email = "Enter a valid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function createTeacher() {
    if (!validate()) return;
    setCreating(true);
    try {
      const payload = { ...teacherForm };
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

  async function regenOtp() {
    if (!created?.teacherId) return;
    setRegenerating(true);
    try {
      const d = await api.post(`/api/admin/teachers/${created.teacherId}/regenerate-otp`, {});
      setCreated((p) => ({ ...p, otp: d.otp }));
      toast.show("OTP regenerated", "success");
    } catch (err) {
      toast.show(err?.data?.message || "Failed to regenerate OTP", "error");
    } finally {
      setRegenerating(false);
    }
  }

  const filteredTeachers = useMemo(
    () => teachers.filter((t2) => (t2.name + t2.email + t2.school).toLowerCase().includes(query.trim().toLowerCase())),
    [teachers, query]
  );

  return (
    <Layout title={t("teachers")} subtitle={`${teachers.length} teachers`}>
      <div className="stack" style={{ gap: 20 }}>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="col card" style={{ flex: "1 1 380px" }}>
            <div className="center-v mb-1" style={{ gap: 8 }}>
              <UserPlus size={18} style={{ color: "var(--primary)" }} />
              <div className="h2" style={{ marginBottom: 0 }}>{t("createTeacher")}</div>
            </div>
            <p className="subtitle mb-3">Add a new teacher to the system. A mapping code and OTP will be generated automatically.</p>

            <div className="field">
              <label className="label">{t("name")}</label>
              <input className={"input" + (errors.name ? " has-error" : "")} value={teacherForm.name} onChange={(e) => setTF("name", e.target.value)} placeholder="Full name" />
              {errors.name && <div className="field-error">{errors.name}</div>}
            </div>

            <div className="field">
              <label className="label">{t("email")}</label>
              <input className={"input" + (errors.email ? " has-error" : "")} value={teacherForm.email} onChange={(e) => setTF("email", e.target.value)} placeholder="teacher@school.lk" />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>

            <div className="row">
              <div className="col field">
                <label className="label">{t("school")}</label>
                <input className={"input" + (errors.school ? " has-error" : "")} value={teacherForm.school} onChange={(e) => setTF("school", e.target.value)} />
                {errors.school && <div className="field-error">{errors.school}</div>}
              </div>
              <div className="col field">
                <label className="label">{t("grade")}</label>
                <input className={"input" + (errors.grade ? " has-error" : "")} value={teacherForm.grade} onChange={(e) => setTF("grade", e.target.value)} />
                {errors.grade && <div className="field-error">{errors.grade}</div>}
              </div>
              <div className="col field">
                <label className="label">{t("className")}</label>
                <input className={"input" + (errors.className ? " has-error" : "")} value={teacherForm.className} onChange={(e) => setTF("className", e.target.value)} />
                {errors.className && <div className="field-error">{errors.className}</div>}
              </div>
            </div>

            <div className="field">
              <label className="label">{t("otp")} <span className="faint">(optional — auto-generated if left blank)</span></label>
              <input className="input" value={teacherForm.otp} onChange={(e) => setTF("otp", e.target.value)} placeholder="Leave blank to auto-generate" />
            </div>

            <button className="btn btn-block" type="button" onClick={createTeacher} disabled={creating}>
              {creating ? "Creating…" : t("submit")}
            </button>

            {created && (
              <div className="card mt-4" style={{ background: "var(--success-50)", border: "1px solid var(--success-100)" }}>
                <div className="center-v mb-2" style={{ gap: 8 }}>
                  <CheckCircle2 size={18} style={{ color: "var(--success)" }} />
                  <strong style={{ fontSize: 14 }}>Teacher created</strong>
                </div>
                <div className="field-hint mb-2">{t("mappingCodeNote")}</div>
                <div className="stack" style={{ gap: 4, fontSize: 13.5 }}>
                  <div className="between"><span className="muted">Teacher ID</span><strong>{created.teacherId}</strong></div>
                  <div className="between">
                    <span className="muted">{t("otp")}</span>
                    <strong className="center-v" style={{ gap: 6 }}><KeyRound size={13} /> {created.otp}</strong>
                  </div>
                  <div className="between"><span className="muted">{t("mappingCode")}</span><strong>{created.mappingCode}</strong></div>
                  <div className="between"><span className="muted">{t("trialExpiryDate")}</span><strong>{created.trialExpDate}</strong></div>
                </div>
                <button className="btn btn-outline btn-sm mt-3" type="button" onClick={regenOtp} disabled={regenerating}>
                  <RefreshCw size={13} /> {regenerating ? "Regenerating…" : t("regenerateOtp")}
                </button>
              </div>
            )}
          </div>

          <div className="col card" style={{ flex: "1 1 340px" }}>
            <div className="h2">{t("schoolStructure")}</div>

            <div className="card card-flat" style={{ background: "var(--muted)", marginBottom: 12 }}>
              <div className="center-v mb-2" style={{ gap: 8 }}>
                <School size={15} style={{ color: "var(--primary)" }} />
                <strong style={{ fontSize: 13.5 }}>{t("addSchool")}</strong>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <input className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="School name" />
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
              <div className="row" style={{ gap: 8 }}>
                <input className="input" value={gradeName} onChange={(e) => setGradeName(e.target.value)} placeholder={t("grade")} />
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
              <div className="row" style={{ gap: 8 }}>
                <input className="input" value={className} onChange={(e) => setClassName(e.target.value)} placeholder={t("className")} />
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

        <div className="card">
          <div className="between mb-3">
            <div className="center-v" style={{ gap: 8 }}>
              <Users size={17} style={{ color: "var(--primary)" }} />
              <div className="h2" style={{ marginBottom: 0 }}>All teachers</div>
            </div>
            <div className="input-wrap" style={{ maxWidth: 240 }}>
              <input className="input" style={{ paddingLeft: 34 }} placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
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
                    <th>{t("mappingCode")}</th>
                    <th>{t("trialExpiryDate")}</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map((tt) => (
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
                      <td>{tt.school}</td>
                      <td>{tt.grade} {tt.className}</td>
                      <td><span className="badge badge-primary">{tt.mappingCode}</span></td>
                      <td>{tt.tierExpDate}</td>
                      <td>
                        {tt.passwordSet ? <span className="badge badge-success">Set</span> : <span className="badge badge-warning">Pending</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
