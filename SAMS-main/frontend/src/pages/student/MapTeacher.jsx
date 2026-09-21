import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { QrCode, KeyRound, CheckCircle2, Camera, School, GraduationCap, CloudOff } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import TrialGate from "../../components/TrialGate.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Avatar, Skeleton, ErrorState } from "../../components/ui.jsx";

function parseSamsQr(text) {
  // Teacher QR is encoded as: SAMS|<school>|<mappingCode>
  const s = String(text || "").trim();
  if (s.startsWith("SAMS|")) {
    const parts = s.split("|");
    return { school: parts[1] || "", mappingCode: parts[2] || "" };
  }
  return { school: "", mappingCode: s };
}

export default function MapTeacher() {
  const { t } = useI18n();
  const toast = useToast();

  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");

  const [mappingCode, setMappingCode] = useState("");
  const [scannerOn, setScannerOn] = useState(false);
  const [scanInfo, setScanInfo] = useState({ school: "" });
  const [linking, setLinking] = useState(false);

  const [teachers, setTeachers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const videoRef = useRef(null);
  const readerRef = useRef(null);

  async function loadTeachers() {
    setLoading(true);
    setError(false);
    try {
      const d = await api.get("/api/student/me/teachers");
      setTeachers(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeachers();
  }, []);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    return () => {
      try {
        readerRef.current?.reset();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    let stopped = false;

    async function start() {
      if (!scannerOn) return;
      try {
        const codeReader = readerRef.current;
        if (!codeReader) return;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const deviceId = devices?.[0]?.deviceId;

        await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
          if (stopped) return;
          if (result) {
            const text = result.getText();
            const parsed = parseSamsQr(text);
            if (parsed.mappingCode) setMappingCode(parsed.mappingCode);
            setScanInfo({ school: parsed.school || "" });
          }
        });
      } catch {
        toast.show("Camera error. Please allow camera permission.", "error");
      }
    }

    function stop() {
      try {
        readerRef.current?.reset();
      } catch {
        /* ignore */
      }
    }

    if (scannerOn) start();
    else stop();

    return () => {
      stopped = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOn]);

  async function link() {
    setBlocked(false);
    setBlockMsg("");
    const code = mappingCode.trim();
    if (!code) {
      toast.show("Please enter a mapping code", "error");
      return;
    }
    setLinking(true);
    try {
      await api.post("/api/student/me/map-teacher", { mappingCode: code });
      toast.show("Teacher linked successfully", "success");
      setScannerOn(false);
      setMappingCode("");
      await loadTeachers();
    } catch (err) {
      if (err?.status === 403 && err?.data?.error === "TRIAL_EXPIRED") {
        setBlocked(true);
        setBlockMsg(err.data.message);
        return;
      }
      toast.show(err?.data?.message || "Failed to link teacher", "error");
    } finally {
      setLinking(false);
    }
  }

  return (
    <Layout title={t("mapTeacher")}>
      <TrialGate blocked={blocked} message={blockMsg}>
        {loading ? (
          <Skeleton height={160} radius={16} />
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={loadTeachers} retryLabel={t("tryAgain")} />
          </div>
        ) : (
          <div className="stack" style={{ gap: 20 }}>
            {teachers && teachers.length > 0 && (
              <div className="card">
                <div className="h2">Connected teachers</div>
                <div className="stack" style={{ gap: 10 }}>
                  {teachers.map((tt) => (
                    <div key={tt.teacherId} className="between card card-flat" style={{ background: "var(--success-50)", border: "1px solid var(--success-100)" }}>
                      <div className="center-v" style={{ gap: 12 }}>
                        <Avatar name={tt.name} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{tt.name}</div>
                          <div className="center-v" style={{ gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
                            <span className="center-v" style={{ gap: 4 }}>
                              <School size={12} /> {tt.school}
                            </span>
                            {tt.grade && (
                              <span className="center-v" style={{ gap: 4 }}>
                                <GraduationCap size={12} /> {tt.grade} {tt.className}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> Connected
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="row" style={{ alignItems: "flex-start" }}>
              <div className="col card">
                <div className="h2">{teachers?.length ? "Link another teacher" : t("mapTeacher")}</div>
                <p className="subtitle mb-3">
                  Ask your teacher for their mapping code, or scan their QR code — both must belong to the same school.
                </p>

                <div className="field">
                  <label className="label">
                    <KeyRound size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
                    {t("enterMappingCode")}
                  </label>
                  <input
                    className="input"
                    value={mappingCode}
                    onChange={(e) => setMappingCode(e.target.value)}
                    placeholder="e.g. MTH-2024-081"
                  />
                </div>

                <button className="btn btn-accent btn-block" type="button" onClick={link} disabled={linking}>
                  {linking ? "Linking…" : t("linkTeacher")}
                </button>

                <div className="mt-4">
                  <button
                    className={"btn btn-block " + (scannerOn ? "btn-danger" : "btn-outline")}
                    type="button"
                    onClick={() => setScannerOn((p) => !p)}
                  >
                    <Camera size={16} />
                    {scannerOn ? "Stop scanning" : t("scanQr")}
                  </button>
                </div>

                {scanInfo.school && (
                  <div className="badge badge-primary mt-3">
                    <QrCode size={12} /> QR School: {scanInfo.school}
                  </div>
                )}

                <p className="faint mt-4" style={{ fontSize: 12 }}>
                  Note: Teacher mapping only works within your own school — this is verified by the server.
                </p>
              </div>

              <div className="col card">
                <div className="h2">
                  <Camera size={15} style={{ marginRight: 6, verticalAlign: -2 }} />
                  {t("scanQr")}
                </div>
                {scannerOn ? (
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      maxWidth: 480,
                      borderRadius: "var(--radius-lg)",
                      border: "1px solid var(--border)"
                    }}
                  />
                ) : (
                  <div className="emptyState">
                    <div className="icon-wrap">
                      <QrCode size={22} />
                    </div>
                    <h3>Scanner is off</h3>
                    <p>Tap "Scan QR Code" to start your camera and scan a teacher's QR code.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </TrialGate>
    </Layout>
  );
}
