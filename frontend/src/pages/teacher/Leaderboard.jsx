import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, CloudOff } from "lucide-react";

import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";

// Uses your existing shared UI helpers (as in your other page)
import { Avatar, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#B45309"];

function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default function Leaderboard() {
  const { t } = useI18n();
  const toast = useToast();

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [rows, setRows] = useState([]);
  const [weekStart, setWeekStart] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [details, setDetails] = useState(null); // null = loading, [] = empty
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function loadLeaderboard() {
    setLoading(true);
    setError(false);
    setBlocked(false);
    setBlockMsg("");

    try {
      // Backend should already return ONLY this teacher's students
      const lb = await api.get("/api/teacher/leaderboard");
      setWeekStart(lb?.weekStart || "");
      setRows(lb?.rows || []);
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
    loadLeaderboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (b.avgHoursPerDay || 0) - (a.avgHoursPerDay || 0));
    return copy.map((x, idx) => ({ ...x, rank: idx + 1 }));
  }, [rows]);

  const top3 = sorted.slice(0, 3);

  async function openStudent(studentId) {
    const id = parseInt(String(studentId), 10);
    if (!Number.isFinite(id)) {
      toast.show("Invalid student id", "error");
      return;
    }

    setSelectedStudentId(id);
    setDetails(null);
    setDetailsLoading(true);

    try {
      // IMPORTANT: mapped-only endpoint (works because leaderboard is already filtered to this teacher)
      const d = await api.get(`/api/teacher/me/students/${id}/activities`);
      setDetails(Array.isArray(d) ? d : []);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to load student activities", "error");
      setDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <Layout
      title={t("leaderboard")}
      subtitle={weekStart ? `My students · Week of ${weekStart}` : "My students"}
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "1.4 1 420px" }}>
              <Skeleton height={360} radius={16} />
            </div>
            <div style={{ flex: "1 1 340px" }}>
              <Skeleton height={360} radius={16} />
            </div>
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState
              icon={<CloudOff size={22} />}
              title={t("couldntLoad") || "Could not load"}
              onRetry={loadLeaderboard}
              retryLabel={t("tryAgain") || "Try again"}
            />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Trophy size={22} />}
              title="No leaderboard data yet"
              message="Your leaderboard will appear once your students start logging study time this week."
            />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* LEFT: Table */}
            <div className="card" style={{ flex: "1.4 1 420px" }}>
              {top3.length > 0 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                  {top3.map((r) => (
                    <div key={r.rank} style={{ display: "grid", justifyItems: "center", gap: 6, minWidth: 92 }}>
                      <Avatar name={r.studentName} />
                      <div
                        className="truncate"
                        style={{ fontWeight: 700, fontSize: 12.5, maxWidth: 90 }}
                        title={r.studentName}
                      >
                        {r.studentName}
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: MEDAL_COLORS[r.rank - 1],
                          color: "#fff",
                          border: "none"
                        }}
                      >
                        {medal(r.rank) ? medal(r.rank) : `#${r.rank}`}
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
                      <th>Student</th>
                      <th>{t("avgHoursPerDay")}</th>
                      <th>{t("changeVsLastWeek")}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr
                        key={r.studentId}
                        style={{
                          background: r.studentId === selectedStudentId ? "var(--primary-50)" : undefined,
                          cursor: "pointer"
                        }}
                        onClick={() => openStudent(r.studentId)}
                      >
                        <td>{r.rank}</td>
                        <td style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{r.studentName}</span>
                        </td>
                        <td>{r.avgHoursPerDay}h</td>
                        <td>
                          <span className={"stat-trend " + ((r.changePercent || 0) >= 0 ? "up" : "down")}>
                            {(r.changePercent || 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
                            {Math.abs(r.changePercent || 0)}%
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStudent(r.studentId);
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Details */}
            <div className="card" style={{ flex: "1 1 340px" }}>
              <div className="h2" style={{ marginBottom: 10 }}>Student activity details</div>

              {!selectedStudentId ? (
                <EmptyState
                  icon={<Trophy size={20} />}
                  title="Select a student"
                  message="Click on a row to view that student’s activities."
                />
              ) : detailsLoading || details === null ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <Skeleton height={80} radius={12} />
                  <Skeleton height={80} radius={12} />
                </div>
              ) : details.length === 0 ? (
                <EmptyState
                  icon={<Trophy size={20} />}
                  title="No activities yet"
                  message="This student has no activities."
                />
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {details.map((a) => (
                    <div key={a.activityId} className="card card-flat" style={{ background: "var(--muted)" }}>
                      <div className="between">
                        <div className="h3">{a.subjectName}</div>
                        <span className="badge">{a.durationMinutes} min</span>
                      </div>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {a.startDate} · {a.startTime}–{a.endTime}
                      </div>
                      {a.description && <p className="subtitle mt-2">{a.description}</p>}

                      <div className="mt-2" style={{ fontSize: 12.5 }}>
                        <div>
                          Teacher: {a.tRate ? `${a.tRate}/5` : "-"} {a.tComment ? `(${a.tComment})` : ""}
                        </div>
                        <div>
                          Parent: {a.pRate ? `${a.pRate}/5` : "-"} {a.pComment ? `(${a.pComment})` : ""}
                        </div>
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