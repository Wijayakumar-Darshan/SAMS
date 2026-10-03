import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Printer,
  Lock,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CloudOff,
  CalendarClock,
} from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { StatCard, Skeleton, ErrorState, Avatar } from "../../components/ui.jsx";

/* ✅ Define hook OUTSIDE component + Safari fallback */
function useMediaQuery(query) {
  const getMatch = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);

    // set initial
    onChange();

    // modern browsers
    if (mq.addEventListener) {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    // old Safari
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [query]);

  return matches;
}

/* optional: debug viewport width */
function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window === "undefined" ? 0 : window.innerWidth));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return w;
}

export default function Dashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const auth = useAuth();

  const [data, setData] = useState(null);
  const [students, setStudents] = useState([]);
  const [leaderRows, setLeaderRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const qrRef = useRef(null);

  // ✅ media queries
  const isPhone = useMediaQuery("(max-width: 480px)");
  const isTablet = useMediaQuery("(max-width: 980px)");
  const statCols = isPhone ? 1 : isTablet ? 2 : 4;

  // ✅ debug actual viewport width
  const vw = useViewportWidth();

  async function load() {
    setLoading(true);
    setBlocked(false);
    setBlockMsg("");
    setError(false);

    try {
      const results = await Promise.allSettled([
        api.get("/api/teacher/me/dashboard"),
        api.get("/api/teacher/me/students"),
        api.get("/api/teacher/leaderboard"),
      ]);

      const dashRes = results[0];
      const studsRes = results[1];
      const lbRes = results[2];

      if (dashRes.status === "rejected") {
        const err = dashRes.reason;
        if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
          setBlocked(true);
          setBlockMsg(err.data.message);
          return;
        }
        throw err;
      }

      setData(dashRes.value);

      if (studsRes.status === "fulfilled") setStudents(studsRes.value);
      else setStudents([]);

      if (lbRes.status === "fulfilled") setLeaderRows(lbRes.value?.rows || []);
      else setLeaderRows([]);
    } catch (err) {
      console.error("Teacher dashboard load failed:", err);
      setError(true);
      toast.show(err?.data?.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qrValue = useMemo(() => {
    if (!data) return "";
    return `SAMS|${data.school || ""}|${data.mappingCode || ""}`;
  }, [data]);

  const myStudentStats = useMemo(() => {
    const byId = new Map(leaderRows.map((r) => [r.studentId, r]));
    return students.map((s) => ({ ...s, stat: byId.get(s.studentId) }));
  }, [students, leaderRows]);

  const activeStudents = myStudentStats.filter((s) => (s.stat?.avgHoursPerDay || 0) > 0);
  const needAttention = myStudentStats.filter((s) => !s.stat || s.stat.avgHoursPerDay === 0);
  const avgStudyTime =
    activeStudents.length > 0
      ? (
          activeStudents.reduce((sum, s) => sum + (s.stat?.avgHoursPerDay || 0), 0) / activeStudents.length
        ).toFixed(1)
      : "0.0";

  function printQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const png = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    w.document.write(`
      <html>
        <head>
          <title>Teacher QR</title>
          <style>
            body { font-family: "Noto Sans Sinhala", Arial; padding: 16px; }
            .wm { position: fixed; inset: 0; display: grid; place-items: center; opacity: 0.08; font-size: 56px; font-weight: 800; transform: rotate(-18deg); }
            .box { border: 1px solid #d6e2f0; border-radius: 12px; padding: 14px; max-width: 520px; }
            img { width: 280px; height: 280px; }
          </style>
        </head>
        <body>
          <div class="wm">${t("watermark")}</div>
          <div class="box">
            <h2>${t("teacherQrTitle")}</h2>
            <div>${t("teacherQrMsg")}</div>
            <img src="${png}" />
            <div style="margin-top:10px;"><b>${t("mappingCode")}:</b> ${data.mappingCode}</div>
            <div style="margin-top:4px;"><b>${t("school")}:</b> ${data.school || "-"}</div>
            <div style="margin-top:12px; font-size:12px; background:#f3f6fb; padding:10px; border:1px dashed #ccc; border-radius:10px;">
              ${t("legalNote")}
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  async function setPassword() {
    if ((newPassword || "").length < 6) {
      toast.show("Password must be at least 6 characters", "error");
      return;
    }
    setSavingPw(true);
    try {
      await api.auth.teacherSetPassword({ newPassword });
      toast.show("Password updated", "success");
      auth.setTeacherPasswordSet(true);
      setNewPassword("");
      await load();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to update password", "error");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <Layout title={t("dashboard")} subtitle={data?.teacherName}>
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <div className="stack">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 16 }}>
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
              <Skeleton height={96} radius={16} />
            </div>
            <Skeleton height={220} radius={16} />
          </div>
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          </div>
        ) : (
          <div className="stack" style={{ gap: 20 }}>
           

            {/* ✅ Stats grid that MUST respond */}
           <div className="teacherStatsGrid">
  <StatCard icon={<Users size={18} />} label="Total students" value={students.length} />
  <StatCard icon={<TrendingUp size={18} />} label="Active this week" value={activeStudents.length} />
  <StatCard icon={<Clock size={18} />} label="Average study time" value={`${avgStudyTime}h/day`} />
  <StatCard icon={<AlertTriangle size={18} />} label="Need attention" value={needAttention.length} accent />
</div>

            {/* QR + Password */}
            <div className="row" style={{ alignItems: "flex-start", display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div className="col card" style={{ flex: "1 1 320px", minWidth: 0 }}>
                <div className="h2">{t("teacherQrTitle")}</div>
                <p className="subtitle mb-3">{t("teacherQrMsg")}</p>

                <div
                  ref={qrRef}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    background: "#fff",
                    padding: 16,
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border)",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <QRCodeCanvas value={qrValue} size={200} includeMargin />
                </div>

                <div className="stack mt-3" style={{ gap: 4, fontSize: 13.5 }}>
                  <div className="between">
                    <span className="muted">{t("mappingCode")}</span>
                    <strong>{data.mappingCode}</strong>
                  </div>
                  <div className="between">
                    <span className="muted">{t("school")}</span>
                    <strong>{data.school || "-"}</strong>
                  </div>
                </div>

                <button className="btn btn-accent btn-block mt-3" type="button" onClick={printQr}>
                  <Printer size={15} /> {t("print")}
                </button>
              </div>

              <div className="col card" style={{ flex: "1 1 320px", minWidth: 0 }}>
                <div className="center-v mb-1" style={{ gap: 8 }}>
                  <CalendarClock size={16} style={{ color: "var(--primary)" }} />
                  <div className="h2" style={{ marginBottom: 0 }}>
                    {t("trialExpiryDate")}
                  </div>
                </div>
                <div className="badge badge-info">
                  {data.trialExpDate} · {data.daysLeft} days left
                </div>

                <hr />

                <div className="center-v mb-2" style={{ gap: 8 }}>
                  <Lock size={16} style={{ color: "var(--primary)" }} />
                  <div className="h2" style={{ marginBottom: 0 }}>
                    {t("changePassword")}
                  </div>
                </div>

                {!auth.teacherPasswordSet && (
                  <div className="badge badge-warning mb-3">
                    {t("passwordSetRequired")}: {t("setNewPassword")}
                  </div>
                )}

                <div className="field">
                  <label className="label">{t("newPassword")}</label>
                  <input
                    className="input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>

                <button className="btn btn-block" type="button" onClick={setPassword} disabled={savingPw}>
                  {savingPw ? "Saving…" : t("save")}
                </button>
              </div>
            </div>

            {/* Need attention list */}
            {needAttention.length > 0 && (
              <div className="card">
                <div className="center-v mb-2" style={{ gap: 8 }}>
                  <AlertTriangle size={16} style={{ color: "var(--warning)" }} />
                  <div className="h2" style={{ marginBottom: 0 }}>
                    Students needing attention
                  </div>
                </div>
                <p className="subtitle mb-3">These students haven't logged any study activity this week.</p>

                <div className="stack" style={{ gap: 8 }}>
                  {needAttention.slice(0, 6).map((s) => (
                    <div
                      key={s.studentId}
                      className="between card card-flat"
                      style={{
                        background: "var(--warning-50)",
                        border: "1px solid var(--warning-100)",
                      }}
                    >
                      <div className="center-v" style={{ gap: 10 }}>
                        <Avatar name={s.name} size="sm" />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</span>
                      </div>
                      <span className="badge badge-warning">0h this week</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}