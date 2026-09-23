import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button, Badge, EmptyState } from "../../components/UI/index.jsx";
import Stars from "../../components/Stars.jsx";
import {
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  EditIcon,
  PlusIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  SparklesIcon,
  XIcon,
} from "../../components/UI/Icons.jsx";

function calcDuration(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return end - start;
}

const COMMON_SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Sinhala",
  "History",
  "ICT",
  "Commerce",
  "Geography",
];

export default function StudentActivities() {
  const { t } = useI18n();
  const toast = useToast();

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const [form, setForm] = useState({
    subjectName: "",
    startDate: todayStr,
    startTime: "16:00",
    endTime: "17:30",
    description: "",
  });

  const duration = useMemo(() => {
    return calcDuration(form.startTime, form.endTime);
  }, [form.startTime, form.endTime]);

  const durationFormatted = useMemo(() => {
    if (duration <= 0) return "0 min";
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} hr`;
    return `${h}h ${m}m`;
  }, [duration]);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function loadActivities() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const d = await api.get("/api/student/me/activities");
      setItems(Array.isArray(d) ? d : []);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to load activities", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.subjectName.trim()) {
      toast.show("Please enter or select a subject name", "error");
      return;
    }
    if (duration <= 0) {
      toast.show("End time must be after start time", "error");
      return;
    }

    setSaving(true);
    try {
      if (!editing) {
        await api.post("/api/student/me/activities", form);
        toast.show("🎉 Great job! Study session logged successfully.");
      } else {
        await api.put(`/api/student/me/activities/${editing.activityId}`, form);
        toast.show("Activity updated successfully");
      }
      setEditing(null);
      setForm({
        subjectName: "",
        startDate: todayStr,
        startTime: "16:00",
        endTime: "17:30",
        description: "",
      });
      await loadActivities();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to save activity", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(act) {
    setEditing(act);
    setForm({
      subjectName: act.subjectName,
      startDate: act.startDate,
      startTime: act.startTime,
      endTime: act.endTime,
      description: act.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({
      subjectName: "",
      startDate: todayStr,
      startTime: "16:00",
      endTime: "17:30",
      description: "",
    });
  }

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const date = item.startDate || "Other";
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  }, [items]);

  return (
    <Layout
      title={t("activities")}
      subtitle="Log your focused study sessions and track feedback"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-activities-container">
          <div className="sams-activities-layout">
            {/* LEFT / TOP: 3-Step Focused Form (Prompt Requirement 9) */}
            <div className="sams-form-column">
              <Card className="sams-activity-creator-card">
                <div className="sams-form-title-bar">
                  <div className="sams-form-badge">
                    {editing ? <EditIcon size={16} /> : <PlusIcon size={16} />}
                  </div>
                  <div>
                    <h2 className="sams-form-main-heading">
                      {editing ? t("editActivity") : t("createActivity")}
                    </h2>
                    <p className="sams-form-desc">
                      {editing
                        ? "Update your study session details"
                        : "Record what you studied to track your progress"}
                    </p>
                  </div>
                  {editing && (
                    <button
                      type="button"
                      className="sams-cancel-edit-x"
                      onClick={cancelEdit}
                      title={t("cancel")}
                    >
                      <XIcon size={18} />
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="sams-structured-form">
                  {/* Step 1: What did you study? */}
                  <div className="sams-step-box">
                    <div className="sams-step-header">
                      <span className="sams-step-num">1</span>
                      <h3 className="sams-step-title">{t("whatDidYouStudy")}</h3>
                    </div>

                    <div className="sams-field">
                      <input
                        type="text"
                        className="sams-input"
                        value={form.subjectName}
                        onChange={(e) => setField("subjectName", e.target.value)}
                        placeholder="e.g. Mathematics, Science, English..."
                        required
                      />
                    </div>

                    {/* Quick subject suggestion chips */}
                    <div className="sams-subject-chips">
                      {COMMON_SUBJECTS.map((sub) => (
                        <button
                          key={sub}
                          type="button"
                          className={`sams-chip ${form.subjectName === sub ? "active" : ""}`}
                          onClick={() => setField("subjectName", sub)}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: When did you study? */}
                  <div className="sams-step-box">
                    <div className="sams-step-header">
                      <span className="sams-step-num">2</span>
                      <h3 className="sams-step-title">{t("whenDidYouStudy")}</h3>
                    </div>

                    <div className="sams-field">
                      <label className="sams-label">
                        <span>{t("startDate")}</span>
                      </label>
                      <input
                        type="date"
                        className="sams-input"
                        value={form.startDate}
                        onChange={(e) => setField("startDate", e.target.value)}
                        required
                      />
                    </div>

                    <div className="sams-time-inputs-row">
                      <div className="sams-field" style={{ flex: 1 }}>
                        <label className="sams-label">
                          <span>{t("startTime")}</span>
                        </label>
                        <input
                          type="time"
                          className="sams-input"
                          value={form.startTime}
                          onChange={(e) => setField("startTime", e.target.value)}
                          required
                        />
                      </div>

                      <div className="sams-field" style={{ flex: 1 }}>
                        <label className="sams-label">
                          <span>{t("endTime")}</span>
                        </label>
                        <input
                          type="time"
                          className="sams-input"
                          value={form.endTime}
                          onChange={(e) => setField("endTime", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Duration badge display */}
                    <div className="sams-calc-duration-box">
                      <ClockIcon size={16} color="var(--accent)" />
                      <span className="sams-dur-label">{t("durationMinutes")}:</span>
                      <span className={`sams-dur-value ${duration <= 0 ? "invalid" : ""}`}>
                        {duration > 0 ? durationFormatted : "Invalid time range"}
                      </span>
                    </div>
                  </div>

                  {/* Step 3: What did you do? */}
                  <div className="sams-step-box">
                    <div className="sams-step-header">
                      <span className="sams-step-num">3</span>
                      <h3 className="sams-step-title">{t("whatDidYouDo")}</h3>
                    </div>

                    <div className="sams-field" style={{ marginBottom: 0 }}>
                      <textarea
                        className="sams-textarea"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setField("description", e.target.value)}
                        placeholder={t("sessionNotesPlaceholder")}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="sams-form-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={saving}
                      icon={<CheckCircleIcon size={18} />}
                      className="sams-submit-full"
                    >
                      {editing ? t("update") : t("saveAndLog")}
                    </Button>
                    {editing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={cancelEdit}
                      >
                        {t("cancel")}
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </div>

            {/* RIGHT / BOTTOM: Easy-to-Scan Timeline (Prompt Requirement 10) */}
            <div className="sams-timeline-column">
              <div className="sams-timeline-header">
                <div>
                  <h2 className="sams-timeline-heading">{t("yourActivities")}</h2>
                  <p className="sams-timeline-sub">
                    {items.length} total study session{items.length !== 1 ? "s" : ""} recorded
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCwIcon size={14} />}
                  onClick={loadActivities}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="sams-timeline-loading">
                  <Card className="sams-skeleton-card">
                    <div style={{ height: 120, background: "#F1F5F9", borderRadius: 8 }} />
                  </Card>
                </div>
              ) : items.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<BookOpenIcon size={36} color="var(--accent)" />}
                    title={t("noActivitiesYet")}
                    description={t("studyJourneyStartsHere")}
                    actionText={t("addYourFirstActivity")}
                    actionIcon={<PlusIcon size={16} />}
                    onAction={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  />
                </Card>
              ) : (
                <div className="sams-timeline-stream">
                  {Object.entries(groupedActivities).map(([date, acts]) => {
                    const isToday = date === todayStr;
                    return (
                      <div key={date} className="sams-timeline-date-group">
                        <div className="sams-timeline-date-pill">
                          <CalendarIcon size={14} />
                          <span>{isToday ? `TODAY (${date})` : date}</span>
                        </div>

                        <div className="sams-timeline-date-cards">
                          {acts.map((act) => (
                            <Card key={act.activityId} hover className="sams-timeline-card">
                              <div className="sams-card-main-row">
                                <div className="sams-card-subject-block">
                                  <div className="sams-subject-indicator" />
                                  <div>
                                    <div className="sams-timeline-subject">
                                      {act.subjectName}
                                    </div>
                                    <div className="sams-timeline-time-meta">
                                      <ClockIcon size={13} />
                                      <span>{act.startTime} – {act.endTime}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="sams-card-actions-right">
                                  <Badge variant="primary" size="md">
                                    {act.durationMinutes} min
                                  </Badge>
                                  <button
                                    type="button"
                                    className="sams-edit-icon-btn"
                                    onClick={() => startEdit(act)}
                                    title={t("editActivity")}
                                  >
                                    <EditIcon size={16} />
                                  </button>
                                </div>
                              </div>

                              {act.description && (
                                <p className="sams-timeline-notes">
                                  “{act.description}”
                                </p>
                              )}

                              {/* Supportive Feedback Cards (Prompt Requirement 16) */}
                              {(act.tRate || act.tComment || act.pRate || act.pComment) && (
                                <div className="sams-feedback-container">
                                  {act.tRate || act.tComment ? (
                                    <div className="sams-feedback-chip teacher">
                                      <div className="sams-feedback-top">
                                        <span className="sams-feedback-who">{t("teacherFeedback")}</span>
                                        {act.tRate ? <Stars value={act.tRate} readOnly size={14} /> : null}
                                      </div>
                                      {act.tComment && (
                                        <p className="sams-feedback-quote">“{act.tComment}”</p>
                                      )}
                                    </div>
                                  ) : null}

                                  {act.pRate || act.pComment ? (
                                    <div className="sams-feedback-chip parent">
                                      <div className="sams-feedback-top">
                                        <span className="sams-feedback-who">{t("parentFeedback")}</span>
                                        {act.pRate ? <Stars value={act.pRate} readOnly size={14} /> : null}
                                      </div>
                                      {act.pComment && (
                                        <p className="sams-feedback-quote">“{act.pComment}”</p>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </TrialGate>

      <style>{`
        .sams-activities-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .sams-activities-layout {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 28px;
          align-items: flex-start;
        }

        /* Form Card */
        .sams-activity-creator-card {
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
        }

        .sams-form-title-bar {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 18px;
          position: relative;
        }

        .sams-form-badge {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-form-main-heading {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-form-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-cancel-edit-x {
          position: absolute;
          right: 0;
          top: 0;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
        }

        /* Step Boxes */
        .sams-step-box {
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
          margin-bottom: 16px;
        }

        .sams-step-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .sams-step-num {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-step-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-subject-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .sams-chip {
          border: 1px solid var(--border-subtle);
          background: #FFFFFF;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-chip:hover {
          background: var(--accent-soft);
          color: var(--primary);
          border-color: var(--accent-light);
        }

        .sams-chip.active {
          background: var(--primary);
          color: #FFFFFF;
          border-color: var(--primary);
        }

        .sams-time-inputs-row {
          display: flex;
          gap: 12px;
        }

        .sams-calc-duration-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px dashed var(--border-strong);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          font-size: 13px;
        }

        .sams-dur-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .sams-dur-value {
          font-weight: 800;
          color: var(--primary);
        }

        .sams-dur-value.invalid {
          color: var(--danger);
        }

        .sams-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .sams-submit-full {
          flex: 1;
        }

        /* Timeline Column */
        .sams-timeline-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sams-timeline-heading {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-timeline-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-timeline-stream {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sams-timeline-date-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sams-timeline-date-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: var(--radius-pill);
          align-self: flex-start;
          box-shadow: var(--shadow-xs);
        }

        .sams-timeline-date-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sams-timeline-card {
          padding: 16px 20px;
        }

        .sams-card-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .sams-card-subject-block {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sams-subject-indicator {
          width: 4px;
          height: 32px;
          background: linear-gradient(180deg, #2E86C1 0%, #00C6FF 100%);
          border-radius: var(--radius-pill);
        }

        .sams-timeline-subject {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-timeline-time-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-card-actions-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sams-edit-icon-btn {
          background: #F1F5F9;
          border: none;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-edit-icon-btn:hover {
          background: var(--accent-soft);
          color: var(--primary);
        }

        .sams-timeline-notes {
          font-size: 13px;
          color: var(--text-secondary);
          font-style: italic;
          background: var(--bg-card-muted);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          margin: 6px 0 10px;
          border-left: 3px solid var(--border-strong);
        }

        .sams-feedback-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed var(--border-subtle);
        }

        .sams-feedback-chip {
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 12px;
        }

        .sams-feedback-chip.teacher {
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
        }

        .sams-feedback-chip.parent {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
        }

        .sams-feedback-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .sams-feedback-who {
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-feedback-quote {
          font-style: italic;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        @media (max-width: 900px) {
          .sams-activities-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}