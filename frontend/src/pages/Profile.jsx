import { useEffect, useState } from "react";
import {
  Save,
  UserCircle,
  ShieldCheck,
  School,
  GraduationCap,
  Users,
  Mail,
  Hash,
  Calendar,
  Edit3,
  X,
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { Avatar, Skeleton } from "../components/ui.jsx";
import { useI18n } from "../i18n/i18n.jsx";

const EMPTY = {
  name: "",
  email: "",
  guardianName: "",
  school: "",
  grade: "",
  className: "",
};

export default function Profile() {
  const { t } = useI18n();
  const { role } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const path =
      role === "STUDENT"
        ? "/api/student/me/profile"
        : role === "TEACHER"
        ? "/api/teacher/me/profile"
        : role === "PARENT"
        ? "/api/parent/me/profile"
        : "/api/admin/profile";

    try {
      const d = await api.get(path);
      setData(d);
      setForm({
        name: d.name || d.studentName || "",
        email: d.email || "",
        guardianName: d.guardianName || "",
        school: d.school || "",
        grade: d.grade || "",
        className: d.className || "",
      });
      if (d.name || d.studentName) {
        localStorage.setItem("displayName", d.name || d.studentName);
      }
    } catch (err) {
      toast.show(err?.data?.message || t("profileLoadFailed"), "error");
    }
  }

  useEffect(() => {
    load();
  }, [role]);

  async function save() {
    setSaving(true);
    try {
      await api.put("/api/student/me/profile", form);
      toast.show(t("profileUpdated"), "success");
      setEditing(false);
      await load();
    } catch (err) {
      toast.show(err?.data?.message || t("profileUpdateFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  const student = role === "STUDENT";
  const displayName = data?.name || data?.studentName || data?.email || "Student";

  return (
    <Layout
      title={t("profileTitle")}
      subtitle={student ? t("profileSubtitleStudent") : t("profileSubtitleOther")}
    >
      {!data ? (
        <div className="profileSkeleton">
          <Skeleton height={160} radius={20} />
          <Skeleton height={340} radius={20} />
        </div>
      ) : (
        <div className="profilePage">
          {/* ===== Hero ===== */}
          <section className="profileHero card">
            <div className="profileIdentity">
              <Avatar name={displayName} size={72} />
              <div>
                <div className="profileName">{displayName}</div>
                <div className="profileMeta">
                  <span className="roleBadge">
                    <ShieldCheck size={14} />
                    {role}
                  </span>
                  {data.grade && (
                    <span className="metaItem">
                      <GraduationCap size={14} />
                      {t("grade")} {data.grade}
                    </span>
                  )}
                  {data.className && (
                    <span className="metaItem">
                      <Hash size={14} />
                      {t("className")} {data.className}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {student && !editing && (
              <button className="btn btn-outline" onClick={() => setEditing(true)}>
                <Edit3 size={16} />
                {t("profileEdit")}
              </button>
            )}
          </section>

          {/* ===== Personal Information ===== */}
          <section className="card profileCard">
            <div className="between profileHeader">
              <div>
                <div className="h2">
                  <UserCircle size={20} style={{ verticalAlign: "-4px", marginRight: 8 }} />
                  {t("profilePersonalInfo")}
                </div>
                <p className="subtitle">{t("profilePersonalHint")}</p>
              </div>
            </div>

            {student && editing ? (
              /* ---------- Edit Mode ---------- */
              <div className="profileForm">
                <div className="formGrid">
                  {[
                    ["name", t("profileFullName"), t("profileHintName")],
                    ["email", t("profileEmail"), t("profileHintEmail")],
                    ["guardianName", t("profileGuardian"), t("profileHintGuardian")],
                    ["school", t("profileSchool"), t("profileHintSchool")],
                    ["grade", t("profileGrade"), t("profileHintGrade")],
                    ["className", t("profileClass"), t("profileHintClass")],
                  ].map(([key, label, hint]) => (
                    <div className="field" key={key}>
                      <label className="label">{label}</label>
                      <input
                        className="input"
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={hint}
                      />
                    </div>
                  ))}
                </div>

                <div className="profileActions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    <X size={16} />
                    {t("cancel")}
                  </button>
                  <button className="btn" onClick={save} disabled={saving}>
                    <Save size={16} />
                    {saving ? t("profileSaving") : t("profileSaveChanges")}
                  </button>
                </div>
              </div>
            ) : (
              /* ---------- View Mode ---------- */
              <div className="profileGrid">
                <Info
                  icon={<UserCircle size={18} />}
                  label={t("profileFullName")}
                  value={data.name || data.studentName}
                />
                <Info
                  icon={<Mail size={18} />}
                  label={t("email")}
                  value={data.email}
                />
                {data.guardianName !== undefined && (
                  <Info
                    icon={<Users size={18} />}
                    label={t("profileGuardian")}
                    value={data.guardianName}
                  />
                )}
                <Info
                  icon={<School size={18} />}
                  label={t("profileSchool")}
                  value={data.school}
                />
                <Info
                  icon={<GraduationCap size={18} />}
                  label={t("profileGrade")}
                  value={data.grade}
                />
                <Info
                  icon={<Hash size={18} />}
                  label={t("profileClass")}
                  value={data.className}
                />
                {data.mappingCode && (
                  <Info
                    icon={<Hash size={18} />}
                    label={t("profileMappingCode")}
                    value={data.mappingCode}
                  />
                )}
                {data.tierExpDate && (
                  <Info
                    icon={<Calendar size={18} />}
                    label={t("profileExpiry")}
                    value={data.tierExpDate}
                  />
                )}
                {data.role && (
                  <Info
                    icon={<ShieldCheck size={18} />}
                    label={t("profileRole")}
                    value={data.role}
                  />
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </Layout>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="profileInfo">
      <div className="infoIcon">{icon}</div>
      <div>
        <span className="infoLabel">{label}</span>
        <strong className="infoValue">{value || "—"}</strong>
      </div>
    </div>
  );
}