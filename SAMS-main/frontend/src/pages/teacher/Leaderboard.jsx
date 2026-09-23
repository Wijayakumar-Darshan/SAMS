import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button, Badge, Modal, EmptyState } from "../../components/UI/index.jsx";
import Stars from "../../components/Stars.jsx";
import {
  TrophyIcon,
  ClockIcon,
  RefreshCwIcon,
  CalendarIcon,
  SparklesIcon,
  EyeIcon,
} from "../../components/UI/Icons.jsx";

function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

export default function TeacherLeaderboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [rows, setRows] = useState([]);
  const [weekStart, setWeekStart] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function loadLeaderboard() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const d = await api.get("/api/teacher/leaderboard");
      setWeekStart(d.weekStart || "");
      setRows(d.rows || []);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to load leaderboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
    // eslint-disable-next-line
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (b.avgHoursPerDay || 0) - (a.avgHoursPerDay || 0));
    return copy.map((x, idx) => ({ ...x, rank: idx + 1 }));
  }, [rows]);

  async function openStudentModal(st) {
    setSelectedStudent(st);
    setDetailsLoading(true);
    try {
      const d = await api.get(`/api/teacher/me/students/${st.studentId}/activities`);
      setDetails(Array.isArray(d) ? d : []);
    } catch {
      toast.show("Cannot load student activities", "error");
      setDetails([]);
    } finally {
      setDetailsLoading(false);
    }
  }

  return (
    <Layout
      title={t("leaderboard")}
      subtitle="Classroom performance overview and student activity drill-down"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-teacher-lb-container">
          <div className="sams-lb-toolbar">
            <div className="sams-lb-pill">
              <SparklesIcon size={16} color="var(--accent)" />
              <span>{weekStart ? `Week of ${weekStart}` : "Current Week"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCwIcon size={14} />}
              onClick={loadLeaderboard}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <Card>
              <div style={{ height: 260, background: "#F1F5F9", borderRadius: 12 }} />
            </Card>
          ) : sorted.length === 0 ? (
            <Card>
              <EmptyState
                icon={<TrophyIcon size={40} color="#D97706" />}
                title="No Rankings Available"
                description="When your mapped students log study activities, rankings will calculate automatically."
              />
            </Card>
          ) : (
            <Card className="sams-teacher-lb-table-card">
              <div className="sams-table-wrap">
                <table className="sams-table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Rank</th>
                      <th>Student</th>
                      <th>{t("avgHoursPerDay")}</th>
                      <th>Weekly Change</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => {
                      const isPositive = (r.changePercent || 0) >= 0;
                      return (
                        <tr key={r.studentId} className={r.rank <= 3 ? `rank-${r.rank}` : ""}>
                          <td>
                            <div className="sams-rank-badge">
                              {medal(r.rank) ? (
                                <span className="sams-medal-txt">{medal(r.rank)}</span>
                              ) : (
                                <span className="sams-rank-num">#{r.rank}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="sams-student-cell">
                              <div className="sams-st-avatar">
                                {r.studentName?.charAt(0) || "S"}
                              </div>
                              <span className="sams-st-name">{r.studentName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="sams-hours-display">
                              <strong>{r.avgHoursPerDay}</strong>
                              <span>h / day</span>
                            </div>
                          </td>
                          <td>
                            <span className={`sams-trend-badge ${isPositive ? "positive" : "negative"}`}>
                              {isPositive ? "↑ " : "↓ "}
                              {Math.abs(r.changePercent || 0)}%
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<EyeIcon size={14} />}
                              onClick={() => openStudentModal(r)}
                            >
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Student Activity Inspection Modal */}
          <Modal
            isOpen={!!selectedStudent}
            onClose={() => setSelectedStudent(null)}
            title={selectedStudent?.studentName}
            subtitle={`Rank #${selectedStudent?.rank} · ${selectedStudent?.avgHoursPerDay}h / day average`}
            maxWidth="640px"
          >
            {detailsLoading ? (
              <div style={{ padding: 30, textAlign: "center", color: "#94A3B8" }}>
                Loading student activities...
              </div>
            ) : details.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: "#64748B" }}>
                No study activities found for this student.
              </div>
            ) : (
              <div className="sams-modal-act-list">
                {details.map((act) => (
                  <div key={act.activityId} className="sams-modal-act-item">
                    <div className="sams-modal-act-head">
                      <strong>{act.subjectName}</strong>
                      <Badge variant="primary" size="sm">{act.durationMinutes} min</Badge>
                    </div>
                    <div className="sams-modal-act-time">
                      <span>{act.startDate}</span> · <span>{act.startTime} – {act.endTime}</span>
                    </div>
                    {act.description && (
                      <p className="sams-modal-act-desc">“{act.description}”</p>
                    )}
                    {act.tRate ? (
                      <div className="sams-modal-act-rate">
                        <Stars value={act.tRate} readOnly size={13} />
                        {act.tComment && <span> — {act.tComment}</span>}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Modal>
        </div>
      </TrialGate>

      <style>{`
        .sams-teacher-lb-container {
          max-width: 960px;
          margin: 0 auto;
        }

        .sams-lb-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .sams-lb-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
        }

        .sams-teacher-lb-table-card {
          padding: 0;
          overflow: hidden;
        }

        .sams-rank-badge {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-medal-txt {
          font-size: 20px;
        }

        .sams-rank-num {
          font-weight: 700;
          color: var(--text-secondary);
        }

        .sams-student-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sams-st-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        }

        .sams-st-name {
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-hours-display strong {
          font-size: 15px;
          color: var(--primary);
          margin-right: 4px;
        }

        .sams-hours-display span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .sams-modal-act-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 55vh;
          overflow-y: auto;
        }

        .sams-modal-act-item {
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 12px 14px;
        }

        .sams-modal-act-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: var(--text-main);
        }

        .sams-modal-act-time {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 4px 0;
        }

        .sams-modal-act-desc {
          font-size: 13px;
          font-style: italic;
          color: var(--text-secondary);
          margin: 6px 0;
        }

        .sams-modal-act-rate {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 6px;
        }
      `}</style>
    </Layout>
  );
}