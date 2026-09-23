import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { useAuth } from "../../state/AuthContext.jsx";
import { Card, StatCard, Button, Badge } from "../../components/UI/index.jsx";
import {
  QrCodeIcon,
  DownloadIcon,
  CopyIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ShieldIcon,
  UsersIcon,
  SchoolIcon,
  ClockIcon,
} from "../../components/UI/Icons.jsx";
import { QRCodeCanvas } from "qrcode.react";

export default function TeacherDashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const auth = useAuth();
  const [data, setData] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef(null);

  async function loadDashboard() {
    setBlocked(false);
    setBlockMsg("");
    setLoading(true);
    try {
      const d = await api.get("/api/teacher/me/dashboard");
      setData(d);
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

  const qrValue = useMemo(() => {
    if (!data) return "";
    return `SAMS|${data.school || ""}|${data.mappingCode || ""}`;
  }, [data]);

  function copyTeacherCode() {
    if (!data?.mappingCode) return;
    navigator.clipboard.writeText(data.mappingCode);
    toast.show("Teacher mapping code copied to clipboard!");
  }

  function handleDownloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const png = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = png;
    a.download = `SAMS_Teacher_QR_${data?.mappingCode || "code"}.png`;
    a.click();
    toast.show("Teacher QR code downloaded!");
  }

  function handlePrintQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const png = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teacher Connection QR Code - ${data?.teacherName || ""}</title>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; padding: 40px; text-align: center; color: #0F172A; }
            .box { max-width: 440px; margin: 0 auto; border: 2px solid #E2E8F0; border-radius: 20px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
            h1 { font-size: 22px; color: #0B2E59; margin-bottom: 4px; }
            p { font-size: 14px; color: #64748B; margin-bottom: 20px; }
            img { width: 240px; height: 240px; display: block; margin: 0 auto 20px; }
            .code-box { background: #F1F5F9; border-radius: 10px; padding: 12px; font-size: 18px; font-weight: 800; letter-spacing: 2px; color: #0B2E59; font-family: monospace; }
            .meta { font-size: 13px; color: #475569; margin-top: 12px; }
            .legal { font-size: 11px; color: #94A3B8; margin-top: 24px; border-top: 1px dashed #E2E8F0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>SAMS — Connect with Teacher</h1>
            <p>Scan this QR code using the SAMS app to link your study activities with your teacher.</p>
            <img src="${png}" alt="Teacher QR Code" />
            <div class="code-box">${data?.mappingCode || ""}</div>
            <div class="meta">Teacher: ${data?.teacherName || ""} · School: ${data?.school || "School"}</div>
            <div class="legal">TIMETABLE.LK · Official Student Activity Management System</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    if ((newPassword || "").length < 6) {
      toast.show("Password must be at least 6 characters", "error");
      return;
    }
    setSettingPassword(true);
    try {
      await api.auth.teacherSetPassword({ newPassword });
      toast.show("Password set successfully! You can now login with email & password.");
      auth.setTeacherPasswordSet(true);
      setNewPassword("");
      await loadDashboard();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to set password", "error");
    } finally {
      setSettingPassword(false);
    }
  }

  return (
    <Layout
      title={t("dashboard")}
      subtitle="Teacher administration, student connection QR code, and account settings"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-teacher-dash-container">
          {/* Top Status & Metrics */}
          <div className="sams-teacher-metrics-row">
            <StatCard
              icon={<UsersIcon size={22} />}
              iconColor="blue"
              label="Teacher Account"
              value={data?.teacherName || "Teacher"}
              sublabel={data?.email || ""}
              loading={loading && !data}
            />

            <StatCard
              icon={<SchoolIcon size={22} />}
              iconColor="purple"
              label={t("school")}
              value={data?.school || "Assigned School"}
              sublabel="Official School ID"
              loading={loading && !data}
            />

            <StatCard
              icon={<ClockIcon size={22} />}
              iconColor={data?.daysLeft > 5 ? "green" : "amber"}
              label="Subscription Period"
              value={`${data?.daysLeft ?? 0} days`}
              sublabel={`Expiry: ${data?.trialExpDate || "—"}`}
              loading={loading && !data}
            />
          </div>

          <div className="sams-teacher-dash-grid">
            {/* LEFT: Connect Students QR Hub (Prompt Requirement 23) */}
            <Card className="sams-teacher-qr-card">
              <div className="sams-qr-head">
                <div className="sams-qr-badge">
                  <QrCodeIcon size={22} color="white" />
                </div>
                <div>
                  <h2 className="sams-qr-title">{t("connectStudents")}</h2>
                  <p className="sams-qr-desc">{t("connectStudentsSubtitle")}</p>
                </div>
              </div>

              {/* Large QR Display */}
              <div className="sams-qr-canvas-wrapper" ref={qrRef}>
                <div className="sams-qr-frame">
                  <QRCodeCanvas
                    value={qrValue}
                    size={220}
                    level="H"
                    includeMargin
                    style={{ borderRadius: "12px" }}
                  />
                </div>
              </div>

              {/* Teacher Code Display */}
              <div className="sams-code-showcase-box">
                <div className="sams-showcase-label">{t("mappingCode")}</div>
                <div className="sams-showcase-val-row">
                  <span className="sams-showcase-code">{data?.mappingCode || "—"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<CopyIcon size={14} />}
                    onClick={copyTeacherCode}
                  >
                    {t("copy")}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="sams-qr-action-buttons">
                <Button
                  variant="primary"
                  size="md"
                  icon={<DownloadIcon size={16} />}
                  onClick={handleDownloadQr}
                  className="sams-flex-btn"
                >
                  {t("downloadQr")}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrintQr}
                  className="sams-flex-btn"
                >
                  {t("print")}
                </Button>
              </div>
            </Card>

            {/* RIGHT: Account & Password Settings */}
            <div className="sams-teacher-side-column">
              <Card className="sams-teacher-settings-card">
                <div className="sams-card-header-styled">
                  <div className="sams-settings-icon">
                    <ShieldIcon size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h3 className="sams-settings-heading">Account Security</h3>
                    <p className="sams-settings-sub">
                      {data?.passwordSet
                        ? "Password is configured. You can update it below."
                        : "Set a permanent password to login without one-time OTP."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSetPassword} className="sams-teacher-pw-form">
                  <div className="sams-field">
                    <label className="sams-label">
                      <span>{t("newPassword")}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Min 6 chars</span>
                    </label>
                    <input
                      type="password"
                      className="sams-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="md"
                    loading={settingPassword}
                    icon={<CheckCircleIcon size={16} />}
                    className="sams-full-width"
                  >
                    {data?.passwordSet ? t("changePassword") : t("setNewPassword")}
                  </Button>
                </form>
              </Card>

              {/* Quick Info Card */}
              <Card className="sams-teacher-info-card">
                <h4 className="sams-info-title">Teacher Quick Guide</h4>
                <ul className="sams-info-list">
                  <li>
                    <span className="bullet">1</span>
                    <span>Share your QR code or 6-digit mapping code with your classroom.</span>
                  </li>
                  <li>
                    <span className="bullet">2</span>
                    <span>Students link with you to submit their daily study activities.</span>
                  </li>
                  <li>
                    <span className="bullet">3</span>
                    <span>Review, grade (1-5 stars), and leave motivating comments in the Students tab.</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </TrialGate>

      <style>{`
        .sams-teacher-dash-container {
          max-width: 1120px;
          margin: 0 auto;
        }

        .sams-teacher-metrics-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .sams-teacher-dash-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 24px;
          align-items: flex-start;
        }

        /* QR Card */
        .sams-teacher-qr-card {
          padding: 28px;
          border: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .sams-qr-head {
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          width: 100%;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 24px;
        }

        .sams-qr-badge {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(11, 46, 89, 0.2);
        }

        .sams-qr-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-qr-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .sams-qr-canvas-wrapper {
          background: #FFFFFF;
          border: 2px dashed var(--border-strong);
          border-radius: var(--radius-xl);
          padding: 18px;
          margin-bottom: 20px;
          box-shadow: var(--shadow-sm);
        }

        .sams-qr-frame {
          background: #FFFFFF;
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .sams-code-showcase-box {
          width: 100%;
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 14px 18px;
          margin-bottom: 20px;
        }

        .sams-showcase-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 4px;
          text-align: left;
        }

        .sams-showcase-val-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sams-showcase-code {
          font-family: var(--font-mono);
          font-size: 22px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 2px;
        }

        .sams-qr-action-buttons {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .sams-flex-btn {
          flex: 1;
        }

        /* Settings Card */
        .sams-teacher-side-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sams-teacher-settings-card {
          padding: 24px;
        }

        .sams-card-header-styled {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 18px;
        }

        .sams-settings-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-settings-heading {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
        }

        .sams-settings-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-full-width {
          width: 100%;
        }

        /* Info Card */
        .sams-teacher-info-card {
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          padding: 20px;
        }

        .sams-info-title {
          font-size: 14px;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 12px;
        }

        .sams-info-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .sams-info-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .sams-info-list .bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .sams-teacher-metrics-row {
            grid-template-columns: 1fr;
          }
          .sams-teacher-dash-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}