import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, StatCard, Button, ProgressBar, Skeleton, Badge, EmptyState } from "../../components/UI/index.jsx";
import {
  ClockIcon,
  BookOpenIcon,
  PlusIcon,
  BarChartIcon,
  TrophyIcon,
  LinkIcon,
  CreditCardIcon,
  FlameIcon,
  SparklesIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  StarIcon,
} from "../../components/UI/Icons.jsx";

export default function StudentDashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning");
    if (hour < 17) return t("goodAfternoon");
    return t("goodEvening");
  }, [t]);

  // Current formatted date
  const dateFormatted = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  async function loadDashboard() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const [dash, acts] = await Promise.all([
        api.get("/api/student/me/dashboard"),
        api.get("/api/student/me/activities").catch(() => []),
      ]);
      setData(dash);
      setActivities(acts || []);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line
  }, []);

  // Today's study time calculation from activities
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const todayMinutes = useMemo(() => {
    return activities
      .filter((a) => a.startDate === todayStr)
      .reduce((sum, a) => sum + (Number(a.durationMinutes) || 0), 0);
  }, [activities, todayStr]);

  const todayHoursFormatted = useMemo(() => {
    const h = Math.floor(todayMinutes / 60);
    const m = todayMinutes % 60;
    if (h === 0 && m === 0) return "0m";
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }, [todayMinutes]);

  // Standard recommended target for students (2 hours = 120 mins)
  const targetMinutes = 120;
  const progressPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));

  const changePositive = (data?.changePercentVsLastWeek || 0) >= 0;

  // Recent 3 activities
  const recentActivities = useMemo(() => {
    return activities.slice(0, 3);
  }, [activities]);

  return (
    <Layout title={t("dashboard")}>
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-student-dash">
          {/* Hero Welcome Banner */}
          <div className="sams-dash-hero animate-fade-in">
            <div className="sams-hero-content">
              <div className="sams-hero-badge">
                <SparklesIcon size={14} color="#38BDF8" />
                <span>{dateFormatted}</span>
              </div>
              <h1 className="sams-hero-title">
                {greeting}, {data?.studentName || "Student"} 👋
              </h1>
              <p className="sams-hero-tagline">
                {t("readyToProgress")} {t("studyJourneyContinues")}
              </p>
            </div>

            <div className="sams-hero-action">
              <Button
                variant="secondary"
                size="md"
                icon={<RefreshCwIcon size={16} />}
                onClick={loadDashboard}
                disabled={loading}
              >
                {loading ? "Updating..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Today's Momentum Card + Trial Countdown */}
          <div className="sams-dash-top-row">
            {/* Today's Study Progress Card */}
            <Card hover className="sams-progress-hero-card">
              <div className="sams-progress-hero-header">
                <div>
                  <div className="sams-card-tag">{t("todayProgress")}</div>
                  <div className="sams-progress-time-display">
                    <span className="sams-time-big">{todayHoursFormatted}</span>
                    <span className="sams-target-sub">/ 2h target</span>
                  </div>
                </div>
                <div className="sams-progress-circle-badge">
                  <FlameIcon size={24} color={todayMinutes > 0 ? "#F59E0B" : "#94A3B8"} />
                  <span className="sams-streak-pct">{progressPercent}%</span>
                </div>
              </div>

              <div className="sams-progress-bar-wrap">
                <ProgressBar value={todayMinutes} max={targetMinutes} height={10} variant="gradient" />
              </div>

              <div className="sams-progress-hero-footer">
                <span className="sams-progress-status-note">
                  {todayMinutes >= targetMinutes
                    ? "🎉 Daily target achieved! Fantastic job!"
                    : todayMinutes > 0
                    ? "Keep going! You're making real progress today."
                    : "Ready to study? Log your first session today!"}
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon size={15} />}
                  onClick={() => nav("/student/activities")}
                >
                  {t("addActivity")}
                </Button>
              </div>
            </Card>

            {/* Trial / Plan Status Card */}
            <Card hover className="sams-trial-status-card">
              <div className="sams-trial-card-top">
                <div className="sams-card-tag">Account Status</div>
                <Badge variant={data?.daysLeft > 3 ? "success" : "warning"} dot>
                  {data?.daysLeft > 0 ? "Trial Active" : "Subscribed"}
                </Badge>
              </div>
              <div className="sams-trial-number-row">
                <span className="sams-trial-days">{data?.daysLeft ?? "—"}</span>
                <span className="sams-trial-unit">{t("daysLeft")}</span>
              </div>
              <p className="sams-trial-sub">
                Expires: {data?.trialExpDate || "Lifetime"}
              </p>
              <Button
                variant="outline"
                size="sm"
                iconRight={<ArrowRightIcon size={14} />}
                onClick={() => nav("/subscription")}
                className="sams-trial-manage-btn"
              >
                {t("subscription")}
              </Button>
            </Card>
          </div>

          {/* Key Study Metrics Row */}
          <div className="sams-metrics-grid">
            <StatCard
              icon={<ClockIcon size={22} />}
              iconColor="blue"
              label={t("avgHoursPerDay")}
              value={data?.avgHoursPerDay ?? 0}
              unit="h / day"
              sublabel="Daily average this week"
              loading={loading && !data}
            />

            <StatCard
              icon={<BookOpenIcon size={22} />}
              iconColor="purple"
              label={t("mostSpentSubject")}
              value={data?.mostSpentSubject || "—"}
              sublabel="Your top focus this week"
              loading={loading && !data}
            />

            <StatCard
              icon={<BarChartIcon size={22} />}
              iconColor={changePositive ? "green" : "amber"}
              label={t("changeVsLastWeek")}
              value={`${changePositive ? "+" : ""}${data?.changePercentVsLastWeek ?? 0}%`}
              change={`${changePositive ? "+" : ""}${data?.changePercentVsLastWeek ?? 0}%`}
              changePositive={changePositive}
              sublabel={changePositive ? "Great improvement!" : "Keep building consistency"}
              loading={loading && !data}
            />
          </div>

          {/* Quick Actions (Prompt Requirement 8) */}
          <div className="sams-section-block">
            <div className="sams-section-title-row">
              <div>
                <h2 className="sams-section-heading">{t("quickActions")}</h2>
                <p className="sams-section-sub">Jump straight to what you need in 1 click</p>
              </div>
            </div>

            <div className="sams-quick-actions-grid">
              {/* Action 1: Add Activity */}
              <div
                className="sams-quick-action-card highlight"
                onClick={() => nav("/student/activities")}
              >
                <div className="sams-qa-icon primary-bg">
                  <PlusIcon size={22} color="white" />
                </div>
                <div className="sams-qa-info">
                  <h3 className="sams-qa-title">{t("addActivity")}</h3>
                  <p className="sams-qa-desc">{t("addActivityDesc")}</p>
                </div>
                <span className="sams-qa-arrow">→</span>
              </div>

              {/* Action 2: View Activities */}
              <div
                className="sams-quick-action-card"
                onClick={() => nav("/student/activities")}
              >
                <div className="sams-qa-icon blue-bg">
                  <BookOpenIcon size={22} color="#0284C7" />
                </div>
                <div className="sams-qa-info">
                  <h3 className="sams-qa-title">{t("viewActivities")}</h3>
                  <p className="sams-qa-desc">{t("viewActivitiesDesc")}</p>
                </div>
                <span className="sams-qa-arrow">→</span>
              </div>

              {/* Action 3: View Progress & Leaderboard */}
              <div
                className="sams-quick-action-card"
                onClick={() => nav("/student/leaderboard")}
              >
                <div className="sams-qa-icon gold-bg">
                  <TrophyIcon size={22} color="#D97706" />
                </div>
                <div className="sams-qa-info">
                  <h3 className="sams-qa-title">{t("leaderboard")}</h3>
                  <p className="sams-qa-desc">See class rankings & WhatsApp card</p>
                </div>
                <span className="sams-qa-arrow">→</span>
              </div>

              {/* Action 4: Weekly Report */}
              <div
                className="sams-quick-action-card"
                onClick={() => nav("/student/report")}
              >
                <div className="sams-qa-icon green-bg">
                  <BarChartIcon size={22} color="#16A34A" />
                </div>
                <div className="sams-qa-info">
                  <h3 className="sams-qa-title">{t("weeklyReport")}</h3>
                  <p className="sams-qa-desc">{t("weeklyReportDesc")}</p>
                </div>
                <span className="sams-qa-arrow">→</span>
              </div>

              {/* Action 5: Map Teacher */}
              <div
                className="sams-quick-action-card"
                onClick={() => nav("/student/map-teacher")}
              >
                <div className="sams-qa-icon purple-bg">
                  <LinkIcon size={22} color="#9333EA" />
                </div>
                <div className="sams-qa-info">
                  <h3 className="sams-qa-title">{t("mapTeacher")}</h3>
                  <p className="sams-qa-desc">Link with school teacher via code or QR</p>
                </div>
                <span className="sams-qa-arrow">→</span>
              </div>

              {/* Action 6: Subscription */}
              <div
                className="sams-quick-action-card"
                onClick={() => nav("/subscription")}
              >
                <div className="sams-qa-icon cyan-bg">
                  <CreditCardIcon size={22} color="#0891B2" />
                </div>
                <div className="sams-qa-info">
                  <h3 className="sams-qa-title">{t("subscription")}</h3>
                  <p className="sams-qa-desc">{t("subscriptionDesc")}</p>
                </div>
                <span className="sams-qa-arrow">→</span>
              </div>
            </div>
          </div>

          {/* Recent Completed Activities: "What did I do?" */}
          <div className="sams-section-block">
            <div className="sams-section-title-row">
              <div>
                <h2 className="sams-section-heading">{t("recentActivities")}</h2>
                <p className="sams-section-sub">Your latest logged study sessions</p>
              </div>
              {activities.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={<ArrowRightIcon size={14} />}
                  onClick={() => nav("/student/activities")}
                >
                  View All ({activities.length})
                </Button>
              )}
            </div>

            {loading ? (
              <div className="sams-recent-list">
                <Skeleton height={68} style={{ marginBottom: 10 }} />
                <Skeleton height={68} />
              </div>
            ) : recentActivities.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<BookOpenIcon size={32} color="#2E86C1" />}
                  title={t("noActivitiesYet")}
                  description={t("studyJourneyStartsHere")}
                  actionText={t("addYourFirstActivity")}
                  actionIcon={<PlusIcon size={16} />}
                  onAction={() => nav("/student/activities")}
                />
              </Card>
            ) : (
              <div className="sams-recent-list">
                {recentActivities.map((act) => (
                  <Card key={act.activityId} hover padding="sm" className="sams-recent-card">
                    <div className="sams-recent-left">
                      <div className="sams-recent-subject-badge">
                        {act.subjectName?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="sams-recent-subject">{act.subjectName}</div>
                        <div className="sams-recent-time">
                          <span>{act.startDate}</span> &nbsp;·&nbsp;
                          <span>{act.startTime} – {act.endTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sams-recent-right">
                      <Badge variant="primary" size="md">
                        {act.durationMinutes} min
                      </Badge>
                      {(act.tRate || act.pRate) && (
                        <div className="sams-recent-stars">
                          <StarIcon size={14} color="#F59E0B" style={{ fill: "#F59E0B" }} />
                          <span>{act.tRate || act.pRate}★</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </TrialGate>

      <style>{`
        .sams-student-dash {
          max-width: 1160px;
          margin: 0 auto;
        }

        /* Hero Banner */
        .sams-dash-hero {
          background: linear-gradient(135deg, #071E3D 0%, #0B2E59 60%, #154360 100%);
          border-radius: var(--radius-2xl);
          padding: 28px 32px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          box-shadow: 0 10px 25px -5px rgba(11, 46, 89, 0.25);
          position: relative;
          overflow: hidden;
        }

        .sams-dash-hero::after {
          content: "";
          position: absolute;
          right: -40px;
          top: -40px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .sams-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 4px 12px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 600;
          color: #BAE6FD;
          margin-bottom: 10px;
        }

        .sams-hero-title {
          font-size: 26px;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .sams-hero-tagline {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.75);
        }

        /* Top Row Cards */
        .sams-dash-top-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        .sams-progress-hero-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sams-card-tag {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .sams-progress-hero-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sams-progress-time-display {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .sams-time-big {
          font-size: 32px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.03em;
        }

        .sams-target-sub {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sams-progress-circle-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #FEF3C7;
          padding: 8px 14px;
          border-radius: var(--radius-pill);
        }

        .sams-streak-pct {
          font-size: 16px;
          font-weight: 800;
          color: #B45309;
        }

        .sams-progress-bar-wrap {
          margin-bottom: 18px;
        }

        .sams-progress-hero-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
        }

        .sams-progress-status-note {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        /* Trial Card */
        .sams-trial-status-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sams-trial-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sams-trial-number-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 12px 0 4px;
        }

        .sams-trial-days {
          font-size: 36px;
          font-weight: 800;
          color: var(--primary);
          line-height: 1;
        }

        .sams-trial-unit {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .sams-trial-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        .sams-trial-manage-btn {
          width: 100%;
        }

        /* Metrics Grid */
        .sams-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        /* Section Blocks */
        .sams-section-block {
          margin-bottom: 32px;
        }

        .sams-section-title-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sams-section-heading {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-section-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        /* Quick Actions Grid */
        .sams-quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .sams-quick-action-card {
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-xs);
        }

        .sams-quick-action-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
          box-shadow: var(--shadow-card-hover);
        }

        .sams-quick-action-card.highlight {
          border-color: rgba(46, 134, 193, 0.4);
          background: linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%);
        }

        .sams-qa-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .primary-bg { background: var(--primary-gradient); }
        .blue-bg { background: #E0F2FE; }
        .gold-bg { background: #FEF3C7; }
        .green-bg { background: #DCFCE7; }
        .purple-bg { background: #F3E8FF; }
        .cyan-bg { background: #CFFAFE; }

        .sams-qa-info {
          flex: 1;
          min-width: 0;
        }

        .sams-qa-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .sams-qa-desc {
          font-size: 12px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sams-qa-arrow {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-muted);
          transition: transform var(--transition-fast);
        }

        .sams-quick-action-card:hover .sams-qa-arrow {
          color: var(--accent);
          transform: translateX(3px);
        }

        /* Recent List */
        .sams-recent-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sams-recent-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
        }

        .sams-recent-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .sams-recent-subject-badge {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-md);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .sams-recent-subject {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-recent-time {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-recent-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sams-recent-stars {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 700;
          color: #D97706;
          background: #FEF3C7;
          padding: 4px 8px;
          border-radius: var(--radius-pill);
        }

        /* Responsive Breakpoints */
        @media (max-width: 900px) {
          .sams-dash-top-row {
            grid-template-columns: 1fr;
          }
          .sams-metrics-grid {
            grid-template-columns: 1fr;
          }
          .sams-quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .sams-dash-hero {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
          }
          .sams-hero-title {
            font-size: 22px;
          }
          .sams-quick-actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}