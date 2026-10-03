import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  AlignLeft,
  Coffee,
} from "lucide-react";

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

function minutesToHoursText(min) {
  if (!min) return "0h";
  const h = min / 60;
  return `${h.toFixed(1)}h`;
}

export default function Calendar() {
  const { t, lang } = useI18n();
  const toast = useToast();

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");

  const [loading, setLoading] = useState(true);
  const [allActivities, setAllActivities] = useState([]);

  // current month pointer
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));

  async function load() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);

    try {
      const d = await api.get("/api/student/me/activities");
      setAllActivities(Array.isArray(d) ? d : []);
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group activities by date
  const byDate = useMemo(() => {
    const map = new Map();
    for (const a of allActivities) {
      const day = a.startDate; // backend already returns YYYY-MM-DD
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(a);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((x, y) => (x.startTime || "").localeCompare(y.startTime || ""));
      map.set(k, arr);
    }
    return map;
  }, [allActivities]);

  const monthLabel = useMemo(() => {
    const locale = lang === "si" ? "si-LK" : "en-GB";
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(monthCursor);
  }, [monthCursor, lang]);

  const calendarDays = useMemo(() => {
    const mStart = startOfMonth(monthCursor);
    const mEnd = endOfMonth(monthCursor);

    const gridStart = addDays(mStart, -weekdayMon0(mStart)); // Monday start
    const gridEnd = addDays(mEnd, 6 - weekdayMon0(mEnd)); // Sunday end

    const days = [];
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [monthCursor]);

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
    const now = new Date();
    setMonthCursor(now);
    setSelectedDate(toISODate(now));
  }

  const weekdayNames = useMemo(() => {
    return lang === "si"
      ? ["සඳු", "අඟ", "බදා", "බ්‍රහ", "සිකු", "සෙන", "ඉරි"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }, [lang]);

  return (
    <Layout title={t("calendar")}>
      <style>{`
        .cal-wrapper {
          --cal-border: var(--border);
          --cal-border-soft: var(--border-soft);
          --cal-bg: var(--surface);
          --cal-hover: var(--surface-hover);

          --cal-primary: var(--primary);
          --cal-primary-50: var(--primary-50);
          --cal-primary-100: var(--primary-100);

          --cal-text: var(--ink);
          --cal-text-muted: var(--text-muted);

          --cal-radius: var(--radius-lg);

          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Toolbar */
        .cal-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--cal-bg);
          border: 1px solid var(--cal-border);
          border-radius: var(--cal-radius);
          padding: 16px 20px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-xs);
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cal-month-nav {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }
        .cal-month-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--cal-text);
          min-width: 0; /* important for small screens */
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cal-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--cal-border);
          background: var(--cal-bg);
          color: var(--cal-text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 0 0 auto;
        }
        .cal-icon-btn:hover {
          background: var(--cal-hover);
          color: var(--cal-primary);
          border-color: var(--cal-primary);
        }

        /* Layout Grid */
        .cal-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          flex-wrap: wrap;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cal-grid-panel {
          flex: 1.5 1 500px;
          background: var(--cal-bg);
          border: 1px solid var(--cal-border);
          border-radius: var(--cal-radius);
          padding: 24px;
          box-shadow: var(--shadow-xs);
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cal-side-panel {
          flex: 1 1 340px;
          background: var(--cal-bg);
          border: 1px solid var(--cal-border);
          border-radius: var(--cal-radius);
          padding: 24px;
          box-shadow: var(--shadow-xs);
          position: sticky;
          top: 24px;
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Calendar Grid Cells
           FIX: use minmax(0,1fr) so 7 columns ALWAYS fit (Sunday won't cut off) */
        .cal-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 12px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cal-weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: var(--cal-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 10px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .cal-cell {
          min-width: 0; /* critical: allow shrinking inside grid */
          position: relative;
          background: var(--cal-bg);
          border: 1px solid var(--cal-border);
          border-radius: 12px;
          min-height: 92px;
          padding: 10px;
          cursor: pointer;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .cal-cell:hover {
          border-color: var(--cal-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
        .cal-cell.out-of-month {
          opacity: 0.45;
          background: var(--cal-hover);
        }
        .cal-cell.is-selected {
          border-color: var(--cal-primary);
          background: var(--cal-primary-50);
          box-shadow: inset 0 0 0 1px var(--cal-primary-100);
        }
        .cal-cell.is-today .cal-date-num {
          background: var(--cal-primary);
          color: #fff;
        }
        .cal-date-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 14px;
          color: var(--cal-text);
          flex: 0 0 auto;
        }

        /* Badges (prevent overflow in small columns) */
        .cal-pill {
          display: inline-flex;
          align-items: center;
          font-size: 11.5px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 999px;
          background: var(--cal-hover);
          color: var(--cal-text-muted);
          margin-top: 8px;
          width: fit-content;
          border: 1px solid var(--cal-border-soft);

          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .cal-pill.active {
          background: var(--cal-primary-50);
          color: var(--cal-primary);
          border: 1px solid var(--cal-primary-100);
        }

        /* Day Details */
        .cal-day-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--cal-border);
          gap: 10px;
          flex-wrap: wrap;
        }
        .cal-day-title {
          font-size: 18px;
          font-weight: 900;
          color: var(--cal-text);
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .cal-stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--cal-primary-50);
          color: var(--cal-primary);
          border: 1px solid var(--cal-primary-100);
          padding: 6px 12px;
          border-radius: 10px;
          font-weight: 900;
          font-size: 13px;
          flex: 0 0 auto;
        }

        /* Activity Cards */
        .cal-act-list { display: flex; flex-direction: column; gap: 12px; }
        .cal-act-card {
          background: var(--cal-bg);
          border: 1px solid var(--cal-border);
          border-left: 4px solid var(--cal-primary);
          border-radius: 12px;
          padding: 16px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .cal-act-card:hover { transform: translateX(4px); border-color: var(--cal-primary); }
        .cal-act-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .cal-act-subject {
          font-size: 15px;
          font-weight: 900;
          color: var(--cal-text);
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .cal-act-time {
          font-size: 12.5px;
          color: var(--cal-text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .cal-act-desc {
          font-size: 13.5px;
          color: var(--cal-text-muted);
          line-height: 1.5;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed var(--cal-border);
          word-break: break-word;
        }

        /* Empty State */
        .cal-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--cal-text-muted);
        }
        .cal-empty svg { opacity: 0.35; margin-bottom: 12px; }

        /* ===========================
           MOBILE RESPONSIVE FIXES
           =========================== */
        @media (max-width: 900px) {
          .cal-toolbar {
            padding: 12px 12px;
            gap: 12px;
          }
          .cal-month-nav { gap: 10px; width: 100%; justify-content: space-between; }
          .cal-month-title { font-size: 15px; flex: 1; }

          /* stack panels (calendar on top, details below) */
          .cal-layout { flex-direction: column; gap: 16px; }
          .cal-grid-panel { padding: 14px; }
          .cal-side-panel {
            padding: 14px;
            position: static;  /* sticky is not good on mobile */
            top: auto;
          }

          /* smaller gaps so 7 columns fit */
          .cal-weekdays, .cal-grid { gap: 6px; }

          /* smaller cells on phone */
          .cal-cell {
            min-height: 70px;
            padding: 8px;
            border-radius: 12px;
          }
          .cal-weekday { font-size: 11px; letter-spacing: 0.2px; }
          .cal-date-num { width: 26px; height: 26px; border-radius: 8px; font-size: 13px; }
          .cal-pill { font-size: 10.5px; padding: 3px 7px; margin-top: 6px; }
        }

        /* extra small phones */
        @media (max-width: 380px) {
          .cal-grid-panel, .cal-side-panel { padding: 12px; }
          .cal-weekdays, .cal-grid { gap: 5px; }
          .cal-cell { padding: 7px; min-height: 64px; }
          .cal-month-title { font-size: 14px; }
        }
      `}</style>

      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="cal-wrapper">
          <h1 className="h1" style={{ marginBottom: 20 }}>
            {t("calendar")}
          </h1>

          {/* Top Toolbar */}
          <div className="cal-toolbar">
            <div className="cal-month-nav">
              <button
                className="cal-icon-btn"
                onClick={goPrevMonth}
                type="button"
                aria-label={lang === "si" ? "පෙර" : "Prev month"}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="cal-month-title">{monthLabel}</div>

              <button
                className="cal-icon-btn"
                onClick={goNextMonth}
                type="button"
                aria-label={lang === "si" ? "ඊළඟ" : "Next month"}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <button className="btn btn-outline" style={{ gap: 8 }} onClick={goToday} type="button">
              <CalendarIcon size={16} />
              {lang === "si" ? "අදට යන්න" : "Today"}
            </button>
          </div>

          {loading ? (
            <div className="badge" style={{ padding: 20, textAlign: "center" }}>
              {lang === "si" ? "පූරණය වෙමින්..." : "Loading calendar..."}
            </div>
          ) : (
            <div className="cal-layout">
              {/* Calendar Grid View */}
              <div className="cal-grid-panel">
                <div className="cal-weekdays">
                  {weekdayNames.map((w) => (
                    <div key={w} className="cal-weekday">
                      {w}
                    </div>
                  ))}
                </div>

                <div className="cal-grid">
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
                        onClick={() => setSelectedDate(iso)}
                        className={[
                          "cal-cell",
                          inThisMonth ? "in-month" : "out-of-month",
                          isSelected ? "is-selected" : "",
                          isToday ? "is-today" : "",
                        ].join(" ")}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <span className="cal-date-num">{d.getDate()}</span>
                        </div>

                        <div>
                          {acts.length > 0 ? (
                            <div className="cal-pill active">
                              {acts.length} {lang === "si" ? "කටයුතු" : "act."}
                            </div>
                          ) : (
                            <div className="cal-pill" style={{ opacity: 0.55 }}>
                              {lang === "si" ? "නිදහස්" : "Free"}
                            </div>
                          )}

                          {acts.length > 0 && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                                marginTop: 4,
                                fontWeight: 700,
                              }}
                            >
                              {minutesToHoursText(totalMin)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day Details / Schedule Side Panel */}
              <div className="cal-side-panel">
                <div className="cal-day-header">
                  <div className="cal-day-title">
                    <CalendarIcon size={20} color="var(--primary)" />
                    {selectedDate}
                  </div>

                  {selectedTotalMinutes > 0 && (
                    <div className="cal-stat-badge">
                      <Clock size={15} />
                      {minutesToHoursText(selectedTotalMinutes)}
                    </div>
                  )}
                </div>

                {selectedActivities.length === 0 ? (
                  <div className="cal-empty">
                    <Coffee size={48} />
                    <h3 style={{ fontSize: 16, color: "var(--ink)", margin: "16px 0 8px" }}>
                      {lang === "si" ? "කිසිදු කාර්යයක් නොමැත" : "No activities scheduled"}
                    </h3>
                    <p style={{ fontSize: 13, margin: 0 }}>
                      {lang === "si"
                        ? "ඔබට මෙම දිනය සඳහා කිසිදු කාර්යයක් සැලසුම් කර නොමැත."
                        : "Enjoy your free time, or schedule something new!"}
                    </p>
                  </div>
                ) : (
                  <div className="cal-act-list">
                    {selectedActivities.map((a) => (
                      <div key={a.activityId} className="cal-act-card">
                        <div className="cal-act-top">
                          <div className="cal-act-subject">
                            <BookOpen size={16} color="var(--primary)" />
                            {a.subjectName}
                          </div>
                          <div className="badge">{a.durationMinutes}m</div>
                        </div>

                        <div className="cal-act-time">
                          <Clock size={13} />
                          {a.startTime} – {a.endTime}
                        </div>

                        {a.description ? (
                          <div className="cal-act-desc">
                            <AlignLeft size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
                            {a.description}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </TrialGate>
    </Layout>
  );
}