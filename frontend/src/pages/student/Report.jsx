import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Printer, Clock, TrendingUp, TrendingDown, BookOpen, Award, CloudOff } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { StatCard, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

export default function Report() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [report, setReport] = useState(null);
  const printRef = useRef(null);

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);
    try {
      const r = await api.get("/api/student/me/weekly-report");
      setReport(r);
      setWeekStart(r.weekStart);
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      setError(true);
      toast.show(err?.data?.message || "Failed to load report", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(() => {
    const obj = report?.hoursBySubject || {};
    return Object.keys(obj)
      .map((k) => ({ subject: k, hours: obj[k] }))
      .sort((a, b) => b.hours - a.hours);
  }, [report]);

  const totalHours = useMemo(() => chartData.reduce((s, x) => s + x.hours, 0), [chartData]);

  function printReport() {
    const node = printRef.current;
    if (!node) return;
    const html = node.outerHTML;
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>SAMS Weekly Report</title>
          <style>
            body { font-family: "Noto Sans Sinhala", Arial; padding: 16px; }
            .wm { position: fixed; inset: 0; display: grid; place-items: center; opacity: 0.08; font-size: 56px; font-weight: 800; transform: rotate(-18deg); }
            .card { border: 1px solid #d6e2f0; border-radius: 12px; padding: 14px; }
            .row { display: flex; gap: 10px; flex-wrap: wrap; }
            .col { flex: 1; min-width: 200px; }
            .badge { display: inline-block; padding: 4px 8px; border: 1px solid #d6e2f0; border-radius: 999px; background: #f3f6fb; font-size: 12px; }
            .legal { margin-top: 12px; font-size: 12px; background: #f3f6fb; padding: 10px; border: 1px dashed #ccc; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="wm">${t("watermark")}</div>
          ${html}
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <Layout
      title={t("report")}
      subtitle={weekStart ? `Week of ${weekStart}` : undefined}
      actions={
        report && (
          <button className="btn btn-accent btn-sm" type="button" onClick={printReport}>
            <Printer size={14} /> {t("downloadPdf")}
          </button>
        )
      }
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="stack">
            <div className="grid grid-4">
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
            </div>
            <Skeleton height={320} radius={16} />
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          </div>
        ) : !report || totalHours === 0 ? (
          <div className="card">
            <EmptyState icon={<BookOpen size={22} />} title={t("noActivityYet")} message="Once you log study activities this week, your report will appear here." />
          </div>
        ) : (
          <div ref={printRef} className="watermarkBox">
            <div className="watermarkText">{t("watermark")}</div>

            <div className="grid grid-4 mb-4">
              <StatCard icon={<Clock size={18} />} label="Total hours this week" value={`${totalHours.toFixed(1)}h`} />
              <StatCard icon={<Award size={18} />} label={t("avgHoursPerDay")} value={`${report.avgHoursPerDay}h`} />
              <StatCard
                icon={report.changePercentVsLastWeek >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                label={t("changeVsLastWeek")}
                value={`${report.changePercentVsLastWeek}%`}
                accent
              />
              <StatCard icon={<BookOpen size={18} />} label={t("mostSpentSubject")} value={report.mostSpentSubject || "-"} accent />
            </div>

            <div className="row">
              <div className="col card" style={{ flex: "2 1 420px" }}>
                <div className="h2">Hours per subject</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} stroke="var(--border-soft)" />
                    <XAxis dataKey="subject" fontSize={12} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} axisLine={false} tickLine={false} width={32} />
                    <Tooltip formatter={(v) => [`${v}h`, "Hours"]} />
                    <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="col card" style={{ flex: "1 1 260px" }}>
                <div className="h2">Summary</div>
                <div className="stack" style={{ gap: 14 }}>
                  <div>
                    <div className="label">{t("mostSpentSubject")}</div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{report.mostSpentSubject || "-"}</div>
                    <div className="badge badge-success mt-1">{report.mostSpentHours}h</div>
                  </div>
                  <div>
                    <div className="label">Least spent subject</div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{report.leastSpentSubject || "-"}</div>
                    <div className="badge badge-warning mt-1">{report.leastSpentHours}h</div>
                  </div>
                  <div>
                    <div className="label">Best average this term</div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{report.bestAvg}h / day</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="legalNote">{t("legalNote")}</div>
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}
