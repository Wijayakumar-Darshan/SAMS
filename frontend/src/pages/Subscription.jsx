import { useEffect, useState } from "react";
import { Banknote, UploadCloud, History, FileCheck2, ShieldCheck, CloudOff, Paperclip } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import { Skeleton, EmptyState, ErrorState } from "../components/ui.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

const STATUS_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

export default function Subscription() {
  const { t } = useI18n();
  const toast = useToast();
  const auth = useAuth();

  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canUpload = auth.role === "STUDENT" || auth.role === "TEACHER";

  async function loadHistory() {
    if (!auth.role) return;
    setLoading(true);
    setError(false);
    try {
      if (auth.role === "STUDENT") {
        setHistory(await api.get("/api/payment/student/history"));
      } else if (auth.role === "TEACHER") {
        setHistory(await api.get("/api/payment/teacher/history"));
      } else {
        setHistory([]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.role]);

  async function upload() {
    if (!file) {
      toast.show("Please select a file first", "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      if (auth.role === "STUDENT") {
        await api.post("/api/payment/student/upload", fd);
      } else if (auth.role === "TEACHER") {
        await api.post("/api/payment/teacher/upload", fd);
      } else {
        toast.show("Please login as Student or Teacher to upload", "error");
        return;
      }
      toast.show("Payment slip submitted for review", "success");
      setFile(null);
      await loadHistory();
    } catch (err) {
      toast.show(err?.data?.message || "Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  const latestStatus = history[0]?.status;

  if (!auth.role) {
    return (
      <div className="authWrap">
        <div className="card authCard" style={{ textAlign: "center" }}>
          <div className="between mb-3">
            <div className="h1" style={{ fontSize: 20 }}>{t("subscription")}</div>
            <LanguageSwitch />
          </div>
          <p className="subtitle">Please log in to view or manage your subscription.</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title={t("subscription")}>
      <div className="stack" style={{ gap: 20 }}>
        {latestStatus && (
          <div className="card between" style={{ background: "var(--muted)", border: "1px dashed var(--border)" }}>
            <div className="center-v" style={{ gap: 10 }}>
              <ShieldCheck size={18} style={{ color: "var(--primary)" }} />
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Latest submission status</div>
            </div>
            <span className={"badge badge-" + (STATUS_TONE[latestStatus] || "default")}>{latestStatus}</span>
          </div>
        )}

        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="col card">
            <div className="center-v mb-2" style={{ gap: 8 }}>
              <Banknote size={17} style={{ color: "var(--primary)" }} />
              <div className="h2" style={{ marginBottom: 0 }}>{t("bankDetails")}</div>
            </div>
            <div className="stack" style={{ gap: 8, fontSize: 14 }}>
              <div className="between"><span className="muted">Bank</span><strong>People's Bank</strong></div>
              <div className="between"><span className="muted">Account name</span><strong>Timetable LK (SAMS)</strong></div>
              <div className="between"><span className="muted">Account number</span><strong>123-456-7890</strong></div>
              <div className="between"><span className="muted">Branch</span><strong>Colombo</strong></div>
            </div>
            <div className="badge badge-info mt-3">Once you've paid, upload your slip on the right →</div>
          </div>

          {canUpload && (
            <div className="col card">
              <div className="center-v mb-2" style={{ gap: 8 }}>
                <UploadCloud size={17} style={{ color: "var(--primary)" }} />
                <div className="h2" style={{ marginBottom: 0 }}>{t("uploadSlip")}</div>
              </div>

              <label
                htmlFor="slip-file"
                className="card card-flat"
                style={{
                  border: "2px dashed var(--border)",
                  textAlign: "center",
                  padding: "28px 16px",
                  cursor: "pointer",
                  display: "block"
                }}
              >
                {file ? (
                  <div className="center-v" style={{ justifyContent: "center", gap: 8 }}>
                    <Paperclip size={16} style={{ color: "var(--primary)" }} />
                    <span style={{ fontWeight: 600, fontSize: 13.5 }} className="truncate">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud size={26} style={{ color: "var(--text-faint)", margin: "0 auto 8px" }} />
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>Click to choose a file</div>
                    <div className="faint" style={{ fontSize: 12 }}>JPG, PNG or PDF</div>
                  </>
                )}
              </label>
              <input
                id="slip-file"
                className="input"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <button className="btn btn-accent btn-block mt-3" onClick={upload} disabled={uploading || !file} type="button">
                {uploading ? "Uploading…" : (<><FileCheck2 size={16} /> {t("upload")}</>)}
              </button>
            </div>
          )}
        </div>

        <div className="card">
          <div className="center-v mb-2" style={{ gap: 8 }}>
            <History size={17} style={{ color: "var(--primary)" }} />
            <div className="h2" style={{ marginBottom: 0 }}>{t("paymentHistory")}</div>
          </div>

          {loading ? (
            <Skeleton height={90} radius={12} />
          ) : error ? (
            <ErrorState icon={<CloudOff size={20} />} title={t("couldntLoad")} onRetry={loadHistory} retryLabel={t("tryAgain")} />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<History size={20} />}
              title="No payment records yet"
              message="Your payment history will appear here once you make a submission."
            />
          ) : (
            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t("status")}</th>
                    <th>{t("createdAt")}</th>
                    <th>{t("verifiedBy")}</th>
                    <th>{t("verifiedAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td><span className={"badge badge-" + (STATUS_TONE[p.status] || "default")}>{p.status}</span></td>
                      <td>{p.createdAt}</td>
                      <td>{p.verifiedBy || "-"}</td>
                      <td>{p.verifiedAt || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
