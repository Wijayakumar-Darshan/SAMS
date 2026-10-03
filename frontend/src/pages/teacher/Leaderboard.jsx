import { useEffect, useMemo, useState } from "react";
import { Trophy, TrendingUp, TrendingDown, CloudOff, X } from "lucide-react";

import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";

import { Avatar, Skeleton, ErrorState, EmptyState, Modal } from "../../components/ui.jsx";

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#B45309"];

function medal(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "";
}

/* small helper hook */
function useMediaQuery(query) {
  const [m, setM] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(query).matches));
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const onChange = () => setM(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [query]);
  return m;
}

export default function Leaderboard() {
  const { t } = useI18n();
  const toast = useToast();

  const isMobile = useMediaQuery("(max-width: 900px)");

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [rows, setRows] = useState([]);
  const [weekStart, setWeekStart] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [details, setDetails] = useState(null); // null=loading, []=empty
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false); // ✅ mobile modal

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
  const selectedStudent = useMemo(
    () => sorted.find((r) => r.studentId === selectedStudentId),
    [sorted, selectedStudentId]
  );

  async function openStudent(studentId) {
    const id = parseInt(String(studentId), 10);
    if (!Number.isFinite(id)) {
      toast.show("Invalid student id", "error");
      return;
    }

    setSelectedStudentId(id);
    setDetails(null);
    setDetailsLoading(true);

    // ✅ on mobile open modal immediately (shows skeleton while loading)
    if (isMobile) setDetailsOpen(true);

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

  function closeDetails() {
    setDetailsOpen(false);
  }

  return (
    <Layout title={t("leaderboard")} subtitle={weekStart ? `My students · Week of ${weekStart}` : "My students"}>
      {/* ✅ Mobile responsive CSS (scoped) */}
      <style>{`
        .tLB-layout{
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
          width: 100%;
          max-width: 100%;
        }
        @media (max-width: 900px){
          .tLB-layout{ grid-template-columns: 1fr; }
        }
        .tLB-left, .tLB-right{ min-width: 0; }

        .tLB-podium{
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .tLB-podiumItem{
          display: grid;
          justify-items: center;
          gap: 6px;
          min-width: 92px;
        }

        .tLB-tableWrap{
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
        }
        .tLB-table{
          width: 100%;
          border-collapse: collapse;
          min-width: 650px;
        }
        @media (max-width: 520px){
          .tLB-table{ min-width: 740px; }
        }

        .tLB-detailCard .between{ flex-wrap: wrap; gap: 8px; }
        .tLB-detailCard .subtitle{ word-break: break-word; }

        /* modal scroll area */
        .tLB-modalBody{
          max-height: 70vh;
          overflow: auto;
          display: grid;
          gap: 10px;
          padding-right: 2px;
        }
      `}</style>

      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="tLB-layout">
            <div className="tLB-left">
              <Skeleton height={360} radius={16} />
            </div>
            <div className="tLB-right">
              <Skeleton height={360} radius={16} />
            </div>
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad") || "Could not load"} onRetry={loadLeaderboard} retryLabel={t("tryAgain") || "Try again"} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Trophy size={22} />} title="No leaderboard data yet" message="Your leaderboard will appear once your students start logging study time this week." />
          </div>
        ) : (
          <>
            <div className="tLB-layout">
              {/* LEFT */}
              <div className="card tLB-left">
                {top3.length > 0 && (
                  <div className="tLB-podium">
                    {top3.map((r) => (
                      <div key={r.rank} className="tLB-podiumItem">
                        <Avatar name={r.studentName} />
                        <div className="truncate" style={{ fontWeight: 700, fontSize: 12.5, maxWidth: 90 }} title={r.studentName}>
                          {r.studentName}
                        </div>
                        <span className="badge" style={{ background: MEDAL_COLORS[r.rank - 1], color: "#fff", border: "none" }}>
                          {medal(r.rank) ? medal(r.rank) : `#${r.rank}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="tLB-tableWrap">
                  <table className="tLB-table">
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
                            cursor: "pointer",
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

              {/* RIGHT (desktop only) */}
              {!isMobile && (
                <div className="card tLB-right">
                  <div className="h2" style={{ marginBottom: 10 }}>
                    Student activity details
                  </div>

                  {!selectedStudentId ? (
                    <EmptyState icon={<Trophy size={20} />} title="Select a student" message="Click on a row to view that student’s activities." />
                  ) : detailsLoading || details === null ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <Skeleton height={80} radius={12} />
                      <Skeleton height={80} radius={12} />
                    </div>
                  ) : details.length === 0 ? (
                    <EmptyState icon={<Trophy size={20} />} title="No activities yet" message="This student has no activities." />
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {details.map((a) => (
                        <div key={a.activityId} className="card card-flat tLB-detailCard" style={{ background: "var(--muted)" }}>
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
              )}
            </div>

            {/* ✅ MOBILE MODAL */}
            {isMobile && (
              <Modal
                open={detailsOpen}
                onClose={closeDetails}
                title={selectedStudent?.studentName ? `${selectedStudent.studentName}` : "Student details"}
                footer={
                  <button className="btn btn-outline" type="button" onClick={closeDetails}>
                    <X size={16} /> Close
                  </button>
                }
              >
                {detailsLoading || details === null ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <Skeleton height={80} radius={12} />
                    <Skeleton height={80} radius={12} />
                  </div>
                ) : details.length === 0 ? (
                  <EmptyState icon={<Trophy size={20} />} title="No activities yet" message="This student has no activities." />
                ) : (
                  <div className="tLB-modalBody">
                    {details.map((a) => (
                      <div key={a.activityId} className="card card-flat tLB-detailCard" style={{ background: "var(--muted)" }}>
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
              </Modal>
            )}
          </>
        )}
      </TrialGate>
    </Layout>
  );
}