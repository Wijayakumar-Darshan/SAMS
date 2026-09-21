import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Lock, CloudOff } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Avatar, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#B45309"];

export default function Leaderboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState([]);
  const [myStudentIds, setMyStudentIds] = useState(new Set());
  const [weekStart, setWeekStart] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [details, setDetails] = useState(null);

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const [lb, students] = await Promise.all([
        api.get("/api/teacher/leaderboard"),
        api.get("/api/teacher/me/students")
      ]);
      setWeekStart(lb.weekStart);
      setRows(lb.rows || []);
      setMyStudentIds(new Set(students.map((s) => s.studentId)));
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      setError(true);
      toast.show(err?.data?.message || "Failed to load leaderboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (b.avgHoursPerDay || 0) - (a.avgHoursPerDay || 0));
    return copy.map((x, idx) => ({ ...x, rank: idx + 1 }));
  }, [rows]);

  const top3 = sorted.slice(0, 3);

  async function openStudent(studentId) {
    setSelectedStudentId(studentId);
    if (!myStudentIds.has(studentId)) {
      setDetails("forbidden");
      return;
    }
    setDetails(null);
    try {
      const d = await api.get(`/api/teacher/me/students/${studentId}/activities`);
      setDetails(d);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to load activity details", "error");
      setDetails([]);
    }
  }

  return (
    <Layout title={t("leaderboard")} subtitle={weekStart ? `School-wide · Week of ${weekStart}` : undefined}>
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="row">
            <div className="col"><Skeleton height={360} radius={16} /></div>
            <div className="col"><Skeleton height={360} radius={16} /></div>
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Trophy size={22} />} title="No leaderboard data yet" message="Rankings will appear once students start logging study time this week." />
          </div>
        ) : (
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col card" style={{ flex: "1.4 1 420px" }}>
              {top3.length > 0 && (
                <div className="row" style={{ justifyContent: "center", gap: 10, marginBottom: 18 }}>
                  {top3.map((r) => (
                    <div key={r.rank} className="stack" style={{ alignItems: "center", gap: 6, minWidth: 92 }}>
                      <Avatar name={r.studentName} />
                      <div className="truncate" style={{ fontWeight: 700, fontSize: 12.5, maxWidth: 90 }}>{r.studentName}</div>
                      <span className="badge" style={{ background: MEDAL_COLORS[r.rank - 1], color: "#fff", border: "none" }}>
                        #{r.rank}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>{t("avgHoursPerDay")}</th>
                      <th>{t("changeVsLastWeek")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr
                        key={r.studentId}
                        style={{ background: r.studentId === selectedStudentId ? "var(--primary-50)" : undefined, cursor: "pointer" }}
                        onClick={() => openStudent(r.studentId)}
                      >
                        <td>{r.rank}</td>
                        <td className="center-v" style={{ gap: 8 }}>
                          {r.studentName}
                          {myStudentIds.has(r.studentId) && <span className="badge badge-primary" style={{ fontSize: 10 }}>Your student</span>}
                        </td>
                        <td>{r.avgHoursPerDay}h</td>
                        <td>
                          <span className={"stat-trend " + (r.changePercent >= 0 ? "up" : "down")}>
                            {r.changePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(r.changePercent)}%
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-outline btn-sm" type="button" onClick={(e) => { e.stopPropagation(); openStudent(r.studentId); }}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="col card" style={{ flex: "1 1 340px" }}>
              <div className="h2">Student activity details</div>
              {!selectedStudentId ? (
                <EmptyState icon={<Trophy size={20} />} title="Select a student" message="Click on a leaderboard row to view their study activities." />
              ) : details === "forbidden" ? (
                <EmptyState
                  icon={<Lock size={20} />}
                  title="Not one of your students"
                  message="You can only view detailed activity logs for students mapped to you. Ask the student to share their mapping code with you to connect."
                />
              ) : details === null ? (
                <div className="stack"><Skeleton height={80} radius={12} /><Skeleton height={80} radius={12} /></div>
              ) : details.length === 0 ? (
                <EmptyState icon={<Trophy size={20} />} title="No activities yet" message="This student hasn't logged any study activity." />
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  {details.map((a) => (
                    <div key={a.activityId} className="card card-flat" style={{ background: "var(--muted)" }}>
                      <div className="between">
                        <div className="h3">{a.subjectName}</div>
                        <span className="badge">{a.durationMinutes} min</span>
                      </div>
                      <div className="faint" style={{ fontSize: 12 }}>{a.startDate} · {a.startTime}–{a.endTime}</div>
                      {a.description && <p className="subtitle mt-2">{a.description}</p>}
                      <div className="mt-2" style={{ fontSize: 12.5 }}>
                        <div>Teacher: {a.tRate ? `${a.tRate}/5` : "-"} {a.tComment ? `(${a.tComment})` : ""}</div>
                        <div>Parent: {a.pRate ? `${a.pRate}/5` : "-"} {a.pComment ? `(${a.pComment})` : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}
