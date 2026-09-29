import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, CloudOff } from "lucide-react";

import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";

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
          <div className="lb-grid">
            <div className="lb-main">
              <Skeleton height={360} radius={16} />
            </div>
            <div className="lb-side">
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
          <div className="lb-grid">
            {/* LEFT: Table + Top 3 */}
            <div className="card lb-main">
              {/* Top 3 podium */}
              {top3.length > 0 && (
                <div className="lb-podium">
                  {top3.map((r) => (
                    <button
                      key={r.rank}
                      type="button"
                      className={`lb-podium-item ${r.rank === 1 ? "is-first" : ""}`}
                      onClick={() => openStudent(r.studentId)}
                    >
                      <div className="lb-podium-avatar">
                        <Avatar name={r.studentName} />
                        <span
                          className="lb-medal"
                          style={{ background: MEDAL_COLORS[r.rank - 1] }}
                        >
                          {medal(r.rank) || `#${r.rank}`}
                        </span>
                      </div>
                      <div className="lb-podium-name truncate" title={r.studentName}>
                        {r.studentName}
                      </div>
                      <div className="lb-podium-hours">
                        {r.avgHoursPerDay}h / day
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Table */}
              <div className="tableWrap">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th className="lb-col-rank">Rank</th>
                      <th>Student</th>
                      <th className="lb-col-hours">{t("avgHoursPerDay")}</th>
                      <th className="lb-col-change">{t("changeVsLastWeek")}</th>
                      <th className="lb-col-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => {
                      const isSelected = r.studentId === selectedStudentId;
                      const isUp = (r.changePercent || 0) >= 0;

                      return (
                        <tr
                          key={r.studentId}
                          className={isSelected ? "is-selected" : ""}
                          onClick={() => openStudent(r.studentId)}
                        >
                          <td className="lb-col-rank">
                            <span className="lb-rank">
                              {r.rank <= 3 ? medal(r.rank) : r.rank}
                            </span>
                          </td>
                          <td>
                            <div className="lb-student">
                              <Avatar name={r.studentName} size={28} />
                              <span className="truncate">{r.studentName}</span>
                            </div>
                          </td>
                          <td className="lb-col-hours">
                            <strong>{r.avgHoursPerDay}h</strong>
                          </td>
                          <td className="lb-col-change">
                            <span className={`stat-trend ${isUp ? "up" : "down"}`}>
                              {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {Math.abs(r.changePercent || 0)}%
                            </span>
                          </td>
                          <td className="lb-col-action">
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Details panel */}
            <div className="card lb-side">
              <div className="h2" style={{ marginBottom: 12 }}>
                Student activity details
              </div>

              {!selectedStudentId ? (
                <EmptyState
                  icon={<Trophy size={20} />}
                  title="Select a student"
                  message="Click a row or a top‑3 card to view activities."
                />
              ) : detailsLoading || details === null ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <Skeleton height={88} radius={12} />
                  <Skeleton height={88} radius={12} />
                  <Skeleton height={88} radius={12} />
                </div>
              ) : details.length === 0 ? (
                <EmptyState
                  icon={<Trophy size={20} />}
                  title="No activities yet"
                  message="This student has no activities logged this week."
                />
              ) : (
                <div className="lb-activities">
                  {details.map((a) => (
                    <div key={a.activityId} className="lb-activity card card-flat">
                      <div className="between" style={{ gap: 8 }}>
                        <div className="h3 truncate" title={a.subjectName}>
                          {a.subjectName}
                        </div>
                        <span className="badge">{a.durationMinutes} min</span>
                      </div>

                      <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>
                        {a.startDate} · {a.startTime}–{a.endTime}
                      </div>

                      {a.description && (
                        <p className="subtitle mt-2" style={{ marginBottom: 0 }}>
                          {a.description}
                        </p>
                      )}

                      <div className="lb-ratings">
                        <div>
                          <span className="faint">Teacher:</span>{" "}
                          {a.tRate ? `${a.tRate}/5` : "—"}
                          {a.tComment ? (
                            <span className="faint"> · {a.tComment}</span>
                          ) : null}
                        </div>
                        <div>
                          <span className="faint">Parent:</span>{" "}
                          {a.pRate ? `${a.pRate}/5` : "—"}
                          {a.pComment ? (
                            <span className="faint"> · {a.pComment}</span>
                          ) : null}
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

      {/* Scoped styles for this page */}
      <style>{`
        .lb-grid {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .lb-main {
          flex: 1.4 1 420px;
          min-width: 0;
        }
        .lb-side {
          flex: 1 1 340px;
          min-width: 0;
        }

        /* Top 3 podium */
        .lb-podium {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .lb-podium-item {
          display: grid;
          justify-items: center;
          gap: 6px;
          min-width: 96px;
          max-width: 120px;
          padding: 12px 10px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 14px;
          background: var(--card, #fff);
          cursor: pointer;
          transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
        }
        .lb-podium-item:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }
        .lb-podium-item.is-first {
          border-color: #F59E0B;
          background: linear-gradient(180deg, #FFFBEB 0%, #fff 100%);
        }
        .lb-podium-avatar {
          position: relative;
        }
        .lb-medal {
          position: absolute;
          bottom: -4px;
          right: -6px;
          font-size: 11px;
          line-height: 1;
          padding: 3px 5px;
          border-radius: 999px;
          color: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .lb-podium-name {
          font-weight: 700;
          font-size: 12.5px;
          max-width: 100%;
          text-align: center;
        }
        .lb-podium-hours {
          font-size: 11.5px;
          color: var(--muted-fg, #6b7280);
        }

        /* Table refinements */
        .lb-table tbody tr {
          cursor: pointer;
          transition: background 0.12s;
        }
        .lb-table tbody tr:hover {
          background: var(--muted, #f9fafb);
        }
        .lb-table tbody tr.is-selected {
          background: var(--primary-50, #eff6ff);
        }
        .lb-student {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .lb-rank {
          font-weight: 600;
          font-size: 14px;
        }
        .lb-col-rank { width: 52px; text-align: center; }
        .lb-col-hours { white-space: nowrap; }
        .lb-col-change { white-space: nowrap; }
        .lb-col-action { width: 72px; text-align: right; }

        /* Activity cards */
        .lb-activities {
          display: grid;
          gap: 10px;
        }
        .lb-activity {
          background: var(--muted, #f9fafb);
          padding: 12px 14px;
        }
        .lb-ratings {
          margin-top: 10px;
          font-size: 12.5px;
          display: grid;
          gap: 4px;
        }

        /* Mobile */
        @media (max-width: 720px) {
          .lb-grid {
            flex-direction: column;
            gap: 12px;
          }
          .lb-main,
          .lb-side {
            flex: 1 1 auto;
            width: 100%;
          }

          .lb-podium {
            gap: 8px;
            margin-bottom: 16px;
          }
          .lb-podium-item {
            min-width: 0;
            flex: 1 1 0;
            max-width: none;
            padding: 10px 6px;
          }

          /* Hide less critical columns on very small screens */
          .lb-col-change {
            display: none;
          }
          .lb-col-action {
            display: none;
          }

          .lb-table th,
          .lb-table td {
            padding: 10px 8px;
            font-size: 13px;
          }
          .lb-student {
            gap: 8px;
          }
        }

        @media (max-width: 420px) {
          .lb-podium-hours {
            display: none; /* keep podium compact */
          }
        }
      `}</style>
    </Layout>
  );
}