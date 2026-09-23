import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button, Badge, EmptyState } from "../../components/UI/index.jsx";
import {
  TrophyIcon,
  DownloadIcon,
  ClockIcon,
  SparklesIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  FlameIcon,
} from "../../components/UI/Icons.jsx";
import { toPng } from "html-to-image";

function getRankBadge(rank) {
  if (rank === 1) return { icon: "🥇", label: "Gold", class: "rank-gold" };
  if (rank === 2) return { icon: "🥈", label: "Silver", class: "rank-silver" };
  if (rank === 3) return { icon: "🥉", label: "Bronze", class: "rank-bronze" };
  return { icon: null, label: `#${rank}`, class: "rank-other" };
}

export default function StudentLeaderboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [rows, setRows] = useState([]);
  const [weekStart, setWeekStart] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  async function loadLeaderboard() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const d = await api.get("/api/student/me/leaderboard");
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

  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => (b.avgHoursPerDay || 0) - (a.avgHoursPerDay || 0));
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [rows]);

  const top3 = useMemo(() => {
    return [
      sortedRows[1] || null, // 2nd (Silver, Left)
      sortedRows[0] || null, // 1st (Gold, Center)
      sortedRows[2] || null, // 3rd (Bronze, Right)
    ];
  }, [sortedRows]);

  const remainingRows = useMemo(() => {
    return sortedRows.slice(3);
  }, [sortedRows]);

  async function handleDownloadWhatsAppCard() {
    try {
      const node = cardRef.current;
      if (!node) return;
      setDownloading(true);
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `SAMS_Leaderboard_${weekStart || "current"}.png`;
      a.click();
      toast.show("🎉 Image downloaded! Perfect for your WhatsApp Status.");
    } catch {
      toast.show("Download failed, please try again", "error");
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    const printContent = document.getElementById("sams-printable-table")?.outerHTML || "";
    const printWin = window.open("", "_blank");
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SAMS Weekly Leaderboard - ${weekStart}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 24px; color: #0F172A; }
            .header { text-align: center; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 2px solid #E2E8F0; }
            .header h1 { margin: 0; font-size: 22px; color: #0B2E59; }
            .header p { margin: 4px 0 0; color: #64748B; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
            th, td { border: 1px solid #E2E8F0; padding: 10px 14px; text-align: left; }
            th { background: #F8FAFC; font-weight: 700; color: #475569; }
            .legal { margin-top: 24px; font-size: 11px; background: #F8FAFC; padding: 12px; border: 1px dashed #CBD5E1; border-radius: 8px; color: #64748B; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SAMS — Weekly Academic Leaderboard</h1>
            <p>Week of ${weekStart || "Current Week"} · Official Student Ranking</p>
          </div>
          ${printContent}
          <div class="legal">${t("legalNote")}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  return (
    <Layout
      title={t("leaderboard")}
      subtitle="Weekly class ranking based on verified study hours"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-leaderboard-container">
          {/* Top Actions & Header */}
          <div className="sams-lb-action-bar">
            <div className="sams-lb-meta-tag">
              <SparklesIcon size={16} color="var(--accent)" />
              <span>{weekStart ? `Week of ${weekStart}` : "Current Week"}</span>
            </div>

            <div className="sams-lb-btns">
              <Button
                variant="primary"
                size="sm"
                icon={<DownloadIcon size={15} />}
                loading={downloading}
                onClick={handleDownloadWhatsAppCard}
              >
                {t("shareForWhatsapp")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                {t("downloadPdf")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCwIcon size={14} />}
                onClick={loadLeaderboard}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="sams-lb-loading">
              <Card>
                <div style={{ height: 260, background: "#F1F5F9", borderRadius: 12 }} />
              </Card>
            </div>
          ) : sortedRows.length === 0 ? (
            <Card>
              <EmptyState
                icon={<TrophyIcon size={40} color="#D97706" />}
                title="No Rankings Available Yet"
                description="Study activities logged this week will appear on the leaderboard."
              />
            </Card>
          ) : (
            <div ref={cardRef} className="sams-lb-content-wrap">
              {/* Olympic Top-3 Podium */}
              <div className="sams-podium-section">
                {/* 2nd Place (Silver) */}
                {top3[0] ? (
                  <div className="sams-podium-slot rank-2">
                    <div className="sams-podium-avatar-wrap silver">
                      <span className="sams-avatar-letter">
                        {top3[0].studentName?.charAt(0) || "2"}
                      </span>
                      <span className="sams-podium-medal">🥈</span>
                    </div>
                    <div className="sams-podium-name">{top3[0].studentName}</div>
                    <div className="sams-podium-hours">
                      <ClockIcon size={13} />
                      <span>{top3[0].avgHoursPerDay}h / day</span>
                    </div>
                    <div className="sams-podium-pillar pillar-2">
                      <span className="sams-podium-num">2</span>
                    </div>
                  </div>
                ) : <div className="sams-podium-slot empty" />}

                {/* 1st Place (Gold) */}
                {top3[1] ? (
                  <div className="sams-podium-slot rank-1">
                    <div className="sams-crown-glow">👑</div>
                    <div className="sams-podium-avatar-wrap gold">
                      <span className="sams-avatar-letter">
                        {top3[1].studentName?.charAt(0) || "1"}
                      </span>
                      <span className="sams-podium-medal">🥇</span>
                    </div>
                    <div className="sams-podium-name leader">{top3[1].studentName}</div>
                    <div className="sams-podium-hours gold-text">
                      <FlameIcon size={14} color="#D97706" />
                      <span>{top3[1].avgHoursPerDay}h / day</span>
                    </div>
                    <div className="sams-podium-pillar pillar-1">
                      <span className="sams-podium-num">1</span>
                    </div>
                  </div>
                ) : <div className="sams-podium-slot empty" />}

                {/* 3rd Place (Bronze) */}
                {top3[2] ? (
                  <div className="sams-podium-slot rank-3">
                    <div className="sams-podium-avatar-wrap bronze">
                      <span className="sams-avatar-letter">
                        {top3[2].studentName?.charAt(0) || "3"}
                      </span>
                      <span className="sams-podium-medal">🥉</span>
                    </div>
                    <div className="sams-podium-name">{top3[2].studentName}</div>
                    <div className="sams-podium-hours">
                      <ClockIcon size={13} />
                      <span>{top3[2].avgHoursPerDay}h / day</span>
                    </div>
                    <div className="sams-podium-pillar pillar-3">
                      <span className="sams-podium-num">3</span>
                    </div>
                  </div>
                ) : <div className="sams-podium-slot empty" />}
              </div>

              {/* Leaderboard Table Card */}
              <Card className="sams-lb-table-card">
                <div id="sams-printable-table" className="sams-table-wrap">
                  <table className="sams-table">
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Rank</th>
                        <th>Student Name</th>
                        <th style={{ width: 180 }}>{t("avgHoursPerDay")}</th>
                        <th style={{ width: 140 }}>Weekly Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedRows.map((r) => {
                        const badge = getRankBadge(r.rank);
                        const isPositive = (r.changePercent || 0) >= 0;
                        return (
                          <tr key={r.studentId || r.studentName} className={`sams-lb-row ${badge.class}`}>
                            <td>
                              <div className="sams-rank-cell">
                                {badge.icon ? (
                                  <span className="sams-rank-medal">{badge.icon}</span>
                                ) : (
                                  <span className="sams-rank-circle">#{r.rank}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="sams-student-cell">
                                <div className="sams-cell-avatar">
                                  {r.studentName?.charAt(0) || "S"}
                                </div>
                                <span className="sams-cell-name">{r.studentName}</span>
                              </div>
                            </td>
                            <td>
                              <div className="sams-hours-cell">
                                <strong>{r.avgHoursPerDay}</strong>
                                <span>hrs / day</span>
                              </div>
                            </td>
                            <td>
                              <span className={`sams-trend-badge ${isPositive ? "positive" : "negative"}`}>
                                {isPositive ? "↑ " : "↓ "}
                                {Math.abs(r.changePercent || 0)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </TrialGate>

      <style>{`
        .sams-leaderboard-container {
          max-width: 960px;
          margin: 0 auto;
        }

        .sams-lb-action-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        .sams-lb-meta-tag {
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

        .sams-lb-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Podium Section */
        .sams-podium-section {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 16px;
          padding: 30px 16px 0;
          margin-bottom: 24px;
          background: linear-gradient(180deg, rgba(234, 244, 252, 0.4) 0%, rgba(246, 248, 251, 0) 100%);
          border-radius: var(--radius-2xl);
        }

        .sams-podium-slot {
          flex: 1;
          max-width: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .sams-podium-slot.empty {
          visibility: hidden;
        }

        .sams-crown-glow {
          font-size: 22px;
          margin-bottom: 2px;
          animation: slideUp 0.6s ease infinite alternate;
        }

        .sams-podium-avatar-wrap {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          color: white;
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .sams-podium-avatar-wrap.gold {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35);
          font-size: 26px;
        }

        .sams-podium-avatar-wrap.silver {
          background: linear-gradient(135deg, #94A3B8 0%, #64748B 100%);
          box-shadow: 0 6px 16px rgba(100, 116, 139, 0.3);
        }

        .sams-podium-avatar-wrap.bronze {
          background: linear-gradient(135deg, #D97706 0%, #92400E 100%);
          box-shadow: 0 6px 16px rgba(180, 83, 9, 0.3);
        }

        .sams-podium-medal {
          position: absolute;
          bottom: -4px;
          right: -4px;
          font-size: 20px;
        }

        .sams-podium-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 2px;
          max-width: 160px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sams-podium-name.leader {
          font-size: 16px;
          color: #B45309;
        }

        .sams-podium-hours {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .sams-podium-hours.gold-text {
          color: #B45309;
          font-weight: 700;
        }

        .sams-podium-pillar {
          width: 100%;
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.9);
          box-shadow: var(--shadow-sm);
        }

        .pillar-1 {
          height: 110px;
          background: linear-gradient(180deg, #F59E0B 0%, #D97706 100%);
        }

        .pillar-2 {
          height: 80px;
          background: linear-gradient(180deg, #94A3B8 0%, #64748B 100%);
        }

        .pillar-3 {
          height: 60px;
          background: linear-gradient(180deg, #D97706 0%, #92400E 100%);
        }

        /* Leaderboard Table */
        .sams-lb-table-card {
          padding: 0;
          overflow: hidden;
        }

        .sams-rank-cell {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-rank-medal {
          font-size: 20px;
        }

        .sams-rank-circle {
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .sams-student-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sams-cell-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-cell-name {
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-hours-cell {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .sams-hours-cell strong {
          font-size: 16px;
          color: var(--primary);
        }

        .sams-hours-cell span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .sams-lb-row.rank-gold td {
          background: #FFFBEB;
        }

        @media (max-width: 600px) {
          .sams-podium-section {
            gap: 8px;
            padding: 20px 8px 0;
          }
          .sams-podium-avatar-wrap.gold {
            width: 58px;
            height: 58px;
            font-size: 20px;
          }
          .sams-podium-avatar-wrap {
            width: 46px;
            height: 46px;
            font-size: 16px;
          }
          .sams-podium-name {
            font-size: 12px;
          }
        }
      `}</style>
    </Layout>
  );
}