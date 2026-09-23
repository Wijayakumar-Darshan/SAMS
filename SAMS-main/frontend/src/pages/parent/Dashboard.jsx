import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, StatCard, Button, Badge, EmptyState } from "../../components/UI/index.jsx";
import Stars from "../../components/Stars.jsx";
import {
  BookOpenIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  SchoolIcon,
  DownloadIcon,
  RefreshCwIcon,
  StarIcon,
  HeartIcon,
  SparklesIcon,
} from "../../components/UI/Icons.jsx";

export default function ParentDashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");

  const [child, setChild] = useState(null);
  const [activities, setActivities] = useState([]);
  const [draft, setDraft] = useState({});
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const reportRef = useRef(null);

  async function loadParentData() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const [childInfo, acts, rep] = await Promise.all([
        api.get("/api/parent/me/dashboard"),
        api.get("/api/parent/me/activities").catch(() => []),
        api.get("/api/parent/me/weekly-report").catch(() => null),
      ]);
      setChild(childInfo);
      setActivities(Array.isArray(acts) ? acts : []);
      setReport(rep);

      const dd = {};
      (acts || []).forEach((a) => {
        dd[a.activityId] = {
          pRate: a.pRate || 0,
          pComment: a.pComment || "",
        };
      });
      setDraft(dd);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to load child data", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParentData();
    // eslint-disable-next-line
  }, []);

  async function handleSaveRating(activityId) {
    setSavingId(activityId);
    try {
      const payload = draft[activityId] || { pRate: 0, pComment: "" };
      await api.put(`/api/parent/me/activities/${activityId}/rate`, payload);
      toast.show("Your feedback has been saved! Encouragement helps your child grow.");
      await loadParentData();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to save feedback", "error");
    } finally {
      setSavingId(null);
    }
  }

  // Total weekly study time
  const totalWeeklyMinutes = useMemo(() => {
    return activities.reduce((sum, a) => sum + (Number(a.durationMinutes) || 0), 0);
  }, [activities]);

  const totalWeeklyHours = (totalWeeklyMinutes / 60).toFixed(1);

  function handlePrintReport() {
    const node = reportRef.current;
    if (!node) return;
    const html = node.outerHTML;
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SAMS Child Weekly Progress - ${child?.studentName || ""}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 32px; color: #0F172A; }
            .header { border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-size: 20px; color: #0B2E59; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #E2E8F0; padding: 10px 12px; text-align: left; }
            th { background: #F8FAFC; font-weight: 700; }
            .legal { margin-top: 24px; font-size: 11px; background: #F8FAFC; padding: 12px; border: 1px dashed #CBD5E1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SAMS — Weekly Progress Report for ${child?.studentName || "Student"}</h1>
            <p>${child?.school || ""} · Grade ${child?.grade || ""} (${child?.className || ""})</p>
          </div>
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
      subtitle="Support your child's study routine and leave positive feedback"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-parent-container">
          {/* Child Profile Hero Banner */}
          {child && (
            <div className="sams-parent-hero-banner animate-fade-in">
              <div className="sams-parent-hero-left">
                <div className="sams-child-avatar">
                  {child.studentName?.charAt(0) || "S"}
                </div>
                <div>
                  <div className="sams-child-tag">Student Profile</div>
                  <h1 className="sams-child-name">{child.studentName}</h1>
                  <div className="sams-child-school-row">
                    <SchoolIcon size={14} color="#BAE6FD" />
                    <span>{child.school}</span> &nbsp;·&nbsp;
                    <span>{child.grade} - {child.className}</span>
                  </div>
                </div>
              </div>

              <div className="sams-parent-hero-right">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCwIcon size={14} />}
                  onClick={loadParentData}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}

          {/* Quick Metrics Row (Prompt Requirement 24) */}
          <div className="sams-parent-metrics-grid">
            <StatCard
              icon={<BookOpenIcon size={22} />}
              iconColor="blue"
              label="Completed Sessions"
              value={activities.length}
              sublabel="Logged this period"
              loading={loading && !child}
            />

            <StatCard
              icon={<ClockIcon size={22} />}
              iconColor="purple"
              label="Total Study Time"
              value={`${totalWeeklyHours}h`}
              sublabel={`${totalWeeklyMinutes} minutes total`}
              loading={loading && !child}
            />

            <StatCard
              icon={<StarIcon size={22} />}
              iconColor="amber"
              label={t("mostSpentSubject")}
              value={report?.mostSpentSubject || "—"}
              sublabel={report?.mostSpentHours ? `${report.mostSpentHours}h spent` : "Top focus subject"}
              loading={loading && !child}
            />
          </div>

          <div className="sams-parent-main-grid">
            {/* LEFT / MAIN: Activities Feed with Parent Rating */}
            <div className="sams-parent-feed-column">
              <div className="sams-parent-section-header">
                <div>
                  <h2 className="sams-section-heading">Study Activities & Feedback</h2>
                  <p className="sams-section-sub">
                    Review what your child completed and add stars and encouraging comments
                  </p>
                </div>
              </div>

              {loading ? (
                <Card>
                  <div style={{ height: 160, background: "#F1F5F9", borderRadius: 12 }} />
                </Card>
              ) : activities.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<BookOpenIcon size={36} color="var(--accent)" />}
                    title="No Activities Logged Yet"
                    description="Your child has not logged any study sessions for this period."
                  />
                </Card>
              ) : (
                <div className="sams-parent-activities-list">
                  {activities.map((act) => {
                    const actDraft = draft[act.activityId] || { pRate: 0, pComment: "" };
                    const isSaving = savingId === act.activityId;
                    return (
                      <Card key={act.activityId} className="sams-parent-act-card">
                        <div className="sams-act-top-row">
                          <div>
                            <h3 className="sams-parent-act-subject">{act.subjectName}</h3>
                            <div className="sams-parent-act-time">
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
                          <p className="sams-parent-act-desc">
                            “{act.description}”
                          </p>
                        )}

                        {/* Teacher's note if available */}
                        {(act.tRate || act.tComment) && (
                          <div className="sams-teacher-note-pill">
                            <span className="sams-note-badge">Teacher's Note</span>
                            {act.tRate ? <Stars value={act.tRate} readOnly size={13} /> : null}
                            {act.tComment && <span> — “{act.tComment}”</span>}
                          </div>
                        )}

                        {/* Parent Rating Form (Prompt Requirement 24) */}
                        <div className="sams-parent-rating-form">
                          <div className="sams-parent-rate-head">
                            <span className="sams-rate-label">{t("parentFeedback")}</span>
                            <Stars
                              value={actDraft.pRate}
                              size={22}
                              onChange={(val) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [act.activityId]: { ...actDraft, pRate: val },
                                }))
                              }
                            />
                          </div>

                          <div className="sams-parent-comment-row">
                            <input
                              type="text"
                              className="sams-input"
                              value={actDraft.pComment}
                              onChange={(e) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [act.activityId]: { ...actDraft, pComment: e.target.value },
                                }))
                              }
                              placeholder="Add an encouraging note for your child..."
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

            {/* RIGHT: Weekly Report Preview & Print */}
            <div className="sams-parent-report-column">
              <Card className="sams-parent-report-card">
                <div className="sams-report-card-head">
                  <div>
                    <h3 className="sams-report-card-title">{t("weeklyReport")}</h3>
                    <p className="sams-report-card-sub">Official study summary</p>
                  </div>
                  {report && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<DownloadIcon size={14} />}
                      onClick={handlePrintReport}
                    >
                      Print
                    </Button>
                  )}
                </div>

                <div ref={reportRef} className="sams-report-preview-body">
                  {!report ? (
                    <p style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: 20 }}>
                      No weekly report calculated yet.
                    </p>
                  ) : (
                    <div className="sams-report-compact-details">
                      <div className="sams-preview-stat-row">
                        <span className="label">{t("avgHoursPerDay")}:</span>
                        <strong className="val">{report.avgHoursPerDay} hrs</strong>
                      </div>
                      <div className="sams-preview-stat-row">
                        <span className="label">{t("mostSpentSubject")}:</span>
                        <strong className="val">{report.mostSpentSubject || "—"}</strong>
                      </div>
                      <div className="sams-preview-stat-row">
                        <span className="label">Weekly Progress:</span>
                        <strong className="val">
                          {(report.changePercentVsLastWeek || 0) >= 0 ? "+" : ""}
                          {report.changePercentVsLastWeek}%
                        </strong>
                      </div>

                      <div className="sams-parent-encouragement-box">
                        <SparklesIcon size={18} color="var(--accent)" />
                        <p>
                          Consistent praise and encouragement build strong study habits for exams and lifelong learning.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </TrialGate>

      <style>{`
        .sams-parent-container {
          max-width: 1140px;
          margin: 0 auto;
        }

        .sams-parent-hero-banner {
          background: linear-gradient(135deg, #071E3D 0%, #0B2E59 60%, #154360 100%);
          border-radius: var(--radius-2xl);
          padding: 24px 28px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          box-shadow: var(--shadow-md);
        }

        .sams-parent-hero-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .sams-child-avatar {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%);
          color: white;
          font-weight: 800;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-child-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #BAE6FD;
          margin-bottom: 2px;
        }

        .sams-child-name {
          font-size: 22px;
          font-weight: 800;
          color: white;
          letter-spacing: -0.02em;
        }

        .sams-child-school-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.75);
          margin-top: 4px;
        }

        .sams-parent-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        .sams-parent-main-grid {
          display: grid;
          grid-template-columns: 1.45fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        .sams-parent-section-header {
          margin-bottom: 16px;
        }

        .sams-parent-activities-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sams-parent-act-card {
          padding: 20px;
          border: 1px solid var(--border-subtle);
        }

        .sams-act-top-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .sams-parent-act-subject {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-parent-act-time {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-parent-act-desc {
          font-size: 13px;
          font-style: italic;
          color: var(--text-secondary);
          background: var(--bg-card-muted);
          padding: 8px 12px;
          border-radius: var(--radius-md);
          margin: 6px 0 12px;
        }

        .sams-teacher-note-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 12px;
          color: #0369A1;
          margin-bottom: 14px;
        }

        .sams-note-badge {
          font-weight: 700;
        }

        .sams-parent-rating-form {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: var(--radius-lg);
          padding: 12px 16px;
        }

        .sams-parent-rate-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .sams-rate-label {
          font-size: 13px;
          font-weight: 700;
          color: #92400E;
        }

        .sams-parent-comment-row {
          display: flex;
          gap: 8px;
        }

        /* Report Column */
        .sams-parent-report-card {
          padding: 22px;
        }

        .sams-report-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 16px;
        }

        .sams-report-card-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-report-card-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-report-compact-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sams-preview-stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 13px;
        }

        .sams-preview-stat-row .label {
          color: var(--text-secondary);
        }

        .sams-preview-stat-row .val {
          color: var(--primary);
          font-weight: 700;
        }

        .sams-parent-encouragement-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--accent-soft);
          border-radius: var(--radius-md);
          padding: 12px;
          font-size: 12px;
          color: var(--primary);
          line-height: 1.4;
          margin-top: 8px;
        }

        @media (max-width: 900px) {
          .sams-parent-metrics-grid {
            grid-template-columns: 1fr;
          }
          .sams-parent-main-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}