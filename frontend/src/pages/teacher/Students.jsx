import { useEffect, useMemo, useState } from "react";
import { Search, Users, Star, TrendingUp, TrendingDown, CloudOff, ArrowLeft, X } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import Stars from "../../components/Stars.jsx";
import { Avatar, Skeleton, ErrorState, EmptyState, Modal } from "../../components/ui.jsx";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Needs attention" },
];

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

export default function Students() {
  const { t } = useI18n();
  const toast = useToast();

  const isMobile = useMediaQuery("(max-width: 900px)");

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [students, setStudents] = useState([]);
  const [leaderRows, setLeaderRows] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [rateDraft, setRateDraft] = useState({});
  const [savingId, setSavingId] = useState(null);

  async function loadStudents() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const [studs, lb] = await Promise.all([
        api.get("/api/teacher/me/students"),
        api.get("/api/teacher/leaderboard"),
      ]);
      setStudents(studs);
      setLeaderRows(lb.rows || []);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      setError(true);
      toast.show(err?.data?.message || "Failed to load students", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities(studentId) {
    setLoadingActivities(true);
    try {
      const d = await api.get(`/api/teacher/me/students/${studentId}/activities`);
      setActivities(d);

      const draft = {};
      d.forEach((a) => {
        draft[a.activityId] = { tRate: a.tRate || 0, tComment: a.tComment || "" };
      });
      setRateDraft(draft);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to load activities", "error");
      setActivities([]);
      setRateDraft({});
    } finally {
      setLoadingActivities(false);
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statById = useMemo(() => new Map(leaderRows.map((r) => [r.studentId, r])), [leaderRows]);

  const filtered = useMemo(() => {
    return students
      .map((s) => ({ ...s, stat: statById.get(s.studentId) }))
      .filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()))
      .filter((s) => {
        if (filter === "active") return (s.stat?.avgHoursPerDay || 0) > 0;
        if (filter === "inactive") return !s.stat || s.stat.avgHoursPerDay === 0;
        return true;
      });
  }, [students, statById, query, filter]);

  async function saveRating(activityId) {
    setSavingId(activityId);
    try {
      const payload = rateDraft[activityId] || { tRate: 0, tComment: "" };
      await api.put(`/api/teacher/me/activities/${activityId}/rate`, payload);
      toast.show("Rating saved", "success");
      await loadActivities(selected.studentId);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to save rating", "error");
    } finally {
      setSavingId(null);
    }
  }

  function openStudent(s) {
    setSelected(s);
    loadActivities(s.studentId);
    if (isMobile) setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
  }

  const DetailsContent = () => {
    if (!selected) {
      return (
        <EmptyState
          icon={<Users size={22} />}
          title="Select a student"
          message="Choose a student from the list to review and rate their study activities."
        />
      );
    }

    return (
      <>
        <div className="between mb-3">
          <div className="center-v" style={{ gap: 10, minWidth: 0 }}>
            {!isMobile && (
              <button className="btn-ghost btn-icon" type="button" onClick={() => setSelected(null)} aria-label="Back">
                <ArrowLeft size={16} />
              </button>
            )}
            <Avatar name={selected.name} />
            <div style={{ minWidth: 0 }}>
              <div className="students-ellips" style={{ fontWeight: 700, fontSize: 15 }}>
                {selected.name}
              </div>
              <div className="faint students-wrap" style={{ fontSize: 12 }}>
                {selected.school} · {selected.grade} {selected.className}
              </div>
            </div>
          </div>
        </div>

        {loadingActivities ? (
          <div className="stack">
            <Skeleton height={90} radius={12} />
            <Skeleton height={90} radius={12} />
          </div>
        ) : activities.length === 0 ? (
          <EmptyState icon={<Users size={20} />} title="No activities yet" message="This student hasn't logged any study activity." />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {activities.map((a) => (
              <div key={a.activityId} className="card card-flat students-activityCard" style={{ background: "var(--muted)" }}>
                <div className="between" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div className="h3">{a.subjectName}</div>
                  <div className="center-v" style={{ gap: 6, flexWrap: "wrap" }}>
                    <span className="badge">{a.durationMinutes} min</span>

                    {a.status === "IN_PROGRESS" && (
                      <span className="badge badge-danger">
                        <span className="live-dot" style={{ width: 6, height: 6 }} /> {t("liveSession")}
                      </span>
                    )}

                    {a.status === "COMPLETED" && a.actualDurationSeconds != null && (
                      <span className="badge badge-success">
                        {t("actualTime")}: {Math.max(1, Math.round(a.actualDurationSeconds / 60))} min
                      </span>
                    )}

                    <span className="faint" style={{ fontSize: 12 }}>
                      {a.startDate} · {a.startTime}–{a.endTime}
                    </span>
                  </div>
                </div>

                {a.description && <p className="subtitle mt-2 students-wrap">{a.description}</p>}

                {a.studentFeedback ? (
                  <div className="student-note-box mt-2 students-wrap">
                    <Users size={13} />
                    <span>
                      <strong>{t("studentNote")}:</strong> {a.studentFeedback}
                    </span>
                  </div>
                ) : a.status === "COMPLETED" ? (
                  <p className="faint mt-2" style={{ fontSize: 12.5 }}>
                    {t("noStudentNote")}
                  </p>
                ) : null}

                <hr />

                <div className="row">
                  <div className="col">
                    <div className="label">{t("teacherRate")}</div>
                    <Stars
                      value={rateDraft[a.activityId]?.tRate || 0}
                      onChange={(v) =>
                        setRateDraft((p) => ({
                          ...p,
                          [a.activityId]: { ...p[a.activityId], tRate: v },
                        }))
                      }
                    />
                    <textarea
                      className="textarea mt-2"
                      placeholder={t("comment")}
                      value={rateDraft[a.activityId]?.tComment || ""}
                      onChange={(e) =>
                        setRateDraft((p) => ({
                          ...p,
                          [a.activityId]: { ...p[a.activityId], tComment: e.target.value },
                        }))
                      }
                    />
                    <button className="btn btn-sm mt-2" type="button" onClick={() => saveRating(a.activityId)} disabled={savingId === a.activityId}>
                      {savingId === a.activityId ? "Saving…" : t("save")}
                    </button>
                  </div>

                  <div className="col">
                    <div className="label">{t("parentRate")}</div>
                    {a.pRate ? (
                      <div className="center-v" style={{ gap: 6, flexWrap: "wrap" }}>
                        <span className="badge badge-accent">
                          <Star size={11} /> {a.pRate}/5
                        </span>
                        {a.pComment && (
                          <span className="faint students-wrap" style={{ fontSize: 12 }}>
                            "{a.pComment}"
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="faint" style={{ fontSize: 12.5 }}>
                        Not rated yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <Layout title={t("students")} subtitle={`${students.length} students`}>
      <style>{`
        /* Prevent horizontal overflow on mobile */
        .studentsPage{
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        .studentsPage *{ box-sizing: border-box; }

        /* List rows: allow shrinking + ellipsis */
        .studentsListBtn{
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .studentsNameWrap{
          min-width: 0;
        }
        .students-ellips{
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 220px;
        }
        @media (max-width: 360px){
          .students-ellips{ max-width: 150px; }
        }

        /* force long strings to wrap in details */
        .students-wrap{
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .students-activityCard{ min-width: 0; }
      `}</style>

      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="studentsPage">
          {loading ? (
            <div className="row">
              <div className="col">
                <Skeleton height={320} radius={16} />
              </div>
              <div className="col">
                <Skeleton height={320} radius={16} />
              </div>
            </div>
          ) : error ? (
            <div className="card">
              <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={loadStudents} retryLabel={t("tryAgain")} />
            </div>
          ) : (
            <>
              <div className="row" style={{ alignItems: "flex-start" }}>
                {/* LEFT list */}
                <div className="col card" style={{ flex: "1 1 340px" }}>
                  <div className="field" style={{ marginBottom: 10 }}>
                    <div className="input-wrap">
                      <input
                        className="input"
                        style={{ paddingLeft: 36 }}
                        placeholder="Search students…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      <Search
                        size={15}
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-faint)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="tabs" style={{ marginBottom: 12 }}>
                    {FILTERS.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        className={"tab " + (filter === f.key ? "active" : "")}
                        onClick={() => setFilter(f.key)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {filtered.length === 0 ? (
                    <EmptyState icon={<Users size={20} />} title="No students found" message="Try a different search or filter." />
                  ) : (
                    <div className="stack" style={{ gap: 6, maxHeight: 520, overflowY: "auto" }}>
                      {filtered.map((s) => {
                        const active = s.stat && s.stat.avgHoursPerDay > 0;

                        return (
                          <button
                            key={s.studentId}
                            type="button"
                            onClick={() => openStudent(s)}
                            className={"between studentsListBtn"}
                            style={{
                              textAlign: "left",
                              border: "1px solid " + (selected?.studentId === s.studentId ? "var(--primary)" : "var(--border)"),
                              background: selected?.studentId === s.studentId ? "var(--primary-50)" : "var(--surface)",
                              borderRadius: "var(--radius-md)",
                              padding: "10px 12px",
                            }}
                          >
                            <div className="center-v" style={{ gap: 10, minWidth: 0 }}>
                              <Avatar name={s.name} size="sm" />
                              <div className="studentsNameWrap">
                                <div className="students-ellips" style={{ fontWeight: 700, fontSize: 13.5 }}>
                                  {s.name}
                                </div>
                                <div className="faint" style={{ fontSize: 11.5 }}>
                                  {s.grade} {s.className}
                                </div>
                              </div>
                            </div>

                            {s.stat ? (
                              <span className={"stat-trend " + (s.stat.changePercent >= 0 ? "up" : "down")} style={{ fontSize: 11.5, flexShrink: 0 }}>
                                {s.stat.changePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {s.stat.avgHoursPerDay}h
                              </span>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: 10.5, flexShrink: 0 }}>
                                {active ? "" : "No activity"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* RIGHT details (desktop only) */}
                {!isMobile && (
                  <div className="col card" style={{ flex: "1.6 1 420px" }}>
                    <DetailsContent />
                  </div>
                )}
              </div>

              {/* MOBILE popup */}
              {isMobile && (
                <Modal
                  open={detailsOpen}
                  onClose={closeDetails}
                  title={selected?.name || "Student details"}
                  footer={
                    <button className="btn btn-outline" type="button" onClick={closeDetails}>
                      <X size={16} /> Close
                    </button>
                  }
                >
                  <div style={{ maxHeight: "70vh", overflow: "auto" }}>
                    <DetailsContent />
                  </div>
                </Modal>
              )}
            </>
          )}
        </div>
      </TrialGate>
    </Layout>
  );
}