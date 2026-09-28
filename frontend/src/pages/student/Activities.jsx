import { useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Pencil,
  X,
  Star,
  BookMarked,
  CloudOff,
  Play,
  Square,
  MessageSquareText,
  Timer,
  CheckCircle2,
  Plus,
  Calendar,
} from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Skeleton, EmptyState, ErrorState, Modal } from "../../components/ui.jsx";

const EMPTY_FORM = {
  subjectName: "",
  startDate: "",
  startTime: "16:00",
  endTime: "17:00",
  description: "",
};

function calcDuration(startTime, endTime) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function fmtDuration(mins) {
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function fmtActualDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  if (s < 60) return `${s}s`;
  return fmtDuration(Math.round(s / 60));
}

function fmtDateHeader(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function Activities() {
  const { t } = useI18n();
  const toast = useToast();

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false); // mobile-friendly toggle

  // Live study-session timer + post-session feedback
  const [now, setNow] = useState(Date.now());
  const [startingId, setStartingId] = useState(null);
  const [stopTarget, setStopTarget] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [submittingStop, setSubmittingStop] = useState(false);
  const tickRef = useRef(null);

  const hasRunningSession = useMemo(
    () => items.some((a) => a.status === "IN_PROGRESS"),
    [items]
  );

  useEffect(() => {
    if (!hasRunningSession) return undefined;
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tickRef.current);
  }, [hasRunningSession]);

  const duration = useMemo(() => {
    if (!form.startTime || !form.endTime) return 0;
    return calcDuration(form.startTime, form.endTime);
  }, [form.startTime, form.endTime]);

  function set(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  }

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const d = await api.get("/api/student/me/activities");
      setItems(d);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      setError(true);
      toast.show(err?.data?.message || "Failed to load activities", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate() {
    const e = {};
    if (!form.subjectName.trim()) e.subjectName = t("subjectName") + " is required";
    if (!form.startDate) e.startDate = t("startDate") + " is required";
    if (!form.startTime) e.startTime = "Required";
    if (!form.endTime) e.endTime = "Required";
    if (form.startTime && form.endTime && duration <= 0)
      e.endTime = "End time must be after start time";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (!editing) {
        await api.post("/api/student/me/activities", form);
        toast.show("Activity logged", "success");
      } else {
        await api.put(`/api/student/me/activities/${editing.activityId}`, form);
        toast.show("Activity updated", "success");
      }
      setEditing(null);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      toast.show(err?.data?.message || "Save failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(a) {
    setEditing(a);
    setErrors({});
    setForm({
      subjectName: a.subjectName,
      startDate: a.startDate,
      startTime: a.startTime,
      endTime: a.endTime,
      description: a.description || "",
    });
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("activity-form-card")?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);
  }

  function cancelEdit() {
    setEditing(null);
    setErrors({});
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  async function startActivity(a) {
    setStartingId(a.activityId);
    try {
      const res = await api.post(
        `/api/student/me/activities/${a.activityId}/start`,
        {}
      );
      setItems((prev) =>
        prev.map((it) =>
          it.activityId === a.activityId
            ? {
                ...it,
                status: "IN_PROGRESS",
                actualStartAt: res?.actualStartAt || new Date().toISOString(),
                actualEndAt: null,
              }
            : it
        )
      );
      setNow(Date.now());
      toast.show("Timer started — good luck with your study session!", "success");
    } catch (err) {
      toast.show(
        err?.data?.message || "Couldn't start the timer. Please try again.",
        "error"
      );
    } finally {
      setStartingId(null);
    }
  }

  function openStopModal(a) {
    setStopTarget(a);
    setFeedbackText("");
    setFeedbackError("");
  }

  function closeStopModal() {
    if (submittingStop) return;
    setStopTarget(null);
    setFeedbackText("");
    setFeedbackError("");
  }

  async function confirmStopActivity() {
    if (!stopTarget) return;
    if (!feedbackText.trim()) {
      setFeedbackError("Please add a short note before finishing.");
      return;
    }
    setSubmittingStop(true);
    try {
      const res = await api.post(
        `/api/student/me/activities/${stopTarget.activityId}/stop`,
        { feedback: feedbackText.trim() }
      );
      setItems((prev) =>
        prev.map((it) =>
          it.activityId === stopTarget.activityId
            ? {
                ...it,
                status: "COMPLETED",
                actualEndAt: new Date().toISOString(),
                actualDurationSeconds:
                  res?.actualDurationSeconds ?? it.actualDurationSeconds,
                studentFeedback: feedbackText.trim(),
              }
            : it
        )
      );
      toast.show("Session saved. Great work!", "success");
      setStopTarget(null);
      setFeedbackText("");
    } catch (err) {
      toast.show(
        err?.data?.message || "Couldn't save the session. Please try again.",
        "error"
      );
    } finally {
      setSubmittingStop(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      if (!map.has(a.startDate)) map.set(a.startDate, []);
      map.get(a.startDate).push(a);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  return (
    <Layout
      title={t("activities")}
      subtitle={items.length ? `${items.length} logged` : undefined}
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="activities-page">
          {/* ===== Header + Add Button ===== */}
          <div className="activities-header">
            <div>
              <h2 className="h2" style={{ margin: 0 }}>
                {t("yourActivities")}
              </h2>
              <p className="subtitle" style={{ marginTop: 4 }}>
                Plan, start and track your study sessions
              </p>
            </div>
            <button
              className="btn btn-accent"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_FORM);
                setErrors({});
                setShowForm(true);
              }}
            >
              <Plus size={16} />
              {t("createActivity")}
            </button>
          </div>

          {/* ===== Create / Edit Form ===== */}
          {(showForm || editing) && (
            <div className="card activity-form-card" id="activity-form-card">
              <div className="between mb-3">
                <div className="h2" style={{ margin: 0 }}>
                  {editing ? t("editActivity") : t("createActivity")}
                </div>
                <button
                  className="btn-ghost btn-icon"
                  type="button"
                  onClick={cancelEdit}
                  aria-label={t("cancel")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={submit} noValidate>
                <div className="form-grid">
                  <div className="field">
                    <label className="label">{t("subjectName")}</label>
                    <input
                      className={"input" + (errors.subjectName ? " has-error" : "")}
                      value={form.subjectName}
                      onChange={(e) => set("subjectName", e.target.value)}
                      placeholder="e.g. Mathematics"
                    />
                    {errors.subjectName && (
                      <div className="field-error">{errors.subjectName}</div>
                    )}
                  </div>

                  <div className="field">
                    <label className="label">{t("startDate")}</label>
                    <input
                      className={"input" + (errors.startDate ? " has-error" : "")}
                      type="date"
                      value={form.startDate}
                      onChange={(e) => set("startDate", e.target.value)}
                    />
                    {errors.startDate && (
                      <div className="field-error">{errors.startDate}</div>
                    )}
                  </div>

                  <div className="field">
                    <label className="label">{t("startTime")}</label>
                    <input
                      className="input"
                      type="time"
                      value={form.startTime}
                      onChange={(e) => set("startTime", e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label className="label">{t("endTime")}</label>
                    <input
                      className={"input" + (errors.endTime ? " has-error" : "")}
                      type="time"
                      value={form.endTime}
                      onChange={(e) => set("endTime", e.target.value)}
                    />
                    {errors.endTime && (
                      <div className="field-error">{errors.endTime}</div>
                    )}
                  </div>
                </div>

                <div className="field" style={{ marginTop: 12 }}>
                  <label className="label">{t("durationMinutes")}</label>
                  <div className="chip chip-primary">
                    <Clock3 size={13} />{" "}
                    {duration > 0 ? fmtDuration(duration) : "—"}
                  </div>
                </div>

                <div className="field">
                  <label className="label">{t("description")}</label>
                  <textarea
                    className="textarea"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Optional notes about this session"
                    rows={3}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn btn-accent"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : editing ? t("update") : t("save")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={cancelEdit}
                  >
                    {t("cancel")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ===== Content ===== */}
          {loading ? (
            <div className="activity-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height={180} radius={16} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              icon={<CloudOff size={22} />}
              title={t("couldntLoad")}
              onRetry={load}
              retryLabel={t("tryAgain")}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<BookMarked size={28} />}
              title={t("noActivityYet")}
              message={t("noActivityYetMsg")}
            />
          ) : (
            <div className="activities-list">
              {grouped.map(([date, dayItems]) => (
                <div key={date} className="day-section">
                  <div className="day-header">
                    <Calendar size={16} />
                    <span>{fmtDateHeader(date)}</span>
                  </div>

                  <div className="activity-grid">
                    {dayItems.map((a) => {
                      const status = a.status || "PLANNED";
                      const isRunning = status === "IN_PROGRESS";
                      const isDone = status === "COMPLETED";
                      const elapsedSeconds =
                        isRunning && a.actualStartAt
                          ? (now - new Date(a.actualStartAt).getTime()) / 1000
                          : 0;

                      return (
                        <div
                          key={a.activityId}
                          className={`activity-card ${
                            isRunning
                              ? "status-live"
                              : isDone
                              ? "status-done"
                              : "status-planned"
                          }`}
                        >
                          {/* Card Header */}
                          <div className="card-top">
                            <div className="subject-name">{a.subjectName}</div>
                            {!isRunning && (
                              <button
                                className="btn-ghost btn-icon"
                                type="button"
                                onClick={() => startEdit(a)}
                                aria-label={t("editActivity")}
                                title={t("editActivity")}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                          </div>

                          {/* Time */}
                          <div className="time-row">
                            <Clock3 size={14} />
                            <span>
                              {a.startTime?.slice(0, 5)} – {a.endTime?.slice(0, 5)}
                            </span>
                          </div>

                          {/* Badges */}
                          <div className="badge-row">
                            <span className="badge">
                              <Clock3 size={11} /> Planned:{" "}
                              {fmtDuration(a.durationMinutes)}
                            </span>

                            {isDone && a.actualDurationSeconds != null && (
                              <span className="badge badge-success">
                                <CheckCircle2 size={11} /> Actual:{" "}
                                {fmtActualDuration(a.actualDurationSeconds)}
                              </span>
                            )}

                            {a.tRate && (
                              <span className="badge badge-primary">
                                <Star size={11} /> Teacher: {a.tRate}/5
                              </span>
                            )}
                            {a.pRate && (
                              <span className="badge badge-accent">
                                <Star size={11} /> Parent: {a.pRate}/5
                              </span>
                            )}
                          </div>

                          {a.description && (
                            <p className="desc">{a.description}</p>
                          )}

                          {/* Live Timer / Actions */}
                          <div className="card-actions">
                            {status === "PLANNED" && (
                              <button
                                type="button"
                                className="btn btn-sm btn-accent"
                                onClick={() => startActivity(a)}
                                disabled={
                                  startingId === a.activityId || hasRunningSession
                                }
                                title={
                                  hasRunningSession
                                    ? "Finish your current session first"
                                    : undefined
                                }
                              >
                                <Play size={14} />
                                {startingId === a.activityId
                                  ? "…"
                                  : t("startSession")}
                              </button>
                            )}

                            {isRunning && (
                              <div className="live-timer-box">
                                <div className="live-info">
                                  <span className="live-dot" />
                                  <Timer size={15} />
                                  <span className="live-clock">
                                    {fmtClock(elapsedSeconds)}
                                  </span>
                                  <span className="live-label">
                                    {t("liveSession")}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => openStopModal(a)}
                                >
                                  <Square size={13} /> {t("stopSession")}
                                </button>
                              </div>
                            )}

                            {isDone && (
                              <div className="done-badge">
                                <CheckCircle2 size={15} />
                                Completed
                              </div>
                            )}
                          </div>

                          {/* Student feedback */}
                          {isDone && a.studentFeedback && (
                            <div className="student-note">
                              <MessageSquareText size={14} />
                              <span>{a.studentFeedback}</span>
                            </div>
                          )}

                          {/* Teacher / Parent comments */}
                          {(a.tComment || a.pComment) && (
                            <p className="comments">
                              {a.tComment && <span>"{a.tComment}"</span>}
                              {a.pComment && <span>"{a.pComment}"</span>}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Stop Session Modal ===== */}
        <Modal
          open={!!stopTarget}
          onClose={closeStopModal}
          title={t("sessionFeedbackTitle")}
          footer={
            <>
              <button
                type="button"
                className="btn btn-outline"
                onClick={closeStopModal}
                disabled={submittingStop}
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn btn-accent"
                onClick={confirmStopActivity}
                disabled={submittingStop}
              >
                {submittingStop ? "Saving…" : t("finishSession")}
              </button>
            </>
          }
        >
          {stopTarget && (
            <div className="stack" style={{ gap: 12 }}>
              <div className="modal-chips">
                <span className="chip chip-primary">
                  <Timer size={13} /> {stopTarget.subjectName}
                </span>
                <span className="chip chip-primary">
                  <Clock3 size={13} />{" "}
                  {fmtClock(
                    stopTarget.actualStartAt
                      ? (now - new Date(stopTarget.actualStartAt).getTime()) / 1000
                      : 0
                  )}
                </span>
              </div>
              <p className="subtitle" style={{ margin: 0 }}>
                {t("sessionFeedbackSubtitle")}
              </p>
              <div className="field" style={{ marginBottom: 0 }}>
                <textarea
                  className={"textarea" + (feedbackError ? " has-error" : "")}
                  rows={4}
                  autoFocus
                  value={feedbackText}
                  onChange={(e) => {
                    setFeedbackText(e.target.value);
                    if (feedbackError) setFeedbackError("");
                  }}
                  placeholder={t("sessionFeedbackPlaceholder")}
                />
                {feedbackError && (
                  <div className="field-error">{feedbackError}</div>
                )}
              </div>
            </div>
          )}
        </Modal>
      </TrialGate>
    </Layout>
  );
}