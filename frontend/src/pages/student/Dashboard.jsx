import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Clock, TrendingUp, BookOpen, Flame, PlusCircle, FileBarChart2, QrCode, CloudOff } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { ProgressRing, StatCard, SkeletonCards, Skeleton, EmptyState, ErrorState } from "../../components/ui.jsx";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 17) return "goodAfternoon";
  return "goodEvening";
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

/** Builds Mon-Sun hours for the given week from the raw activities list (real data only). */
function buildWeekSeries(activities, weekStartStr) {
  const start = new Date(weekStartStr + "T00:00:00");
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: toDateStr(d), label: DAY_LABELS[i], minutes: 0 };
  });
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  for (const a of activities) {
    if (byDate[a.startDate]) {
      byDate[a.startDate].minutes += a.durationMinutes || 0;
    }
  }
  return days.map((d) => ({ ...d, hours: +(d.minutes / 60).toFixed(2) }));
}

/** Consecutive-day streak counting backward from today, based on real activity dates only. */
function computeStreak(activities) {
  const dates = new Set(activities.map((a) => a.startDate));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = toDateStr(cursor);
    if (dates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function Dashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const [dash, week, acts] = await Promise.all([
        api.get("/api/student/me/dashboard"),
        api.get("/api/student/me/weekly-report"),
        api.get("/api/student/me/activities"),
      ]);
      setData(dash);
      setWeekly(week);
      setActivities(acts);
      if (dash?.studentName) localStorage.setItem("displayName", dash.studentName);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      setError(true);
      toast.show(err?.data?.message || t("couldntLoad"), "error");
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
    if (!activities || !weekly) return [];
    return buildWeekSeries(activities, weekly.weekStart);
  }, [activities, weekly]);

  const todayMinutes = useMemo(() => {
    if (!activities) return 0;
    const today = toDateStr(new Date());
    return activities
      .filter((a) => a.startDate === today)
      .reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  }, [activities]);

  const streak = useMemo(() => (activities ? computeStreak(activities) : 0), [activities]);

  const subjectRows = useMemo(() => {
    if (!weekly?.hoursBySubject) return [];
    const entries = Object.entries(weekly.hoursBySubject);
    const max = Math.max(1, ...entries.map(([, h]) => h));
    return entries
      .sort((a, b) => b[1] - a[1])
      .map(([name, hours]) => ({ name, hours, pct: (hours / max) * 100 }));
  }, [weekly]);

  const hasAnyActivity = (activities?.length || 0) > 0;

  const QUICK_ACTIONS = [
    { label: t("logActivity"), icon: PlusCircle, onClick: () => nav("/student/activities"), primary: true },
    { label: t("viewReport"), icon: FileBarChart2, onClick: () => nav("/student/report") },
    { label: t("leaderboard"), icon: TrendingUp, onClick: () => nav("/student/leaderboard") },
    { label: t("findMyTeacher"), icon: QrCode, onClick: () => nav("/student/map-teacher") },
  ];

  return (
    <Layout title={t("dashboard")} subtitle={data?.studentName ? `${data.studentName}` : undefined}>
      <style>{`
        .db-wrap { display: flex; flex-direction: column; gap: 20px; }

        /* ---- Hero ---- */
        .db-hero {
          position: relative;
          overflow: hidden;
          border: none;
          border-radius: 18px;
          padding: 28px 30px;
          background: linear-gradient(135deg, #1D4ED8 0%, #14306B 100%);
          color: #fff;
        }
        .db-hero-decor {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          pointer-events: none;
        }
        .db-hero-decor-2 {
          position: absolute;
          bottom: -70px;
          right: 110px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          pointer-events: none;
        }
        .db-hero-row { position: relative; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .db-hero-greeting { font-size: 21px; font-weight: 800; margin-bottom: 4px; }
        .db-hero-sub { font-size: 14px; color: rgba(255,255,255,0.85); }
        .db-hero-streak {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* ---- Top row: today's focus + quick actions, equal height ---- */
        .db-toprow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 20px;
          align-items: stretch;
        }
        @media (max-width: 860px) {
          .db-toprow { grid-template-columns: 1fr; }
        }
        .db-card { display: flex; flex-direction: column; height: 100%; }
        .db-focus-body { display: flex; align-items: center; gap: 24px; flex: 1; flex-wrap: wrap; }
        .db-focus-stats { display: flex; flex-direction: column; gap: 12px; min-width: 140px; }
        .db-focus-num { font-size: 22px; font-weight: 800; color: var(--ink); line-height: 1.1; }
        .db-focus-num-sub { font-size: 14px; font-weight: 700; color: var(--ink); line-height: 1.1; }

        .db-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          flex: 1;
        }
        @media (max-width: 420px) {
          .db-actions-grid { grid-template-columns: 1fr; }
        }
        .db-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 100%;
          min-height: 52px;
          padding: 12px 14px;
          border-radius: 11px;
          font-size: 13.5px;
          font-weight: 600;
          border: 1.5px solid #DCE3F0;
          background: #FBFCFE;
          color: #14306B;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;
        }
        .db-action-btn:hover { border-color: #93C5FD; background: #EFF4FE; }
        .db-action-btn:active { transform: translateY(1px); }
        .db-action-btn.primary {
          background: #1D4ED8;
          border-color: #1D4ED8;
          color: #fff;
        }
        .db-action-btn.primary:hover { background: #1741B8; }

        /* ---- Stat cards (FIXED mobile responsiveness) ---- */
        .db-stats-grid {
          display: grid;
          /* auto-fit makes it adapt smoothly at any screen width */
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          align-items: stretch;
        }
        /* prevent long text inside cards from forcing horizontal overflow */
        .db-stats-grid > * { height: 100%; min-width: 0; }

        /* On very small phones, reduce gap a bit */
        @media (max-width: 360px) {
          .db-stats-grid { gap: 12px; }
        }

        /* ---- Charts row ---- */
        .db-charts-row {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 20px;
          align-items: stretch;
        }
        @media (max-width: 900px) {
          .db-charts-row { grid-template-columns: 1fr; }
        }
        .db-subject-list { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
      `}</style>

      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="db-wrap">
            <Skeleton height={120} radius={16} />
            <SkeletonCards count={4} />
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState
              icon={<CloudOff size={22} />}
              title={t("couldntLoad")}
              onRetry={load}
              retryLabel={t("tryAgain")}
            />
          </div>
        ) : (
          <div className="db-wrap">
            {/* Welcome hero */}
            <div className="db-hero enter">
              <div className="db-hero-decor" />
              <div className="db-hero-decor-2" />
              <div className="db-hero-row">
                <div>
                  <div className="db-hero-greeting">
                    {t(greetingKey())}{data?.studentName ? `, ${data.studentName.split(" ")[0]}` : ""} 👋
                  </div>
                  <div className="db-hero-sub">{t("readyMessage")}</div>
                </div>
                {streak > 0 && (
                  <div className="db-hero-streak">
                    <Flame size={14} /> {streak} {t("daysInARow")}
                  </div>
                )}
              </div>
            </div>

            {/* Today's focus + Quick actions */}
            <div className="db-toprow">
              <div className="card card-hover enter db-card">
                <div className="h2">{t("todaysFocus")}</div>
                <div className="db-focus-body">
                  <ProgressRing
                    value={data?.avgHoursPerDay || 0}
                    max={Math.max(data?.avgHoursPerDay || 0, weekly?.bestAvg || 1, 0.5)}
                    label={t("weeklyAverage")}
                    sub={t("yourBest")}
                  />
                  <div className="db-focus-stats">
                    <div>
                      <div className="db-focus-num">{(todayMinutes / 60).toFixed(1)}h</div>
                      <div className="stat-label">{t("hoursToday")}</div>
                    </div>
                    <div>
                      <div className="db-focus-num-sub">{data?.avgHoursPerDay ?? 0}h / day</div>
                      <div className="stat-label">{t("weeklyAverage")}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-hover enter db-card">
                <div className="h2">{t("quickActions")}</div>
                <div className="db-actions-grid">
                  {QUICK_ACTIONS.map((a) => {
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.label}
                        type="button"
                        className={"db-action-btn" + (a.primary ? " primary" : "")}
                        onClick={a.onClick}
                      >
                        <Icon size={17} /> {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="db-stats-grid">
              <StatCard
                icon={<Clock size={18} />}
                label={t("weeklyAverage")}
                value={`${data?.avgHoursPerDay ?? 0}h`}
                trend={data?.changePercentVsLastWeek}
              />
              <StatCard
                icon={<BookOpen size={18} />}
                label={t("mostSpentSubject")}
                value={data?.mostSpentSubject || "-"}
                accent
              />
              <StatCard
                icon={<Flame size={18} />}
                label={t("studyStreak")}
                value={`${streak} ${streak === 1 ? "day" : "days"}`}
                accent
              />
              <StatCard
                icon={<TrendingUp size={18} />}
                label={t("hoursThisWeek")}
                value={`${weekSeries.reduce((s, d) => s + d.hours, 0).toFixed(1)}h`}
              />
            </div>

            {!hasAnyActivity ? (
              <div className="card">
                <EmptyState
                  icon={<BookOpen size={22} />}
                  title={t("noActivityYet")}
                  message={t("noActivityYetMsg")}
                  action={
                    <button className="btn btn-accent mt-2" type="button" onClick={() => nav("/student/activities")}>
                      <PlusCircle size={16} /> {t("logActivity")}
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="db-charts-row">
                <div className="card card-hover enter db-card">
                  <div className="h2">{t("weeklyProgress")}</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weekSeries}>
                      <CartesianGrid vertical={false} stroke="var(--border-soft)" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} width={32} />
                      <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
                      <Bar dataKey="hours" fill="#1D4ED8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card card-hover enter db-card">
                  <div className="h2">{t("subjectBreakdown")}</div>
                  {subjectRows.length === 0 ? (
                    <p className="subtitle">{t("noActivityYetMsg")}</p>
                  ) : (
                    <div className="db-subject-list">
                      {subjectRows.map((s) => (
                        <div className="subject-row" key={s.name}>
                          <div className="subject-name truncate">{s.name}</div>
                          <div className="progress-bar accent" style={{ flex: 1 }}>
                            <span style={{ width: `${s.pct}%`, background: "#1D4ED8" }} />
                          </div>
                          <div className="subject-hours">{s.hours}h</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}