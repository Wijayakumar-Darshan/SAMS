import React, { useEffect, useRef, useState } from "react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button } from "../../components/UI/index.jsx";
import {
  LinkIcon,
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  SparklesIcon,
} from "../../components/UI/Icons.jsx";
import { BrowserQRCodeReader } from "@zxing/browser";

export default function StudentMapTeacher() {
  const { t } = useI18n();
  const toast = useToast();
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
  const [mappingCode, setMappingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  async function handleLink(codeToUse) {
    const code = (codeToUse || mappingCode).trim();
    if (!code) {
      toast.show("Please enter your teacher's code", "error");
      return;
    }

    setLoading(true);
    setSuccessMsg("");
    try {
      await api.post("/api/student/me/map-teacher", { mappingCode: code });
      toast.show("🎉 Connected with teacher successfully!");
      setSuccessMsg("Successfully linked with your school teacher.");
      setMappingCode("");
      stopScanning();
    } catch (err) {
      const msg = err?.data?.message || err?.message || "Linking failed. Please check the code.";
      toast.show(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  // QR Camera scanner
  async function startScanning() {
    setScanning(true);
    try {
      const codeReader = new BrowserQRCodeReader();
      codeReaderRef.current = codeReader;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoElement);
      if (result) {
        const rawText = result.getText();
        // format is: SAMS|School|MappingCode or direct mapping code
        let extractedCode = rawText;
        if (rawText.includes("|")) {
          const parts = rawText.split("|");
          extractedCode = parts[parts.length - 1]; // last part is mappingCode
        }
        setMappingCode(extractedCode);
        toast.show(`QR Code scanned: ${extractedCode}`);
        stopScanning();
        handleLink(extractedCode);
      }
    } catch {
      stopScanning();
    }
  }

  function stopScanning() {
    setScanning(false);
    if (codeReaderRef.current) {
      try {
        const stream = videoRef.current?.srcObject;
        if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach((track) => track.stop());
        }
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Layout
      title={t("mapTeacher")}
      subtitle="Connect with your classroom teacher to receive ratings and feedback"
    >
      <TrialGate blocked={blocked} message={blockMsg}>
        <div className="sams-map-teacher-container">
          <Card className="sams-map-card">
            <div className="sams-map-header">
              <div className="sams-map-icon-box">
                <LinkIcon size={28} color="white" />
              </div>
              <div>
                <h2 className="sams-map-title">{t("linkTeacher")}</h2>
                <p className="sams-map-desc">{t("connectTeacherDesc")}</p>
              </div>
            </div>

            {successMsg && (
              <div className="sams-map-success-alert animate-fade-in">
                <CheckCircleIcon size={20} color="#16A34A" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="sams-map-methods-grid">
              {/* Method 1: Enter Code */}
              <div className="sams-method-box">
                <div className="sams-method-tag">Option 1</div>
                <h3 className="sams-method-title">Enter Teacher Code</h3>
                <p className="sams-method-desc">
                  Ask your teacher for their 6-character code (e.g. <code>T123456</code>).
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLink();
                  }}
                  className="sams-code-form"
                >
                  <div className="sams-field">
                    <input
                      type="text"
                      className="sams-input sams-code-input"
                      value={mappingCode}
                      onChange={(e) => setMappingCode(e.target.value.toUpperCase())}
                      placeholder="e.g. T481902"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    icon={<LinkIcon size={18} />}
                    className="sams-btn-full"
                  >
                    {t("linkTeacher")}
                  </Button>
                </form>
              </div>

              {/* Method 2: Scan QR Code */}
              <div className="sams-method-box qr-method">
                <div className="sams-method-tag">Option 2</div>
                <h3 className="sams-method-title">Scan Teacher QR</h3>
                <p className="sams-method-desc">
                  Point your camera at your teacher's printed or on-screen QR code.
                </p>

                {scanning ? (
                  <div className="sams-scanner-box">
                    <video ref={videoRef} className="sams-scanner-video" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopScanning}
                      className="sams-stop-scanner-btn"
                    >
                      Cancel Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="sams-qr-placeholder">
                    <div className="sams-qr-icon-circle">
                      <QrCodeIcon size={44} color="var(--primary)" />
                    </div>
                    <Button
                      variant="secondary"
                      size="lg"
                      icon={<CameraIcon size={18} />}
                      onClick={startScanning}
                      className="sams-btn-full"
                    >
                      {t("scanQr")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* School Compatibility Notice */}
            <div className="sams-school-notice">
              <AlertCircleIcon size={18} color="var(--accent)" />
              <div>
                <strong>Important Note:</strong>
                <span> You can only link with teachers registered to your exact school.</span>
              </div>
            </div>
          </Card>
        </div>
      </TrialGate>

      <style>{`
        .sams-map-teacher-container {
          max-width: 860px;
          margin: 0 auto;
        }

        .sams-map-card {
          padding: 32px;
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-md);
        }

        .sams-map-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 24px;
        }

        .sams-map-icon-box {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-lg);
          background: var(--primary-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(11, 46, 89, 0.25);
          flex-shrink: 0;
        }

        .sams-map-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-map-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-map-success-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #DCFCE7;
          border: 1px solid #86EFAC;
          color: #15803D;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .sams-map-methods-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }

        .sams-method-box {
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .sams-method-tag {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--accent);
          margin-bottom: 6px;
        }

        .sams-method-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .sams-method-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 20px;
          line-height: 1.45;
        }

        .sams-code-input {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2px;
          text-align: center;
          padding: 12px;
          text-transform: uppercase;
        }

        .sams-btn-full {
          width: 100%;
        }

        .sams-qr-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex: 1;
        }

        .sams-qr-icon-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px dashed var(--border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-scanner-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .sams-scanner-video {
          width: 100%;
          max-height: 220px;
          border-radius: var(--radius-md);
          background: #000;
          object-fit: cover;
        }

        .sams-school-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: var(--accent-soft);
          border: 1px solid rgba(46, 134, 193, 0.25);
          padding: 14px 18px;
          border-radius: var(--radius-lg);
          font-size: 13px;
          color: var(--primary);
        }

        @media (max-width: 700px) {
          .sams-map-methods-grid {
            grid-template-columns: 1fr;
          }
          .sams-map-card {
            padding: 20px;
          }
        }
      `}</style>
    </Layout>
  );
}