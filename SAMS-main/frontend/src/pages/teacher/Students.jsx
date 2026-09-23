import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button, Badge, EmptyState } from "../../components/UI/index.jsx";
import Stars from "../../components/Stars.jsx";
import {
  UsersIcon,
  SearchIcon,
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  StarIcon,
  SchoolIcon,
} from "../../components/UI/Icons.jsx";

export default function TeacherStudents() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");

  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");

  const [rateDraft, setRateDraft] = useState({}); // activityId -> { tRate, tComment }

  async function loadStudents() {
    setBlocked(false);
    setBlockMsg("");
    setLoadingStudents(true);
    try {
      const d = await api.get("/api/teacher/me/students");
      setStudents(Array.isArray(d) ? d : []);
      if (d && d.length > 0 && !selected) {
        setSelected(d[0]);
        loadActivities(d[0].studentId);
      }
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to load students", "error");
    } finally {
      setLoadingStudents(false);
    }
  }

  async function loadActivities(studentId) {
    setLoadingActivities(true);
    try {
      const d = await api.get(`/api/teacher/me/students/${studentId}/activities`);
      setActivities(Array.isArray(d) ? d : []);
      const draft = {};
      (d || []).forEach((a) => {
        draft[a.activityId] = {
          tRate: a.tRate || 0,
          tComment: a.tComment || "",
        };
      });
      setRateDraft(draft);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to load student activities", "error");
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line
  }, []);

  async function handleSaveRating(activityId) {
    setSavingId(activityId);
    try {
      const payload = rateDraft[activityId] || { tRate: 0, tComment: "" };
      await api.put(`/api/teacher/me/activities/${activityId}/rate`, payload);
      toast.show("Teacher feedback & rating saved successfully!");
      if (selected) await loadActivities(selected.studentId);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to save rating", "error");
    } finally {
      setSavingId(null);
    }
  }

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.className || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = gradeFilter === "all" || s.grade === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [students, searchQuery, gradeFilter]);

  // Unique grades for filter
  const grades = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.grade) set.add(s.grade);
    });
    return Array.from(set);
  }, [students]);

  return (
    <Layout
      title={t("students")}
      subtitle="Review student study activity logs, verify duration, and provide supportive feedback"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-students-page-container">
          <div className="sams-students-layout">
            {/* LEFT COLUMN: Student Roster with Search & Filter */}
            <div className="sams-students-roster-column">
              <Card className="sams-roster-card">
                <div className="sams-roster-header">
                  <div>
                    <h2 className="sams-roster-title">{t("students")}</h2>
                    <span className="sams-roster-count">{filteredStudents.length} mapped</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCwIcon size={14} />}
                    onClick={loadStudents}
                    disabled={loadingStudents}
                  />
                </div>

                {/* Search Bar */}
                <div className="sams-roster-search-wrap">
                  <SearchIcon size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="sams-roster-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchStudents")}
                  />
                </div>

                {/* Grade Filters */}
                {grades.length > 0 && (
                  <div className="sams-grade-filter-chips">
                    <button
                      type="button"
                      className={`sams-chip ${gradeFilter === "all" ? "active" : ""}`}
                      onClick={() => setGradeFilter("all")}
                    >
                      All
                    </button>
                    {grades.map((g) => (
                      <button
                        key={g}
                        type="button"
                        className={`sams-chip ${gradeFilter === g ? "active" : ""}`}
                        onClick={() => setGradeFilter(g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                )}

                {/* Student List */}
                <div className="sams-student-items-list">
                  {loadingStudents ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#94A3B8" }}>
                      Loading students...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "#64748B" }}>
                      No matching students found.
                    </div>
                  ) : (
                    filteredStudents.map((st) => {
                      const isSelected = selected?.studentId === st.studentId;
                      return (
                        <div
                          key={st.studentId}
                          className={`sams-student-list-item ${isSelected ? "selected" : ""}`}
                          onClick={() => {
                            setSelected(st);
                            loadActivities(st.studentId);
                          }}
                        >
                          <div className="sams-student-avatar">
                            {st.name?.charAt(0) || "S"}
                          </div>
                          <div className="sams-student-info">
                            <h3 className="sams-student-name">{st.name}</h3>
                            <div className="sams-student-meta">
                              <span>{st.grade}</span> &nbsp;·&nbsp;
                              <span>Class {st.className}</span>
                            </div>
                          </div>
                          {isSelected && <div className="sams-selected-indicator" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Student Activity Inspection & Rating */}
            <div className="sams-student-detail-column">
              {!selected ? (
                <Card>
                  <EmptyState
                    icon={<UsersIcon size={40} color="var(--accent)" />}
                    title="Select a Student"
                    description="Choose a student from the left panel to review their study logs and submit feedback."
                  />
                </Card>
              ) : (
                <div className="sams-student-inspect-card">
                  {/* Student Profile Hero Header */}
                  <div className="sams-inspect-profile-header">
                    <div className="sams-inspect-avatar">
                      {selected.name?.charAt(0) || "S"}
                    </div>
                    <div className="sams-inspect-details">
                      <h2 className="sams-inspect-name">{selected.name}</h2>
                      <div className="sams-inspect-school-row">
                        <SchoolIcon size={14} color="var(--accent)" />
                        <span>{selected.school}</span> &nbsp;·&nbsp;
                        <Badge variant="primary" size="sm">
                          {selected.grade} - {selected.className}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stream */}
                  <div className="sams-inspect-activities-section">
                    <div className="sams-inspect-section-title">
                      <h3>Study Activity History</h3>
                      <span className="sams-inspect-count">
                        {activities.length} session{activities.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {loadingActivities ? (
                      <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                        Loading study sessions...
                      </div>
                    ) : activities.length === 0 ? (
                      <Card>
                        <EmptyState
                          icon={<BookOpenIcon size={36} color="var(--accent)" />}
                          title="No Activities Logged Yet"
                          description={`${selected.name} has not recorded any study sessions yet.`}
                        />
                      </Card>
                    ) : (
                      <div className="sams-inspect-activities-list">
                        {activities.map((act) => {
                          const draft = rateDraft[act.activityId] || { tRate: 0, tComment: "" };
                          const isSaving = savingId === act.activityId;
                          return (
                            <Card key={act.activityId} className="sams-inspect-act-card">
                              <div className="sams-act-header-row">
                                <div>
                                  <h4 className="sams-act-subject">{act.subjectName}</h4>
                                  <div className="sams-act-time-row">
                                    <CalendarIcon size={13} />
                                    <span>{act.startDate}</span> &nbsp;·&nbsp;
                                    <ClockIcon size={13} />
                                    <span>{act.startTime} – {act.endTime}</span>
                                  </div>
                                </div>
                                <Badge variant="primary" size="md">
                                  {act.durationMinutes} min
                                </Badge>
                              </div>

                              {act.description && (
                                <p className="sams-act-desc-quote">
                                  “{act.description}”
                                </p>
                              )}

                              {/* Teacher Grading & Feedback Form */}
                              <div className="sams-rate-box">
                                <div className="sams-rate-box-title">
                                  <span>{t("teacherRate")}</span>
                                  <Stars
                                    value={draft.tRate}
                                    size={22}
                                    onChange={(newVal) =>
                                      setRateDraft((prev) => ({
                                        ...prev,
                                        [act.activityId]: { ...draft, tRate: newVal },
                                      }))
                                    }
                                  />
                                </div>

                                <div className="sams-comment-input-row">
                                  <input
                                    type="text"
                                    className="sams-input sams-comment-input"
                                    value={draft.tComment}
                                    onChange={(e) =>
                                      setRateDraft((prev) => ({
                                        ...prev,
                                        [act.activityId]: { ...draft, tComment: e.target.value },
                                      }))
                                    }
                                    placeholder="Leave an encouraging note for the student..."
                                  />
                                  <Button
                                    variant="primary"
                                    size="md"
                                    loading={isSaving}
                                    onClick={() => handleSaveRating(act.activityId)}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </TrialGate>

      <style>{`
        .sams-students-page-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .sams-students-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        /* Roster Column */
        .sams-roster-card {
          padding: 20px;
          border: 1px solid var(--border-subtle);
        }

        .sams-roster-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sams-roster-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-roster-count {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-roster-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          margin-bottom: 12px;
        }

        .sams-roster-search-input {
          border: none;
          background: transparent;
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        .sams-grade-filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }

        .sams-student-items-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 65vh;
          overflow-y: auto;
        }

        .sams-student-list-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .sams-student-list-item:hover {
          background: var(--bg-card-muted);
        }

        .sams-student-list-item.selected {
          background: var(--accent-soft);
        }

        .sams-student-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--primary-gradient);
          color: white;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }

        .sams-student-info {
          flex: 1;
          min-width: 0;
        }

        .sams-student-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sams-student-meta {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-selected-indicator {
          width: 3px;
          height: 24px;
          background: var(--accent);
          border-radius: var(--radius-pill);
        }

        /* Detail Column */
        .sams-student-inspect-card {
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-2xl);
          padding: 28px;
          box-shadow: var(--shadow-sm);
        }

        .sams-inspect-profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 24px;
        }

        .sams-inspect-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0B2E59 0%, #2E86C1 100%);
          color: white;
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-inspect-name {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-inspect-school-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .sams-inspect-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sams-inspect-section-title h3 {
          font-size: 16px;
          font-weight: 800;
          color: var(--primary);
        }

        .sams-inspect-count {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sams-inspect-activities-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sams-inspect-act-card {
          padding: 18px 20px;
          border: 1px solid var(--border-subtle);
        }

        .sams-act-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .sams-act-subject {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-act-time-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-act-desc-quote {
          font-size: 13px;
          color: var(--text-secondary);
          font-style: italic;
          background: var(--bg-card-muted);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          margin: 8px 0 14px;
        }

        .sams-rate-box {
          background: #F8FAFC;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 12px 14px;
        }

        .sams-rate-box-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 10px;
        }

        .sams-comment-input-row {
          display: flex;
          gap: 8px;
        }

        .sams-comment-input {
          flex: 1;
        }

        @media (max-width: 900px) {
          .sams-students-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}