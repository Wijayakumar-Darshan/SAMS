import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, StatCard, Button, Badge, EmptyState } from "../../components/UI/index.jsx";
import Stars from "../../components/Stars.jsx";
import {
  DownloadIcon,
  RefreshCwIcon,
  BarChartIcon,
  ClockIcon,
  BookOpenIcon,
  AwardIcon,
  CheckCircleIcon,
  CalendarIcon,
  SparklesIcon,
} from "../../components/UI/Icons.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SUBJECT_COLORS = ["#0B2E59", "#2E86C1", "#0284C7", "#38BDF8", "#8B5CF6", "#10B981", "#F59E0B"];

export default function StudentReport() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [report, setReport] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  async function loadReport() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const [rep, acts] = await Promise.all([
        api.get("/api/student/me/weekly-report"),
        api.get("/api/student/me/activities").catch(() => []),
      ]);
      setReport(rep);
      setWeekStart(rep?.weekStart || "");
      setActivities(acts || []);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line
  }, []);

  const chartData = useMemo(() => {
    const obj = report?.hoursBySubject || {};
    return Object.keys(obj).map((k) => ({
      subject: k,
      hours: Number(obj[k] || 0),
    }));
  }, [report]);

  const changePositive = (report?.changePercentVsLastWeek || 0) >= 0;

  // Filter feedback from activities
  const feedbackItems = useMemo(() => {
    return activities.filter((a) => a.tRate || a.tComment || a.pRate || a.pComment);
  }, [activities]);

  function handlePrintPDF() {
    const node = printRef.current;
    if (!node) return;
    const html = node.outerHTML;
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SAMS Weekly Activity Report - ${weekStart}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 24px; color: #0F172A; }
            .wm { position: fixed; inset: 0; display: grid; place-items: center; opacity: 0.05; font-size: 72px; font-weight: 900; transform: rotate(-18deg); pointer-events: none; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 800; color: #0B2E59; margin: 0; }
            .sub { font-size: 13px; color: #64748B; margin: 4px 0 0; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .stat-box { border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; }
            .stat-label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; }
            .stat-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            th, td { border: 1px solid #E2E8F0; padding: 8px 12px; text-align: left; }
            th { background: #F8FAFC; font-weight: 700; color: #475569; }
            .legal { margin-top: 24px; font-size: 11px; background: #F8FAFC; padding: 12px; border: 1px dashed #CBD5E1; border-radius: 8px; color: #64748B; }
          </style>
        </head>
        <body>
          <div class="wm">${t("watermark")}</div>
          <div class="header">
            <div>
              <h1 class="title">SAMS — Weekly Activity Report</h1>
              <p class="sub">Official Academic Record · Week of ${weekStart}</p>
            </div>
            <div style="font-weight: 700; color: #0B2E59;">TIMETABLE.LK</div>
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
      title={t("report")}
      subtitle="Comprehensive weekly study analysis and feedback review"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-report-container">
          {/* Action Toolbar */}
          <div className="sams-report-toolbar">
            <div className="sams-report-week-tag">
              <CalendarIcon size={15} />
              <span>{weekStart ? `Week of ${weekStart}` : "Current Week"}</span>
            </div>

            <div className="sams-report-btns">
              <Button
                variant="primary"
                size="md"
                icon={<DownloadIcon size={16} />}
                onClick={handlePrintPDF}
                disabled={!report}
              >
                {t("downloadPdf")}
              </Button>
              <Button
                variant="outline"
                size="md"
                icon={<RefreshCwIcon size={14} />}
                onClick={loadReport}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>

          {loading && !report ? (
            <div className="sams-report-loading">
              <Card>
                <div style={{ height: 320, background: "#F1F5F9", borderRadius: 12 }} />
              </Card>
            </div>
          ) : !report ? (
            <Card>
              <EmptyState
                icon={<BarChartIcon size={40} color="var(--accent)" />}
                title="No Report Data Yet"
                description="Log your daily study activities to view comprehensive weekly analytics."
              />
            </Card>
          ) : (
            <div ref={printRef} className="sams-official-report-card">
              {/* Report Header Card */}
              <div className="sams-report-header-banner">
                <div className="sams-report-badge-box">
                  <div className="sams-report-icon-cube">S</div>
                  <div>
                    <h2 className="sams-report-official-title">Weekly Activity Report</h2>
                    <span className="sams-report-official-sub">
                      Student Activity Management System · Verified Academic Log
                    </span>
                  </div>
                </div>

                <div className="sams-report-meta-pill">
                  <span>Week Start: {weekStart}</span>
                </div>
              </div>

              {/* Section 1: Overview Cards (Prompt 15) */}
              <div className="sams-report-section">
                <h3 className="sams-report-section-title">1. Study Overview</h3>
                <div className="sams-report-stats-grid">
                  <StatCard
                    icon={<ClockIcon size={20} />}
                    iconColor="blue"
                    label={t("avgHoursPerDay")}
                    value={report.avgHoursPerDay ?? 0}
                    unit="h"
                    sublabel={`Best avg so far: ${report.bestAvg ?? 0}h`}
                  />
                  <StatCard
                    icon={<BookOpenIcon size={20} />}
                    iconColor="purple"
                    label={t("mostSpentSubject")}
                    value={report.mostSpentSubject || "—"}
                    sublabel={`${report.mostSpentHours ?? 0} hours spent`}
                  />
                  <StatCard
                    icon={<BarChartIcon size={20} />}
                    iconColor="amber"
                    label={t("leastSpentSubject")}
                    value={report.leastSpentSubject || "—"}
                    sublabel={`${report.leastSpentHours ?? 0} hours spent`}
                  />
                  <StatCard
                    icon={<AwardIcon size={20} />}
                    iconColor={changePositive ? "green" : "red"}
                    label={t("changeVsLastWeek")}
                    value={`${changePositive ? "+" : ""}${report.changePercentVsLastWeek ?? 0}%`}
                    changePositive={changePositive}
                    sublabel={changePositive ? "Improved vs last week" : "Slight decrease"}
                  />
                </div>
              </div>

              {/* Section 2: Subject Analysis (Recharts Bar Chart) */}
              <div className="sams-report-section">
                <h3 className="sams-report-section-title">2. Subject Distribution</h3>
                <Card className="sams-chart-container-card">
                  {chartData.length === 0 ? (
                    <div className="sams-chart-empty-msg">No subject hours recorded this week.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                        <XAxis
                          dataKey="subject"
                          tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#64748B" }}
                          axisLine={false}
                          tickLine={false}
                          unit="h"
                        />
                        <Tooltip
                          formatter={(value) => [`${value} hrs`, "Study Time"]}
                          contentStyle={{
                            background: "#FFFFFF",
                            borderRadius: 10,
                            border: "1px solid #E2E8F0",
                            boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
                          }}
                        />
                        <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                          {chartData.map((_, i) => (
                            <Cell key={`cell-${i}`} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* Section 3: Recent Activity Summary Table */}
              <div className="sams-report-section">
                <h3 className="sams-report-section-title">3. Activity Summary</h3>
                <div className="sams-table-wrap">
                  <table className="sams-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Time Range</th>
                        <th>Duration</th>
                        <th>Teacher Rating</th>
                        <th>Parent Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", color: "#94A3B8" }}>
                            No logged sessions found.
                          </td>
                        </tr>
                      ) : (
                        activities.slice(0, 8).map((act) => (
                          <tr key={act.activityId}>
                            <td>{act.startDate}</td>
                            <td><strong>{act.subjectName}</strong></td>
                            <td>{act.startTime} – {act.endTime}</td>
                            <td>{act.durationMinutes} min</td>
                            <td>
                              {act.tRate ? <Stars value={act.tRate} readOnly size={13} /> : "—"}
                            </td>
                            <td>
                              {act.pRate ? <Stars value={act.pRate} readOnly size={13} /> : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Teacher & Parent Feedback */}
              <div className="sams-report-section">
                <h3 className="sams-report-section-title">4. Teacher & Parent Feedback</h3>
                <div className="sams-report-feedback-grid">
                  {feedbackItems.length === 0 ? (
                    <Card style={{ gridColumn: "1 / -1", textAlign: "center", color: "#64748B", padding: 20 }}>
                      No teacher or parent feedback recorded for this period yet.
                    </Card>
                  ) : (
                    feedbackItems.slice(0, 4).map((f) => (
                      <Card key={f.activityId} className="sams-report-fb-card">
                        <div className="sams-report-fb-head">
                          <span className="sams-fb-subject">{f.subjectName}</span>
                          <span className="sams-fb-date">{f.startDate}</span>
                        </div>
                        {f.tComment && (
                          <div className="sams-fb-bubble teacher">
                            <div className="sams-fb-bubble-top">
                              <span className="sams-fb-role">{t("teacherFeedback")}</span>
                              {f.tRate ? <Stars value={f.tRate} readOnly size={13} /> : null}
                            </div>
                            <p className="sams-fb-text">“{f.tComment}”</p>
                          </div>
                        )}
                        {f.pComment && (
                          <div className="sams-fb-bubble parent">
                            <div className="sams-fb-bubble-top">
                              <span className="sams-fb-role">{t("parentFeedback")}</span>
                              {f.pRate ? <Stars value={f.pRate} readOnly size={13} /> : null}
                            </div>
                            <p className="sams-fb-text">“{f.pComment}”</p>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Legal Notice */}
              <div className="sams-report-legal">
                <span className="sams-legal-icon">📋</span>
                <span>{t("legalNote")}</span>
              </div>
            </div>
          )}
        </div>
      </TrialGate>

      <style>{`
        .sams-report-container {
          max-width: 1040px;
          margin: 0 auto;
        }

        .sams-report-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sams-report-week-tag {
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
          box-shadow: var(--shadow-xs);
        }

        .sams-report-btns {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Official Report Card */
        .sams-official-report-card {
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-2xl);
          padding: 32px;
          box-shadow: var(--shadow-sm);
        }

        .sams-report-header-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 2px solid var(--border-subtle);
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .sams-report-badge-box {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sams-report-icon-cube {
          width: 44px;
          height: 44px;
          background: var(--primary-gradient);
          color: white;
          font-size: 22px;
          font-weight: 900;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-report-official-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-report-official-sub {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-report-meta-pill {
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
        }

        /* Sections */
        .sams-report-section {
          margin-bottom: 30px;
        }

        .sams-report-section-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }

        .sams-report-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .sams-chart-container-card {
          padding: 20px;
          border: 1px solid var(--border-subtle);
        }

        .sams-chart-empty-msg {
          text-align: center;
          color: var(--text-muted);
          padding: 40px 0;
          font-size: 14px;
        }

        .sams-report-feedback-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .sams-report-fb-card {
          padding: 16px;
          border: 1px solid var(--border-subtle);
        }

        .sams-report-fb-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .sams-fb-subject {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-main);
        }

        .sams-fb-date {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sams-fb-bubble {
          padding: 10px 12px;
          border-radius: var(--radius-md);
          font-size: 12px;
          margin-top: 6px;
        }

        .sams-fb-bubble.teacher {
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
        }

        .sams-fb-bubble.parent {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
        }

        .sams-fb-bubble-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .sams-fb-role {
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-fb-text {
          font-style: italic;
          color: var(--text-secondary);
        }

        .sams-report-legal {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          background: var(--bg-card-muted);
          border: 1px dashed var(--border-strong);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          margin-top: 20px;
        }

        @media (max-width: 900px) {
          .sams-report-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .sams-report-feedback-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .sams-official-report-card {
            padding: 18px 16px;
          }
          .sams-report-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}