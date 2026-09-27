import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Trophy, Download, Printer, TrendingUp, TrendingDown, CloudOff } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Avatar, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#B45309"];

export default function Leaderboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rows, setRows] = useState([]);
  const [weekStart, setWeekStart] = useState("");
  const cardRef = useRef(null);
  const myName = localStorage.getItem("displayName") || "";

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const d = await api.get("/api/student/me/leaderboard");
      setWeekStart(d.weekStart);
      setRows(d.rows || []);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => (b.avgHoursPerDay || 0) - (a.avgHoursPerDay || 0));
    return copy.map((x, idx) => ({ ...x, rank: idx + 1 }));
  }, [rows]);

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const myRow = sorted.find((r) => r.studentName === myName);

  async function downloadCard() {
    try {
      const node = cardRef.current;
      if (!node) return;
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `SAMS_Leaderboard_${weekStart}.png`;
      a.click();
      toast.show("Image downloaded", "success");
    } catch {
      toast.show("Download failed", "error");
    }
  }

  function printTable() {
    const html = document.getElementById("printArea")?.outerHTML || "";
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>SAMS Leaderboard</title>
          <style>
            body { font-family: "Noto Sans Sinhala", Arial; padding: 16px; }
            .wm { position: fixed; inset: 0; display: grid; place-items: center; opacity: 0.08; font-size: 56px; font-weight: 800; transform: rotate(-18deg); }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f6fb; }
            .legal { margin-top: 12px; font-size: 12px; background: #f3f6fb; padding: 10px; border: 1px dashed #ccc; }
          </style>
        </head>
        <body>
          <div class="wm">${t("watermark")}</div>
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
      title={t("leaderboard")}
      subtitle={weekStart ? `Week of ${weekStart}` : undefined}
      actions={
        !loading && rows.length > 0 && (
          <>
            <button className="btn btn-outline btn-sm" type="button" onClick={printTable}>
              <Printer size={14} /> {t("print")}
            </button>
            <button className="btn btn-accent btn-sm" type="button" onClick={downloadCard}>
              <Download size={14} /> {t("downloadImage")}
            </button>
          </>
        )
      }
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="stack">
            <Skeleton height={160} radius={16} />
            <Skeleton height={220} radius={16} />
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Trophy size={22} />} title="No leaderboard data yet" message="Once students start logging study time this week, rankings will appear here." />
          </div>
        ) : (
          <div className="stack" style={{ gap: 20 }}>
            {myRow && (
              <div
                className="card card-pad-lg"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-700))", color: "#fff", border: "none" }}
              >
                <div className="between">
                  <div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Your position</div>
                    <div style={{ fontSize: 30, fontWeight: 800 }}>#{myRow.rank}</div>
                    <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}>{myRow.avgHoursPerDay}h avg/day this week</div>
                  </div>
                  <div className="chip" style={{ background: "rgba(255,255,255,0.16)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                    {myRow.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(myRow.changePercent)}% {t("vsLastWeek")}
                  </div>
                </div>
              </div>
            )}

            {/* Podium */}
            <div className="card">
              <div className="h2">{t("leaderboardCardTitle")}</div>
              <div className="row" style={{ justifyContent: "center", alignItems: "flex-end", gap: 14, padding: "8px 0 4px" }}>
                {[top3[1], top3[0], top3[2]].map((r, i) =>
                  r ? (
                    <div
                      key={r.rank}
                      className="stack"
                      style={{ alignItems: "center", gap: 8, minWidth: 100, order: i === 1 ? 0 : undefined }}
                    >
                      <Avatar name={r.studentName} size={r.rank === 1 ? "lg" : undefined} />
                      <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }} className="truncate">
                        {r.studentName}
                      </div>
                      <div className="stat-label">{r.avgHoursPerDay}h/day</div>
                      <div
                        style={{
                          width: 84,
                          height: r.rank === 1 ? 72 : r.rank === 2 ? 54 : 40,
                          background: MEDAL_COLORS[r.rank - 1],
                          borderRadius: "10px 10px 0 0",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center",
                          paddingTop: 8,
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 18
                        }}
                      >
                        {r.rank}
                      </div>
                    </div>
                  ) : (
                    <div key={i} style={{ minWidth: 100 }} />
                  )
                )}
              </div>
            </div>

            {/* Rest of ranking */}
            {rest.length > 0 && (
              <div className="card">
                <div className="stack" style={{ gap: 6 }}>
                  {rest.map((r) => (
                    <div
                      key={r.rank}
                      className="between"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        background: r.studentName === myName ? "var(--primary-50)" : "transparent"
                      }}
                    >
                      <div className="center-v" style={{ gap: 12 }}>
                        <div style={{ width: 24, fontWeight: 700, color: "var(--text-muted)", fontSize: 13 }}>{r.rank}</div>
                        <Avatar name={r.studentName} size="sm" />
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.studentName}</div>
                      </div>
                      <div className="center-v" style={{ gap: 10 }}>
                        <span className={"stat-trend " + (r.changePercent >= 0 ? "up" : "down")}>
                          {r.changePercent >= 0 ? "▲" : "▼"} {Math.abs(r.changePercent)}%
                        </span>
                        <span className="badge badge-primary">{r.avgHoursPerDay}h/day</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="faint" style={{ fontSize: 12.5, textAlign: "center" }}>
              Rankings reset weekly. Keep logging your sessions to move up! 🎯
            </p>

            {/* Hidden share card used for image export */}
            <div style={{ position: "absolute", left: -9999, top: -9999 }} aria-hidden="true">
              <div ref={cardRef} className="watermarkBox" style={{ maxWidth: 560, background: "#fff" }}>
                <div className="watermarkText">{t("watermark")}</div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{t("leaderboardCardTitle")}</div>
                  <div className="badge">{weekStart}</div>
                </div>
                <div style={{ height: 10 }} />
                <div style={{ display: "grid", gap: 8 }}>
                  {sorted.slice(0, 10).map((r) => (
                    <div
                      key={r.rank}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        border: "1px solid #e4e7ef",
                        borderRadius: 12,
                        padding: "8px 10px",
                        background: "#fff"
                      }}
                    >
                      <div style={{ fontWeight: 800 }}>
                        {r.rank}. {r.studentName}
                      </div>
                      <div className="badge">{r.avgHoursPerDay} h/day</div>
                    </div>
                  ))}
                </div>
                <div className="legalNote">{t("legalNote")}</div>
              </div>
            </div>

            {/* Hidden printable table */}
            <div style={{ display: "none" }}>
              <div id="printArea">
                <div className="h2">{t("leaderboard")}</div>
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>{t("avgHoursPerDay")}</th>
                      <th>{t("changeVsLastWeek")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((r) => (
                      <tr key={r.rank}>
                        <td>{r.rank}</td>
                        <td>{r.studentName}</td>
                        <td>{r.avgHoursPerDay}</td>
                        <td>{r.changePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}
