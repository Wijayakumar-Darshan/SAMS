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
  ChevronLeft,
  ChevronRight,
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

/* ---------------------------
   Helpers (calendar + duration)
---------------------------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Local-safe YYYY-MM-DD (no timezone shifting)
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

// Monday=0 ... Sunday=6
function weekdayMon0(d) {
  const js = d.getDay(); // Sun=0 ... Sat=6
  return (js + 6) % 7; // Mon=0 ... Sun=6
}

function calcDuration(startTime, endTime) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function fmtDuration(mins) {
  const m = Number(mins) || 0;
  if (m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm > 0 ? mm + "m" : ""}`.trim() : `${mm}m`;
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

function minutesToHoursText(min) {
  const m = Number(min) || 0;
  if (!m) return "0h";
  const h = m / 60;
  return `${h.toFixed(1)}h`;
}

/* ---------------------------
   Hook: media query (mobile detect)
---------------------------- */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [query]);

  return matches;
}

export default function Activities() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const isMobile = useMediaQuery("(max-width: 900px)");

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  // Live study-session timer + post-session feedback
  const [now, setNow] = useState(Date.now());
  const [startingId, setStartingId] = useState(null);
  const [stopTarget, setStopTarget] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [submittingStop, setSubmittingStop] = useState(false);
  const tickRef = useRef(null);

  // Mobile calendar state
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [dayModalOpen, setDayModalOpen] = useState(false);

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
      setItems(Array.isArray(d) ? d : []);
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
      const res = await api.post(`/api/student/me/activities/${a.activityId}/start`, {});
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
      toast.show(err?.data?.message || "Couldn't start the timer. Please try again.", "error");
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
      const res = await api.post(`/api/student/me/activities/${stopTarget.activityId}/stop`, {
        feedback: feedbackText.trim(),
      });
      setItems((prev) =>
        prev.map((it) =>
          it.activityId === stopTarget.activityId
            ? {
                ...it,
                status: "COMPLETED",
                actualEndAt: new Date().toISOString(),
                actualDurationSeconds: res?.actualDurationSeconds ?? it.actualDurationSeconds,
                studentFeedback: feedbackText.trim(),
              }
            : it
        )
      );
      toast.show("Session saved. Great work!", "success");
      setStopTarget(null);
      setFeedbackText("");
    } catch (err) {
      toast.show(err?.data?.message || "Couldn't save the session. Please try again.", "error");
    } finally {
      setSubmittingStop(false);
    }
  }

  /* ---------------------------
     Desktop grouping
  ---------------------------- */
  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      if (!map.has(a.startDate)) map.set(a.startDate, []);
      map.get(a.startDate).push(a);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [items]);

  /* ---------------------------
     Mobile calendar data
  ---------------------------- */
  const byDate = useMemo(() => {
    const map = new Map();
    for (const a of items) {
      const day = a.startDate; // already YYYY-MM-DD
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(a);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((x, y) => (x.startTime || "").localeCompare(y.startTime || ""));
      map.set(k, arr);
    }
    return map;
  }, [items]);

  const calendarDays = useMemo(() => {
    const mStart = startOfMonth(monthCursor);
    const mEnd = endOfMonth(monthCursor);
    const gridStart = addDays(mStart, -weekdayMon0(mStart)); // Monday
    const gridEnd = addDays(mEnd, 6 - weekdayMon0(mEnd)); // Sunday

    const days = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [monthCursor]);

  const monthLabel = useMemo(() => {
    const locale = lang === "si" ? "si-LK" : "en-GB";
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(monthCursor);
  }, [monthCursor, lang]);

  const weekdayNames = useMemo(() => {
    return lang === "si"
      ? ["සඳු", "අඟ", "බදා", "බ්‍රහ", "සිකු", "සෙන", "ඉරි"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }, [lang]);

  const selectedActivities = useMemo(() => byDate.get(selectedDate) || [], [byDate, selectedDate]);

  const selectedTotalMinutes = useMemo(() => {
    return selectedActivities.reduce((sum, a) => sum + (Number(a.durationMinutes) || 0), 0);
  }, [selectedActivities]);

  function goPrevMonth() {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() - 1);
    setMonthCursor(d);
  }

  function goNextMonth() {
    const d = new Date(monthCursor);
    d.setMonth(d.getMonth() + 1);
    setMonthCursor(d);
  }

  function goToday() {
    const nowDate = new Date();
    setMonthCursor(nowDate);
    setSelectedDate(toISODate(nowDate));
    setDayModalOpen(true);
  }

  function openDay(iso) {
    setSelectedDate(iso);
    setDayModalOpen(true);
  }

  function openCreateForSelectedDay() {
    setEditing(null);
    setErrors({});
    setForm({ ...EMPTY_FORM, startDate: selectedDate });
    setShowForm(true);
    setDayModalOpen(false);
    setTimeout(() => {
      document.getElementById("activity-form-card")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  /* ---------------------------
     Reusable Activity Card
     (used by Desktop list AND Mobile day modal)
  ---------------------------- */
  function ActivityCard({ a, fromDayModal = false }) {
    const status = a.status || "PLANNED";
    const isRunning = status === "IN_PROGRESS";
    const isDone = status === "COMPLETED";
    const elapsedSeconds =
      isRunning && a.actualStartAt ? (now - new Date(a.actualStartAt).getTime()) / 1000 : 0;

    const onEdit = () => {
      // Avoid stacked modals on mobile
      if (fromDayModal) setDayModalOpen(false);
      startEdit(a);
    };

    const onStop = () => {
      // Avoid stacked modals on mobile
      if (fromDayModal) setDayModalOpen(false);
      openStopModal(a);
    };

    return (
      <div
        className={`activity-card ${
          isRunning ? "status-live" : isDone ? "status-done" : "status-planned"
        }`}
      >
        {/* Card Header */}
        <div className="card-top">
          <div className="subject-name">{a.subjectName}</div>

          {!isRunning && (
            <button
              className="btn-ghost btn-icon"
              type="button"
              onClick={onEdit}
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
            <Clock3 size={11} /> Planned: {fmtDuration(a.durationMinutes)}
          </span>

          {isDone && a.actualDurationSeconds != null && (
            <span className="badge badge-success">
              <CheckCircle2 size={11} /> Actual: {fmtActualDuration(a.actualDurationSeconds)}
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

        {a.description && <p className="desc">{a.description}</p>}

        {/* Live Timer / Actions */}
        <div className="card-actions">
          {status === "PLANNED" && (
            <button
              type="button"
              className="btn btn-sm btn-accent"
              onClick={() => startActivity(a)}
              disabled={startingId === a.activityId || hasRunningSession}
              title={hasRunningSession ? "Finish your current session first" : undefined}
            >
              <Play size={14} />
              {startingId === a.activityId ? "…" : t("startSession")}
            </button>
          )}

          {isRunning && (
            <div className="live-timer-box">
              <div className="live-info">
                <span className="live-dot" />
                <Timer size={15} />
                <span className="live-clock">{fmtClock(elapsedSeconds)}</span>
                <span className="live-label">{t("liveSession")}</span>
              </div>
              <button type="button" className="btn btn-sm btn-danger" onClick={onStop}>
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
  }

  return (
    <Layout title={t("activities")} subtitle={items.length ? `${items.length} logged` : undefined}>
      <style>{`
        /* Mobile calendar + modal list scrolling */
        .mobcal-wrap { margin-top: 12px; }
        .mobcal-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding: 12px 12px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: var(--surface);
          box-shadow: var(--shadow-xs);
          margin-bottom: 12px;
        }
        .mobcal-nav { display: flex; align-items: center; gap: 10px; }
        .mobcal-title { font-weight: 900; font-size: 14px; min-width: 120px; text-align: center; }
        .mobcal-iconbtn {
          width: 34px; height: 34px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
          color: var(--text-muted);
        }
        .mobcal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        .mobcal-weekday { font-size: 11px; font-weight: 800; text-align: center; color: var(--text-muted); }
        .mobcal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .mobcal-cell {
          border: 1px solid var(--border);
          background: var(--surface);
          border-radius: 12px;
          min-height: 62px;
          padding: 8px;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .mobcal-cell.out { opacity: 0.45; background: var(--surface-hover); }
        .mobcal-cell.selected {
          border-color: var(--primary);
          background: var(--primary-50);
          box-shadow: inset 0 0 0 1px var(--primary-100);
        }
        .mobcal-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .mobcal-daynum {
          width: 26px; height: 26px;
          border-radius: 9px;
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 900;
          color: var(--ink);
          font-size: 13px;
        }
        .mobcal-cell.today .mobcal-daynum { background: var(--primary); color: #fff; }
        .mobcal-pill {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--border-soft);
          background: var(--surface-hover);
          color: var(--text-muted);
          width: fit-content;
        }
        .mobcal-pill.active {
          background: var(--primary-50);
          border-color: var(--primary-100);
          color: var(--primary);
          font-weight: 800;
        }
        .mobcal-hours { font-size: 11px; font-weight: 800; color: var(--text-muted); margin-top: 4px; }

        .daymodal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }
        .daymodal-date { display: flex; align-items: center; gap: 8px; font-weight: 900; }
        .daymodal-total {
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid var(--primary-100);
          background: var(--primary-50);
          color: var(--primary);
          font-weight: 900;
          font-size: 12.5px;
          display: inline-flex;
          gap: 6px;
          align-items: center;
        }

        /* Important: allow scroll inside the day modal if many activities */
        .daymodal-scroll {
          max-height: min(65vh, 520px);
          overflow: auto;
          padding-right: 2px;
        }
      `}</style>

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
                setForm({ ...EMPTY_FORM, startDate: toISODate(new Date()) });
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
                    {errors.subjectName && <div className="field-error">{errors.subjectName}</div>}
                  </div>

                  <div className="field">
                    <label className="label">{t("startDate")}</label>
                    <input
                      className={"input" + (errors.startDate ? " has-error" : "")}
                      type="date"
                      value={form.startDate}
                      onChange={(e) => set("startDate", e.target.value)}
                    />
                    {errors.startDate && <div className="field-error">{errors.startDate}</div>}
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
                    {errors.endTime && <div className="field-error">{errors.endTime}</div>}
                  </div>
                </div>

                <div className="field" style={{ marginTop: 12 }}>
                  <label className="label">{t("durationMinutes")}</label>
                  <div className="chip chip-primary">
                    <Clock3 size={13} /> {duration > 0 ? fmtDuration(duration) : "—"}
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
                  <button className="btn btn-accent" type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? t("update") : t("save")}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={cancelEdit}>
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
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          ) : items.length === 0 ? (
            <EmptyState icon={<BookMarked size={28} />} title={t("noActivityYet")} message={t("noActivityYetMsg")} />
          ) : (
            <>
              {/* ===============================
                  MOBILE: Calendar + Day Modal
                 =============================== */}
              {isMobile ? (
                <div className="mobcal-wrap">
                  <div className="mobcal-toolbar">
                    <div className="mobcal-nav">
                      <button className="mobcal-iconbtn" type="button" onClick={goPrevMonth} aria-label="Prev month">
                        <ChevronLeft size={18} />
                      </button>
                      <div className="mobcal-title">{monthLabel}</div>
                      <button className="mobcal-iconbtn" type="button" onClick={goNextMonth} aria-label="Next month">
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    <button className="btn btn-outline" type="button" onClick={goToday} style={{ padding: "8px 10px" }}>
                      <Calendar size={16} />
                      {lang === "si" ? "අද" : "Today"}
                    </button>
                  </div>

                  <div className="mobcal-weekdays">
                    {weekdayNames.map((w) => (
                      <div key={w} className="mobcal-weekday">
                        {w}
                      </div>
                    ))}
                  </div>

                  <div className="mobcal-grid">
                    {calendarDays.map((d) => {
                      const iso = toISODate(d);
                      const inThisMonth = d.getMonth() === monthCursor.getMonth();
                      const isToday = iso === toISODate(new Date());
                      const isSelected = iso === selectedDate;

                      const acts = byDate.get(iso) || [];
                      const totalMin = acts.reduce((sum, a) => sum + (Number(a.durationMinutes) || 0), 0);

                      return (
                        <button
                          key={iso}
                          type="button"
                          className={[
                            "mobcal-cell",
                            inThisMonth ? "" : "out",
                            isSelected ? "selected" : "",
                            isToday ? "today" : "",
                          ].join(" ")}
                          onClick={() => openDay(iso)}
                        >
                          <div className="mobcal-top">
                            <span className="mobcal-daynum">{d.getDate()}</span>
                          </div>

                          <div>
                            {acts.length > 0 ? (
                              <>
                                <div className="mobcal-pill active">{acts.length} act.</div>
                                <div className="mobcal-hours">{minutesToHoursText(totalMin)}</div>
                              </>
                            ) : (
                              <div className="mobcal-pill" style={{ opacity: 0.6 }}>
                                Free
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Day Modal (NOW includes Start/Edit/Stop functionality) */}
                  <Modal
                    open={dayModalOpen}
                    onClose={() => setDayModalOpen(false)}
                    title={t("activities")}
                    footer={
                      <>
                        <button className="btn btn-outline" type="button" onClick={() => setDayModalOpen(false)}>
                          {t("cancel")}
                        </button>
                        <button className="btn btn-accent" type="button" onClick={openCreateForSelectedDay}>
                          <Plus size={16} /> {lang === "si" ? "එදිනට එකතු කරන්න" : "Add for this day"}
                        </button>
                      </>
                    }
                  >
                    <div className="daymodal-head">
                      <div className="daymodal-date">
                        <Calendar size={16} />
                        <span>{selectedDate}</span>
                      </div>
                      {selectedTotalMinutes > 0 && (
                        <div className="daymodal-total">
                          <Clock3 size={14} />
                          {minutesToHoursText(selectedTotalMinutes)}
                        </div>
                      )}
                    </div>

                    {selectedActivities.length === 0 ? (
                      <div style={{ padding: 12, color: "var(--text-muted)" }}>
                        {lang === "si" ? "මෙම දිනයට කටයුතු නැත." : "No activities for this day."}
                      </div>
                    ) : (
                      <div className="daymodal-scroll">
                        <div className="activity-grid" style={{ gridTemplateColumns: "1fr" }}>
                          {selectedActivities.map((a) => (
                            <ActivityCard key={a.activityId} a={a} fromDayModal />
                          ))}
                        </div>
                      </div>
                    )}
                  </Modal>
                </div>
              ) : (
                /* ===============================
                   DESKTOP: same view as before
                =============================== */
                <div className="activities-list">
                  {grouped.map(([date, dayItems]) => (
                    <div key={date} className="day-section">
                      <div className="day-header">
                        <Calendar size={16} />
                        <span>{fmtDateHeader(date)}</span>
                      </div>

                      <div className="activity-grid">
                        {dayItems.map((a) => (
                          <ActivityCard key={a.activityId} a={a} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ===== Stop Session Modal ===== */}
        <Modal
          open={!!stopTarget}
          onClose={closeStopModal}
          title={t("sessionFeedbackTitle")}
          footer={
            <>
              <button type="button" className="btn btn-outline" onClick={closeStopModal} disabled={submittingStop}>
                {t("cancel")}
              </button>
              <button type="button" className="btn btn-accent" onClick={confirmStopActivity} disabled={submittingStop}>
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
                    stopTarget.actualStartAt ? (now - new Date(stopTarget.actualStartAt).getTime()) / 1000 : 0
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
                {feedbackError && <div className="field-error">{feedbackError}</div>}
              </div>
            </div>
          )}
        </Modal>
      </TrialGate>
    </Layout>
  );
}