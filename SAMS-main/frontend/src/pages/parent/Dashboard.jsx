import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { School, GraduationCap, Clock, BookOpen, TrendingUp, TrendingDown, Printer, Star, CloudOff } from "lucide-react";
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

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const [d, acts, rep] = await Promise.all([
        api.get("/api/parent/me/dashboard"),
        api.get("/api/parent/me/activities"),
        api.get("/api/parent/me/weekly-report")
      ]);
      setChild(d);
      setActivities(acts);
      setReport(rep);
      const dd = {};
      acts.forEach((a) => (dd[a.activityId] = { pRate: a.pRate || 0, pComment: a.pComment || "" }));
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekSeries = useMemo(() => {
    if (!activities.length || !report) return [];
    return buildWeekSeries(activities, report.weekStart);
  }, [activities, report]);

  const todayMinutes = useMemo(() => {
    const today = toDateStr(new Date());
    return activities.filter((a) => a.startDate === today).reduce((s, a) => s + (a.durationMinutes || 0), 0);
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
            body { font-family: "Noto Sans Sinhala", Arial; padding: 16px; }
            .wm { position: fixed; inset: 0; display: grid; place-items: center; opacity: 0.08; font-size: 56px; font-weight: 800; transform: rotate(-18deg); }
            .card { border: 1px solid #d6e2f0; border-radius: 12px; padding: 14px; }
            .badge { display: inline-block; padding: 4px 8px; border: 1px solid #d6e2f0; border-radius: 999px; background: #f3f6fb; font-size: 12px; }
            .legal { margin-top: 12px; font-size: 12px; background: #f3f6fb; padding: 10px; border: 1px dashed #ccc; border-radius: 10px; }
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

  return (
    <Layout
      title={t("dashboard")}
      subtitle={child ? `${child.studentName}'s progress` : undefined}
      actions={report && (
        <button className="btn btn-outline btn-sm" type="button" onClick={printReport}>
          <Printer size={14} /> {t("downloadPdf")}
        </button>
      )}
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="stack">
            <Skeleton height={110} radius={16} />
            <div className="grid grid-4"><Skeleton height={90} radius={16} /><Skeleton height={90} radius={16} /><Skeleton height={90} radius={16} /><Skeleton height={90} radius={16} /></div>
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          </div>
        ) : (
          <div className="stack" style={{ gap: 20 }}>
            {/* Calm welcome card */}
            <div className="card card-pad-lg" style={{ background: "linear-gradient(135deg, var(--info), var(--primary))", color: "#fff", border: "none" }}>
              <div className="center-v" style={{ gap: 14 }}>
                <Avatar name={child?.studentName} size="lg" />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{child?.studentName}</div>
                  <div className="center-v" style={{ gap: 12, fontSize: 13.5, color: "rgba(255,255,255,0.85)", flexWrap: "wrap" }}>
                    <span className="center-v" style={{ gap: 4 }}><School size={13} /> {child?.school}</span>
                    <span className="center-v" style={{ gap: 4 }}><GraduationCap size={13} /> {child?.grade} {child?.className}</span>
                  </div>
                </div>
              </div>
            </div>

            {report && (
              <div className="grid grid-4">
                <StatCard icon={<Clock size={18} />} label="Hours today" value={`${(todayMinutes / 60).toFixed(1)}h`} />
                <StatCard icon={<TrendingUp size={18} />} label={t("avgHoursPerDay")} value={`${report.avgHoursPerDay}h`} />
                <StatCard
                  icon={report.changePercentVsLastWeek >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                  label={t("changeVsLastWeek")}
                  value={`${report.changePercentVsLastWeek}%`}
                />
                <StatCard icon={<BookOpen size={18} />} label={t("mostSpentSubject")} value={report.mostSpentSubject || "-"} />
              </div>
            )}

            {weekSeries.length > 0 && (
              <div className="card">
                <div className="h2">{t("weeklyProgress")}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={weekSeries}>
                    <CartesianGrid vertical={false} stroke="var(--border-soft)" />
                    <XAxis dataKey="label" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} width={32} />
                    <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
                    <Bar dataKey="hours" fill="var(--info)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card">
              <div className="h2">{t("activities")}</div>
              {activities.length === 0 ? (
                <EmptyState icon={<BookOpen size={20} />} title="No activities yet" message="Your child's study activities will show up here once they start logging them." />
              ) : (
                <div className="stack" style={{ gap: 12 }}>
                  {activities.slice(0, 12).map((a) => (
                    <div key={a.activityId} className="card card-flat" style={{ background: "var(--muted)" }}>
                      <div className="between" style={{ flexWrap: "wrap", gap: 8 }}>
                        <div className="h3">{a.subjectName}</div>
                        <div className="center-v" style={{ gap: 6 }}>
                          <span className="badge">{a.durationMinutes} min</span>
                          <span className="faint" style={{ fontSize: 12 }}>{a.startDate} · {a.startTime}–{a.endTime}</span>
                        </div>
                      </div>
                      {a.description && <p className="subtitle mt-2">{a.description}</p>}

                      <hr />
                      <div className="row">
                        <div className="col">
                          <div className="label">{t("parentRate")}</div>
                          <Stars
                            value={draft[a.activityId]?.pRate || 0}
                            onChange={(v) => setDraft((p) => ({ ...p, [a.activityId]: { ...p[a.activityId], pRate: v } }))}
                          />
                          <textarea
                            className="textarea mt-2"
                            placeholder={t("comment")}
                            value={draft[a.activityId]?.pComment || ""}
                            onChange={(e) => setDraft((p) => ({ ...p, [a.activityId]: { ...p[a.activityId], pComment: e.target.value } }))}
                          />
                          <button
                            className="btn btn-sm mt-2"
                            type="button"
                            onClick={() => saveRating(a.activityId)}
                            disabled={savingId === a.activityId}
                          >
                            {savingId === a.activityId ? "Saving…" : t("save")}
                          </button>
                        </div>
                        <div className="col">
                          <div className="label">{t("teacherRate")}</div>
                          {a.tRate ? (
                            <span className="badge badge-primary"><Star size={11} /> {a.tRate}/5 {a.tComment ? `· "${a.tComment}"` : ""}</span>
                          ) : (
                            <span className="faint" style={{ fontSize: 12.5 }}>Not rated yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* hidden printable summary */}
            <div style={{ display: "none" }}>
              <div ref={reportRef} className="watermarkBox">
                <div className="watermarkText">{t("watermark")}</div>
                {report && (
                  <>
                    <div className="badge">Week start: {report.weekStart}</div>
                    <div><b>{t("mostSpentSubject")}:</b> {report.mostSpentSubject || "-"} ({report.mostSpentHours} h)</div>
                    <div><b>Least spent subject:</b> {report.leastSpentSubject || "-"} ({report.leastSpentHours} h)</div>
                    <div><b>{t("avgHoursPerDay")}:</b> {report.avgHoursPerDay}</div>
                    <div><b>{t("changeVsLastWeek")}:</b> {report.changePercentVsLastWeek}%</div>
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
