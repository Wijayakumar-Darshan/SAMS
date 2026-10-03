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
  X,
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

  // Mobile history modal
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [historyOpen, setHistoryOpen] = useState(false);

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

  // Close modal if you leave mobile size
  useEffect(() => {
    if (!isMobile) setHistoryOpen(false);
  }, [isMobile]);

  // Modal: body scroll lock + ESC close
  useEffect(() => {
    if (!historyOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") setHistoryOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [historyOpen]);

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
      <style>{`
        /* ===== Subscription page responsive helpers ===== */
        .sub-wrap { width: 100%; max-width: 100%; box-sizing: border-box; }
        .sub-stack { display: flex; flex-direction: column; gap: 22px; }

        /* Latest status banner */
        .sub-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 14px 18px;
          border-radius: 14px;
          box-sizing: border-box;
        }
        .sub-status-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .sub-status-text { min-width: 0; }
        .sub-status-title { font-size: 13.5px; font-weight: 700; color: #0f172a; }
        .sub-status-sub { font-size: 12.5px; color: #64748b; margin-top: 1px; }

        /* Top grid: bank + upload */
        .sub-top-grid {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          display: grid;
          gap: 18px;
          align-items: stretch;
        }
        .sub-top-grid.two { grid-template-columns: 1fr 1fr; }
        .sub-top-grid.one { grid-template-columns: 1fr; }

        .sub-card {
          padding: 22px 24px;
          border-radius: 16px;
          border: 1px solid var(--border-soft, #e2e8f0);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* Upload drop-zone should never overflow */
        .sub-dropzone { width: 100%; max-width: 100%; box-sizing: border-box; min-width: 0; }
        .sub-filename {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* History table: horizontal scroll on small screens */
        .sub-tableWrap {
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
        }
        .sub-table {
          width: 100%;
          border-collapse: collapse;
        }

        /* ===== Mobile Payment History Modal ===== */
        .sub-modalOverlay{
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding: 12px;
          z-index: 9999;
          box-sizing: border-box;
        }

        .sub-modal{
          width: min(620px, 100%);
          max-height: 85dvh;
          background: #fff;
          border: 1px solid var(--border-soft, #e2e8f0);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          box-sizing: border-box;
        }

        .sub-modalHeader{
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border-soft, #e2e8f0);
          box-sizing: border-box;
        }

        .sub-modalTitle{
          font-weight: 800;
          font-size: 14px;
          color: #0f172a;
        }

        .sub-iconBtn{
          width: 36px;
          height: 36px;
          border-radius: 12px;
          border: 1px solid var(--border-soft, #e2e8f0);
          background: #fff;
          display: grid;
          place-items: center;
        }

        .sub-modalBody{
          padding: 12px 14px;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          max-height: calc(85dvh - 58px);
          box-sizing: border-box;
        }

        .sub-historyItem{
          border: 1px solid var(--border-soft, #e2e8f0);
          background: var(--muted, #f8fafc);
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 10px;
          box-sizing: border-box;
        }

        .sub-historyTop{
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          min-width: 0;
        }

        .sub-mono{
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-weight: 800;
          color: #0f172a;
          font-size: 13.5px;
        }

        .sub-historyRow{
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
          padding: 6px 0;
          border-top: 1px dashed rgba(148,163,184,0.45);
        }

        .sub-historyKey{ color: #64748b; }
        .sub-historyVal{
          color: #0f172a;
          text-align: right;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        /* On phones/tablets: stack bank + upload, and keep table readable by allowing horizontal scroll */
        @media (max-width: 900px) {
          .sub-top-grid.two { grid-template-columns: 1fr; }
          .sub-card { padding: 16px 16px; }
          .sub-status { padding: 12px 12px; align-items: flex-start; }
          .sub-table { min-width: 720px; }
        }

        @media (max-width: 420px) {
          .sub-card { padding: 14px 14px; }
          .sub-table { min-width: 760px; }
        }
      `}</style>

      <div className="sub-wrap">
        <div className="sub-stack">
          {/* ── Latest Status Banner ── */}
          {latestStatus && (
            <div
              className="card sub-status"
              style={{
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
              <div className="sub-status-left">
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
                    flex: "0 0 auto",
                  }}
                >
                  <StatusIcon size={18} strokeWidth={2.2} />
                </div>

                <div className="sub-status-text">
                  <div className="sub-status-title">Latest submission status</div>
                  <div className="sub-status-sub">Your most recent payment slip</div>
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
          <div className={"sub-top-grid " + (canUpload ? "two" : "one")}>
            {/* Bank Details */}
            <div className="card sub-card">
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
                    flex: "0 0 auto",
                  }}
                >
                  <Banknote size={18} strokeWidth={2} />
                </div>
                <div style={{ minWidth: 0 }}>
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
                  boxSizing: "border-box",
                }}
              >
                <div className="between" style={{ gap: 12 }}>
                  <span className="center-v" style={{ gap: 8, color: "#64748b", fontSize: 13.5 }}>
                    <Building2 size={14} />
                    Bank
                  </span>
                  <strong style={{ fontSize: 13.5 }}>People&apos;s Bank</strong>
                </div>
                <div style={{ height: 1, background: "var(--border-soft, #e2e8f0)" }} />
                <div className="between" style={{ gap: 12 }}>
                  <span className="center-v" style={{ gap: 8, color: "#64748b", fontSize: 13.5 }}>
                    <CreditCard size={14} />
                    Account name
                  </span>
                  <strong style={{ fontSize: 13.5 }}>Timetable LK (SAMS)</strong>
                </div>
                <div style={{ height: 1, background: "var(--border-soft, #e2e8f0)" }} />
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
                <div style={{ height: 1, background: "var(--border-soft, #e2e8f0)" }} />
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
                    boxSizing: "border-box",
                  }}
                >
                  <UploadCloud size={15} />
                  Once you’ve paid, upload your slip on the right →
                </div>
              )}
            </div>

            {/* Upload Slip */}
            {canUpload && (
              <div className="card sub-card" style={{ display: "flex", flexDirection: "column" }}>
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
                      flex: "0 0 auto",
                    }}
                  >
                    <UploadCloud size={18} strokeWidth={2} />
                  </div>
                  <div style={{ minWidth: 0 }}>
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
                  className="sub-dropzone"
                  style={{
                    flex: 1,
                    border: file ? "2px solid #86efac" : "2px dashed var(--border-soft, #cbd5e1)",
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
                    boxSizing: "border-box",
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
                      <div className="sub-filename" style={{ fontWeight: 700, fontSize: 14, color: "#166534" }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: "#4ade80" }}>Click to change file</div>
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
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Click to choose a file</div>
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
          <div className="card sub-card">
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
                  flex: "0 0 auto",
                }}
              >
                <History size={18} strokeWidth={2} />
              </div>
              <div style={{ minWidth: 0 }}>
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
              <>
                {/* MOBILE: show a button that opens a popup */}
                {isMobile ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline btn-block"
                      onClick={() => setHistoryOpen(true)}
                      style={{ height: 44, fontWeight: 800, borderRadius: 12 }}
                    >
                      {t("paymentHistory")} ({history.length})
                    </button>

                    {historyOpen && (
                      <div className="sub-modalOverlay" onClick={() => setHistoryOpen(false)} role="presentation">
                        <div
                          className="sub-modal"
                          onClick={(e) => e.stopPropagation()}
                          role="dialog"
                          aria-modal="true"
                        >
                          <div className="sub-modalHeader">
                            <div className="sub-modalTitle">{t("paymentHistory")}</div>
                            <button
                              type="button"
                              className="sub-iconBtn"
                              onClick={() => setHistoryOpen(false)}
                              aria-label="Close"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <div className="sub-modalBody">
                            {history.map((p) => (
                              <div key={p.id} className="sub-historyItem">
                                <div className="sub-historyTop">
                                  <div className="sub-mono">#{p.id}</div>
                                  <span
                                    className={"badge badge-" + (STATUS_TONE[p.status] || "default")}
                                    style={{ fontWeight: 800 }}
                                  >
                                    {p.status}
                                  </span>
                                </div>

                                <div className="sub-historyRow">
                                  <div className="sub-historyKey">{t("createdAt")}</div>
                                  <div className="sub-historyVal">{p.createdAt}</div>
                                </div>

                                <div className="sub-historyRow">
                                  <div className="sub-historyKey">{t("verifiedBy")}</div>
                                  <div className="sub-historyVal">{p.verifiedBy || "—"}</div>
                                </div>

                                <div className="sub-historyRow">
                                  <div className="sub-historyKey">{t("verifiedAt")}</div>
                                  <div className="sub-historyVal">{p.verifiedAt || "—"}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* DESKTOP/TABLET: keep the table */
                  <div className="sub-tableWrap">
                    <table className="sub-table">
                      <thead>
                        <tr
                          style={{
                            background: "var(--muted, #f8fafc)",
                            borderBottom: "1px solid var(--border-soft, #e2e8f0)",
                          }}
                        >
                          <th style={thStyle}>ID</th>
                          <th style={thStyle}>{t("status")}</th>
                          <th style={thStyle}>{t("createdAt")}</th>
                          <th style={thStyle}>{t("verifiedBy")}</th>
                          <th style={thStyle}>{t("verifiedAt")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((p, idx) => (
                          <tr
                            key={p.id}
                            style={{
                              borderBottom:
                                idx === history.length - 1 ? "none" : "1px solid var(--border-soft, #f1f5f9)",
                            }}
                          >
                            <td style={tdStyleStrong}>#{p.id}</td>
                            <td style={{ padding: "13px 14px" }}>
                              <span
                                className={"badge badge-" + (STATUS_TONE[p.status] || "default")}
                                style={{ fontWeight: 600, fontSize: 12 }}
                              >
                                {p.status}
                              </span>
                            </td>
                            <td style={tdStyle}>{p.createdAt}</td>
                            <td style={tdStyle}>{p.verifiedBy || "—"}</td>
                            <td style={tdStyle}>{p.verifiedAt || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#64748b",
};

const tdStyleStrong = {
  padding: "13px 14px",
  fontSize: 13.5,
  fontWeight: 600,
  color: "#0f172a",
};

const tdStyle = {
  padding: "13px 14px",
  fontSize: 13.5,
  color: "#475569",
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);

    mq.addEventListener?.("change", handler);
    mq.addListener?.(handler); // Safari fallback

    return () => {
      mq.removeEventListener?.("change", handler);
      mq.removeListener?.(handler);
    };
  }, [query]);

  return matches;
}