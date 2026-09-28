import { useEffect, useState } from "react";
import {
  Banknote,
  UploadCloud,
  History,
  FileCheck2,
  ShieldCheck,
  CloudOff,
  Paperclip,
  Building2,
  CreditCard,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import { Skeleton, EmptyState, ErrorState } from "../components/ui.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

const STATUS_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };

const STATUS_ICON = {
  PENDING: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

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
  const StatusIcon = latestStatus ? STATUS_ICON[latestStatus] || ShieldCheck : ShieldCheck;

  if (!auth.role) {
    return (
      <div className="authWrap">
        <div
          className="card authCard"
          style={{
            textAlign: "center",
            padding: "36px 28px",
            borderRadius: 18,
            maxWidth: 420,
            margin: "0 auto",
          }}
        >
          <div className="between mb-3" style={{ alignItems: "center" }}>
            <div className="h1" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              {t("subscription")}
            </div>
            <LanguageSwitch />
          </div>
          <p className="subtitle" style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
            Please log in to view or manage your subscription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout title={t("subscription")}>
      <div className="stack" style={{ gap: 22 }}>
        {/* ── Latest Status Banner ── */}
        {latestStatus && (
          <div
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              padding: "14px 18px",
              borderRadius: 14,
              background:
                latestStatus === "APPROVED"
                  ? "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)"
                  : latestStatus === "REJECTED"
                  ? "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)"
                  : "linear-gradient(135deg, #fffbeb 0%, #fefce8 100%)",
              border:
                latestStatus === "APPROVED"
                  ? "1px solid #bbf7d0"
                  : latestStatus === "REJECTED"
                  ? "1px solid #fecaca"
                  : "1px solid #fde68a",
            }}
          >
            <div className="center-v" style={{ gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  background:
                    latestStatus === "APPROVED"
                      ? "#dcfce7"
                      : latestStatus === "REJECTED"
                      ? "#fee2e2"
                      : "#fef3c7",
                  color:
                    latestStatus === "APPROVED"
                      ? "#166534"
                      : latestStatus === "REJECTED"
                      ? "#991b1b"
                      : "#92400e",
                }}
              >
                <StatusIcon size={18} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>
                  Latest submission status
                </div>
                <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 1 }}>
                  Your most recent payment slip
                </div>
              </div>
            </div>
            <span
              className={"badge badge-" + (STATUS_TONE[latestStatus] || "default")}
              style={{ fontWeight: 700, fontSize: 12.5, padding: "6px 12px" }}
            >
              {latestStatus}
            </span>
          </div>
        )}

        {/* ── Bank + Upload Row ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: canUpload ? "1fr 1fr" : "1fr",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          {/* Bank Details */}
          <div
            className="card"
            style={{
              padding: "22px 24px",
              borderRadius: 16,
              border: "1px solid var(--border-soft, #e2e8f0)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div className="center-v" style={{ gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Banknote size={18} strokeWidth={2} />
              </div>
              <div>
                <div className="h2" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                  {t("bankDetails")}
                </div>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 1 }}>
                  Transfer to this account
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                background: "var(--muted, #f8fafc)",
                borderRadius: 12,
                padding: "14px 16px",
                border: "1px solid var(--border-soft, #e2e8f0)",
              }}
            >
              <div className="between" style={{ gap: 12 }}>
                <span className="center-v" style={{ gap: 8, color: "#64748b", fontSize: 13.5 }}>
                  <Building2 size={14} />
                  Bank
                </span>
                <strong style={{ fontSize: 13.5 }}>People's Bank</strong>
              </div>
              <div
                style={{
                  height: 1,
                  background: "var(--border-soft, #e2e8f0)",
                }}
              />
              <div className="between" style={{ gap: 12 }}>
                <span className="center-v" style={{ gap: 8, color: "#64748b", fontSize: 13.5 }}>
                  <CreditCard size={14} />
                  Account name
                </span>
                <strong style={{ fontSize: 13.5 }}>Timetable LK (SAMS)</strong>
              </div>
              <div
                style={{
                  height: 1,
                  background: "var(--border-soft, #e2e8f0)",
                }}
              />
              <div className="between" style={{ gap: 12 }}>
                <span className="center-v" style={{ gap: 8, color: "#64748b", fontSize: 13.5 }}>
                  <CreditCard size={14} />
                  Account number
                </span>
                <strong
                  style={{
                    fontSize: 14,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    letterSpacing: "0.03em",
                  }}
                >
                  123-456-7890
                </strong>
              </div>
              <div
                style={{
                  height: 1,
                  background: "var(--border-soft, #e2e8f0)",
                }}
              />
              <div className="between" style={{ gap: 12 }}>
                <span className="center-v" style={{ gap: 8, color: "#64748b", fontSize: 13.5 }}>
                  <MapPin size={14} />
                  Branch
                </span>
                <strong style={{ fontSize: 13.5 }}>Colombo</strong>
              </div>
            </div>

            {canUpload && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1e40af",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <UploadCloud size={15} />
                Once you’ve paid, upload your slip on the right →
              </div>
            )}
          </div>

          {/* Upload Slip */}
          {canUpload && (
            <div
              className="card"
              style={{
                padding: "22px 24px",
                borderRadius: 16,
                border: "1px solid var(--border-soft, #e2e8f0)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="center-v" style={{ gap: 10, marginBottom: 18 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#f0fdf4",
                    color: "#15803d",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <UploadCloud size={18} strokeWidth={2} />
                </div>
                <div>
                  <div className="h2" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    {t("uploadSlip")}
                  </div>
                  <div className="faint" style={{ fontSize: 12.5, marginTop: 1 }}>
                    JPG, PNG or PDF · max 5 MB
                  </div>
                </div>
              </div>

              <label
                htmlFor="slip-file"
                style={{
                  flex: 1,
                  border: file
                    ? "2px solid #86efac"
                    : "2px dashed var(--border-soft, #cbd5e1)",
                  borderRadius: 14,
                  background: file ? "#f0fdf4" : "var(--muted, #f8fafc)",
                  textAlign: "center",
                  padding: "32px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                {file ? (
                  <>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "#dcfce7",
                        color: "#166534",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Paperclip size={20} />
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#166534",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        padding: "0 8px",
                      }}
                    >
                      {file.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#4ade80" }}>
                      Click to change file
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "#f1f5f9",
                        color: "#94a3b8",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <UploadCloud size={24} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                      Click to choose a file
                    </div>
                    <div className="faint" style={{ fontSize: 12.5 }}>
                      or drag & drop your payment slip
                    </div>
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

              <button
                className="btn btn-accent btn-block"
                onClick={upload}
                disabled={uploading || !file}
                type="button"
                style={{
                  marginTop: 16,
                  height: 44,
                  fontWeight: 700,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {uploading ? (
                  "Uploading…"
                ) : (
                  <>
                    <FileCheck2 size={17} strokeWidth={2.2} />
                    {t("upload")}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Payment History ── */}
        <div
          className="card"
          style={{
            padding: "22px 24px",
            borderRadius: 16,
            border: "1px solid var(--border-soft, #e2e8f0)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div className="center-v" style={{ gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#f8fafc",
                color: "#475569",
                display: "grid",
                placeItems: "center",
                border: "1px solid #e2e8f0",
              }}
            >
              <History size={18} strokeWidth={2} />
            </div>
            <div>
              <div className="h2" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {t("paymentHistory")}
              </div>
              <div className="faint" style={{ fontSize: 12.5, marginTop: 1 }}>
                All your past submissions
              </div>
            </div>
          </div>

          {loading ? (
            <Skeleton height={120} radius={12} />
          ) : error ? (
            <ErrorState
              icon={<CloudOff size={22} />}
              title={t("couldntLoad")}
              onRetry={loadHistory}
              retryLabel={t("tryAgain")}
            />
          ) : history.length === 0 ? (
            <EmptyState
              icon={<History size={22} />}
              title="No payment records yet"
              message="Your payment history will appear here once you make a submission."
            />
          ) : (
            <div className="tableWrap" style={{ borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "var(--muted, #f8fafc)",
                      borderBottom: "1px solid var(--border-soft, #e2e8f0)",
                    }}
                  >
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#64748b",
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#64748b",
                      }}
                    >
                      {t("status")}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#64748b",
                      }}
                    >
                      {t("createdAt")}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#64748b",
                      }}
                    >
                      {t("verifiedBy")}
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#64748b",
                      }}
                    >
                      {t("verifiedAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((p, idx) => (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom:
                          idx === history.length - 1
                            ? "none"
                            : "1px solid var(--border-soft, #f1f5f9)",
                      }}
                    >
                      <td
                        style={{
                          padding: "13px 14px",
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        #{p.id}
                      </td>
                      <td style={{ padding: "13px 14px" }}>
                        <span
                          className={"badge badge-" + (STATUS_TONE[p.status] || "default")}
                          style={{ fontWeight: 600, fontSize: 12 }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "13px 14px",
                          fontSize: 13.5,
                          color: "#475569",
                        }}
                      >
                        {p.createdAt}
                      </td>
                      <td
                        style={{
                          padding: "13px 14px",
                          fontSize: 13.5,
                          color: "#475569",
                        }}
                      >
                        {p.verifiedBy || "—"}
                      </td>
                      <td
                        style={{
                          padding: "13px 14px",
                          fontSize: 13.5,
                          color: "#475569",
                        }}
                      >
                        {p.verifiedAt || "—"}
                      </td>
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