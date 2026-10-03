import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  School,
  GraduationCap,
  Clock,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Printer,
  Star,
  CloudOff,
  Calendar,
  MessageSquare,
  X,
} from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import Stars from "../../components/Stars.jsx";
import { Avatar, StatCard, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function buildWeekSeries(activities, weekStartStr) {
  const start = new Date(weekStartStr + "T00:00:00");
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: toDateStr(d), label: DAY_LABELS[i], minutes: 0 };
  });
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  for (const a of activities) {
    if (byDate[a.startDate]) byDate[a.startDate].minutes += a.durationMinutes || 0;
  }
  return days.map((d) => ({ ...d, hours: +(d.minutes / 60).toFixed(2) }));
}

export default function Dashboard() {
  const { t } = useI18n();
  const toast = useToast();

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [child, setChild] = useState(null);
  const [activities, setActivities] = useState([]);
  const [draft, setDraft] = useState({});
  const [report, setReport] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const reportRef = useRef(null);

  // ✅ Mobile Activities Popup
  const isMobile = useMediaQuery("(max-width: 900px)");
  const [actsOpen, setActsOpen] = useState(false);

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const [d, acts, rep] = await Promise.all([
        api.get("/api/parent/me/dashboard"),
        api.get("/api/parent/me/activities"),
        api.get("/api/parent/me/weekly-report"),
      ]);
      setChild(d);
      setActivities(Array.isArray(acts) ? acts : []);
      setReport(rep);

      const dd = {};
      (acts || []).forEach(
        (a) => (dd[a.activityId] = { pRate: a.pRate || 0, pComment: a.pComment || "" })
      );
      setDraft(dd);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      setError(true);
      toast.show(err?.data?.message || "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close popup if leaving mobile
  useEffect(() => {
    if (!isMobile) setActsOpen(false);
  }, [isMobile]);

  // Body scroll lock + ESC close for popup
  useEffect(() => {
    if (!actsOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") setActsOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [actsOpen]);

  const weekSeries = useMemo(() => {
    if (!activities.length || !report) return [];
    return buildWeekSeries(activities, report.weekStart);
  }, [activities, report]);

  const todayMinutes = useMemo(() => {
    const today = toDateStr(new Date());
    return activities
      .filter((a) => a.startDate === today)
      .reduce((s, a) => s + (a.durationMinutes || 0), 0);
  }, [activities]);

  async function saveRating(activityId) {
    setSavingId(activityId);
    try {
      const payload = draft[activityId] || { pRate: 0, pComment: "" };
      await api.put(`/api/parent/me/activities/${activityId}/rate`, payload);
      toast.show("Feedback saved", "success");
      await load();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to save", "error");
    } finally {
      setSavingId(null);
    }
  }

  function printReport() {
    const node = reportRef.current;
    if (!node) return;
    const html = node.outerHTML;
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>SAMS Weekly Report</title>
          <style>
            body { font-family: "Noto Sans Sinhala", Arial, sans-serif; padding: 24px; color: #1e293b; }
            .wm { position: fixed; inset: 0; display: grid; place-items: center; opacity: 0.06; font-size: 64px; font-weight: 800; transform: rotate(-18deg); pointer-events: none; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #f1f5f9; font-size: 12px; font-weight: 600; }
            .legal { margin-top: 20px; font-size: 12px; background: #f8fafc; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 10px; color: #64748b; }
            h2 { margin: 0 0 12px; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="wm">${t("watermark")}</div>
          ${html}
          <div class="legal">${t("legalNote")}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  // Reusable Activities List (used in desktop inline + mobile popup)
  const ActivitiesContent = () => {
    if (activities.length === 0) {
      return (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="No activities yet"
          message="Your child's study activities will appear here once they start logging them."
        />
      );
    }

    return (
      <div className="stack" style={{ gap: 12 }}>
        {activities.slice(0, 12).map((a) => (
          <div
            key={a.activityId}
            style={{
              background: "var(--muted, #f8fafc)",
              border: "1px solid var(--border-soft, #e2e8f0)",
              borderRadius: 14,
              padding: "14px 16px",
            }}
          >
            {/* Activity header */}
            <div className="between" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--text, #0f172a)" }}>
                {a.subjectName}
              </div>
              <div className="center-v" style={{ gap: 8, flexWrap: "wrap" }}>
                <span
                  className="badge"
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {a.durationMinutes} min
                </span>
                <span className="faint" style={{ fontSize: 12 }}>
                  {a.startDate} · {a.startTime}–{a.endTime}
                </span>
              </div>
            </div>

            {a.description && (
              <p
                className="subtitle"
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.45,
                }}
              >
                {a.description}
              </p>
            )}

            <div style={{ height: 1, background: "var(--border-soft, #e2e8f0)", margin: "0 0 14px" }} />

            {/* Rating row */}
            <div className="pd-rateGrid">
              {/* Parent rating */}
              <div>
                <div
                  className="label"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#64748b",
                    marginBottom: 6,
                  }}
                >
                  {t("parentRate")}
                </div>

                <Stars
                  value={draft[a.activityId]?.pRate || 0}
                  onChange={(v) =>
                    setDraft((p) => ({
                      ...p,
                      [a.activityId]: { ...p[a.activityId], pRate: v },
                    }))
                  }
                />

                <textarea
                  className="textarea mt-2"
                  placeholder={t("comment")}
                  rows={2}
                  value={draft[a.activityId]?.pComment || ""}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      [a.activityId]: {
                        ...p[a.activityId],
                        pComment: e.target.value,
                      },
                    }))
                  }
                  style={{
                    fontSize: 13,
                    borderRadius: 10,
                    resize: "vertical",
                    minHeight: 56,
                  }}
                />

                <button
                  className="btn btn-sm mt-2"
                  type="button"
                  onClick={() => saveRating(a.activityId)}
                  disabled={savingId === a.activityId}
                  style={{ minWidth: 88 }}
                >
                  {savingId === a.activityId ? "Saving…" : t("save")}
                </button>
              </div>

              {/* Teacher rating */}
              <div>
                <div
                  className="label"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "#64748b",
                    marginBottom: 6,
                  }}
                >
                  {t("teacherRate")}
                </div>

                {a.tRate ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      borderRadius: 999,
                      padding: "5px 10px",
                      fontSize: 13,
                      fontWeight: 600,
                      flexWrap: "wrap",
                    }}
                  >
                    <Star size={12} fill="currentColor" />
                    {a.tRate}/5
                    {a.tComment && (
                      <span style={{ fontWeight: 500, opacity: 0.9 }}>
                        · “{a.tComment}”
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="center-v" style={{ gap: 6, color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
                    <MessageSquare size={14} />
                    Not rated yet
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout
      title={t("dashboard")}
      subtitle={child ? `${child.studentName}'s learning progress` : undefined}
      actions={
        report && (
          <button className="btn btn-outline btn-sm" type="button" onClick={printReport}>
            <Printer size={15} strokeWidth={2} />
            {t("downloadPdf")}
          </button>
        )
      }
    >
      <style>{`
        .pd-wrap{
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Stats grid: 4 -> 2 -> 1 */
        .pd-stats{
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
          gap: 14px;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          align-items: stretch;
        }
        .pd-stats > *{ min-width: 0; height: 100%; }

        /* Chart + Activities: two columns on desktop, one column on mobile */
        .pd-main{
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
          width: 100%;
        }
        @media (max-width: 900px){
          .pd-main{ grid-template-columns: 1fr; }
        }

        /* Header card: spacing adjustments for small screens */
        @media (max-width: 520px){
          .pd-hero{ padding: 18px 16px !important; }
          .pd-heroName{ font-size: 18px !important; }
        }

        /* Activities panel: desktop scroll box */
        .pd-acts{
          max-height: 520px;
          overflow: auto;
        }
        @media (max-width: 900px){
          .pd-acts{ max-height: none; overflow: visible; }
        }

        /* Parent/Teacher rating grid inside an activity card */
        .pd-rateGrid{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px){
          .pd-rateGrid{ grid-template-columns: 1fr; }
        }

        /* Make long text wrap safely */
        .pd-acts .between{ flex-wrap: wrap; gap: 8px; }
        .pd-acts textarea{ width: 100%; box-sizing: border-box; }

        /* ===== Mobile Activities Modal (bottom sheet) ===== */
        .pd-modalOverlay{
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding: 12px;
          z-index: 9999;
          box-sizing: border-box;
        }
        .pd-modal{
          width: min(720px, 100%);
          max-height: 85dvh;
          background: #fff;
          border: 1px solid var(--border-soft, #e2e8f0);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          box-sizing: border-box;
        }
        .pd-modalHeader{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-soft, #e2e8f0);
          box-sizing: border-box;
        }
        .pd-modalTitle{
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
        }
        .pd-iconBtn{
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid var(--border-soft, #e2e8f0);
          background: #fff;
          display: grid;
          place-items: center;
        }
        .pd-modalBody{
          padding: 12px 14px;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          max-height: calc(85dvh - 58px);
          box-sizing: border-box;
        }
      `}</style>

      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="pd-wrap">
            <Skeleton height={120} radius={18} />
            <div className="pd-stats">
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
            </div>
            <div className="pd-main">
              <Skeleton height={280} radius={18} />
              <Skeleton height={280} radius={18} />
            </div>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <ErrorState
              icon={<CloudOff size={28} />}
              title={t("couldntLoad")}
              onRetry={load}
              retryLabel={t("tryAgain")}
            />
          </div>
        ) : (
          <div className="pd-wrap">
            {/* ── Student Welcome Header ── */}
            <div
              className="card pd-hero"
              style={{
                background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 55%, #3b82f6 100%)",
                color: "#fff",
                border: "none",
                padding: "22px 26px",
                borderRadius: 18,
                boxShadow: "0 10px 30px -8px rgba(37, 99, 235, 0.35)",
              }}
            >
              <div className="center-v" style={{ gap: 18, flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid rgba(255,255,255,0.35)",
                    flexShrink: 0,
                  }}
                >
                  <Avatar name={child?.studentName} size="lg" />
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    className="pd-heroName"
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      marginBottom: 6,
                    }}
                  >
                    {child?.studentName}
                  </div>

                  <div
                    className="center-v"
                    style={{
                      gap: 14,
                      fontSize: 13.5,
                      color: "rgba(255,255,255,0.88)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="center-v" style={{ gap: 6 }}>
                      <School size={14} strokeWidth={2} />
                      {child?.school}
                    </span>
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.5)",
                      }}
                    />
                    <span className="center-v" style={{ gap: 6 }}>
                      <GraduationCap size={14} strokeWidth={2} />
                      {child?.grade} {child?.className}
                    </span>
                  </div>
                </div>

                {report?.weekStart && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 12.5,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Calendar size={14} />
                    Week of {report.weekStart}
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats Row ── */}
            {report && (
              <div className="pd-stats">
                <StatCard
                  icon={<Clock size={18} strokeWidth={2} />}
                  label="Hours today"
                  value={`${(todayMinutes / 60).toFixed(1)}h`}
                />
                <StatCard
                  icon={<TrendingUp size={18} strokeWidth={2} />}
                  label={t("avgHoursPerDay")}
                  value={`${report.avgHoursPerDay}h`}
                />
                <StatCard
                  icon={
                    report.changePercentVsLastWeek >= 0 ? (
                      <TrendingUp size={18} strokeWidth={2} />
                    ) : (
                      <TrendingDown size={18} strokeWidth={2} />
                    )
                  }
                  label={t("changeVsLastWeek")}
                  value={`${report.changePercentVsLastWeek}%`}
                />
                <StatCard
                  icon={<BookOpen size={18} strokeWidth={2} />}
                  label={t("mostSpentSubject")}
                  value={report.mostSpentSubject || "—"}
                />
              </div>
            )}

            {/* ── Chart + Activities ── */}
            <div className="pd-main">
              {/* Weekly Progress Chart */}
              {weekSeries.length > 0 && (
                <div
                  className="card"
                  style={{
                    padding: "20px 22px",
                    borderRadius: 16,
                    border: "1px solid var(--border-soft, #e2e8f0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="between" style={{ marginBottom: 16, alignItems: "flex-start" }}>
                    <div>
                      <div className="h2" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                        {t("weeklyProgress")}
                      </div>
                      <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
                        Study hours this week
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weekSeries} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border-soft, #e2e8f0)" strokeDasharray="3 3" />
                      <XAxis dataKey="label" fontSize={12} axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                      <YAxis fontSize={12} axisLine={false} tickLine={false} width={36} tick={{ fill: "#64748b" }} />
                      <Tooltip
                        cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                        formatter={(v) => [`${v}h`, "Hours"]}
                      />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={42} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Recent Activities */}
              <div
                className="card pd-acts"
                style={{
                  padding: "20px 22px",
                  borderRadius: 16,
                  border: "1px solid var(--border-soft, #e2e8f0)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div className="h2" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {t("activities")}
                  </div>
                  <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
                    Rate and comment on recent study sessions
                  </div>
                </div>

                {/* ✅ MOBILE: button opens popup */}
                {isMobile ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-block"
                      onClick={() => setActsOpen(true)}
                      style={{ height: 44, fontWeight: 800, borderRadius: 12 }}
                    >
                      {t("activities")} ({Math.min(12, activities.length)}/{activities.length})
                    </button>

                    {actsOpen && (
                      <div className="pd-modalOverlay" onClick={() => setActsOpen(false)} role="presentation">
                        <div
                          className="pd-modal"
                          onClick={(e) => e.stopPropagation()}
                          role="dialog"
                          aria-modal="true"
                        >
                          <div className="pd-modalHeader">
                            <div className="pd-modalTitle">{t("activities")}</div>
                            <button
                              type="button"
                              className="pd-iconBtn"
                              onClick={() => setActsOpen(false)}
                              aria-label="Close"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="pd-modalBody">
                            <ActivitiesContent />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ✅ DESKTOP: keep inline list */
                  <ActivitiesContent />
                )}
              </div>
            </div>

            {/* Hidden printable summary */}
            <div style={{ display: "none" }}>
              <div ref={reportRef} className="watermarkBox">
                <div className="watermarkText">{t("watermark")}</div>
                {report && (
                  <>
                    <div className="badge">Week start: {report.weekStart}</div>
                    <div>
                      <b>{t("mostSpentSubject")}:</b> {report.mostSpentSubject || "-"} ({report.mostSpentHours} h)
                    </div>
                    <div>
                      <b>Least spent subject:</b> {report.leastSpentSubject || "-"} ({report.leastSpentHours} h)
                    </div>
                    <div>
                      <b>{t("avgHoursPerDay")}:</b> {report.avgHoursPerDay}
                    </div>
                    <div>
                      <b>{t("changeVsLastWeek")}:</b> {report.changePercentVsLastWeek}%
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);

    mq.addEventListener?.("change", handler);
    mq.addListener?.(handler); // Safari fallback

    return () => {
      mq.removeEventListener?.("change", handler);
      mq.removeListener?.(handler);
    };
  }, [query]);

  return matches;
}