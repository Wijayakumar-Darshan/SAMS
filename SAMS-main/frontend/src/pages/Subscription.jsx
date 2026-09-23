import React, { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useI18n } from "../i18n/i18n.jsx";
import { Card, Button, Badge, EmptyState } from "../components/UI/index.jsx";
import {
  CreditCardIcon,
  UploadIcon,
  CopyIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldIcon,
  RefreshCwIcon,
  CalendarIcon,
  AlertCircleIcon,
} from "../components/UI/Icons.jsx";

const BANK_DETAILS = {
  bank: "People's Bank",
  accountName: "SAMS Educational Services (Pvt) Ltd",
  accountNumber: "123-456-7890",
  branch: "Colombo Central",
  feeNotice: "Standard Term Subscription: Rs. 1,500 / term",
};

export default function Subscription() {
  const { t } = useI18n();
  const toast = useToast();
  const auth = useAuth();

  const [file, setFile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadHistory() {
    if (!auth.role) return;
    setHistoryLoading(true);
    try {
      if (auth.role === "STUDENT") {
        const data = await api.get("/api/payment/student/history");
        setHistory(Array.isArray(data) ? data : []);
      } else if (auth.role === "TEACHER") {
        const data = await api.get("/api/payment/teacher/history");
        setHistory(Array.isArray(data) ? data : []);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line
  }, [auth.role]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      toast.show("Please choose a payment receipt image or PDF", "error");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      if (auth.role === "STUDENT") {
        await api.post("/api/payment/student/upload", fd);
        toast.show("Payment slip uploaded successfully! An administrator will review it.");
      } else if (auth.role === "TEACHER") {
        await api.post("/api/payment/teacher/upload", fd);
        toast.show("Payment slip uploaded successfully!");
      } else {
        toast.show("Please login as a Student or Teacher to submit payment slips", "error");
      }

      setFile(null);
      await loadHistory();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to upload payment slip", "error");
    } finally {
      setLoading(false);
    }
  }

  function copyAccountNum() {
    navigator.clipboard.writeText(BANK_DETAILS.accountNumber);
    toast.show("Bank account number copied!");
  }

  // If not logged in
  if (!auth.role) {
    return (
      <div className="sams-auth-required-page">
        <Card className="sams-auth-required-card">
          <div className="sams-auth-req-icon">
            <ShieldIcon size={32} color="var(--primary)" />
          </div>
          <h2>{t("subscription")}</h2>
          <p>Please log in as a Student or Teacher to upload payment slips and view your history.</p>
          <a href="/login" className="sams-btn sams-btn-primary sams-btn-md">
            Go to Login
          </a>
        </Card>
      </div>
    );
  }

  return (
    <Layout
      title={t("subscription")}
      subtitle="Transparent institution banking details, receipt submission, and verification status"
    >
      <div className="sams-subscription-page-container">
        <div className="sams-subscription-top-grid">
          {/* LEFT: Bank Details Card (Prompt Requirement 18) */}
          <Card className="sams-bank-details-card">
            <div className="sams-sub-card-header">
              <div className="sams-bank-icon-box">🏦</div>
              <div>
                <h2 className="sams-sub-card-title">{t("bankDetails")}</h2>
                <p className="sams-sub-card-desc">Transfer funds using any bank app or branch deposit</p>
              </div>
            </div>

            <div className="sams-bank-rows-list">
              <div className="sams-bank-row">
                <span className="sams-bank-row-label">{t("bankName")}</span>
                <span className="sams-bank-row-val">{BANK_DETAILS.bank}</span>
              </div>

              <div className="sams-bank-row">
                <span className="sams-bank-row-label">{t("accountName")}</span>
                <span className="sams-bank-row-val">{BANK_DETAILS.accountName}</span>
              </div>

              <div className="sams-bank-row highlight">
                <div>
                  <span className="sams-bank-row-label">{t("accountNumber")}</span>
                  <div className="sams-bank-acc-display">{BANK_DETAILS.accountNumber}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<CopyIcon size={14} />}
                  onClick={copyAccountNum}
                >
                  {t("copy")}
                </Button>
              </div>

              <div className="sams-bank-row">
                <span className="sams-bank-row-label">{t("branch")}</span>
                <span className="sams-bank-row-val">{BANK_DETAILS.branch}</span>
              </div>
            </div>

            <div className="sams-fee-note-box">
              <AlertCircleIcon size={16} color="var(--accent)" />
              <span>{BANK_DETAILS.feeNotice}</span>
            </div>
          </Card>

          {/* RIGHT: Upload Slip Form */}
          <Card className="sams-upload-slip-card">
            <div className="sams-sub-card-header">
              <div className="sams-upload-icon-box">
                <UploadIcon size={22} color="white" />
              </div>
              <div>
                <h2 className="sams-sub-card-title">{t("uploadSlip")}</h2>
                <p className="sams-sub-card-desc">{t("uploadSlipInstruction")}</p>
              </div>
            </div>

            <form onSubmit={handleUpload} className="sams-upload-slip-form">
              <label className="sams-drop-area">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
                <div className="sams-drop-inner">
                  <div className="sams-drop-icon-circle">
                    <UploadIcon size={24} color="var(--accent)" />
                  </div>
                  {file ? (
                    <div className="sams-drop-selected">
                      <CheckCircleIcon size={18} color="#16A34A" />
                      <strong>{file.name}</strong>
                      <span className="sams-file-size">({(file.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <>
                      <strong>Click to browse or drop slip here</strong>
                      <span>JPG, PNG, or PDF format (max 10MB)</span>
                    </>
                  )}
                </div>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!file}
                icon={<UploadIcon size={18} />}
                className="sams-upload-submit-btn"
              >
                {loading ? "Uploading Receipt..." : "Submit Payment Slip"}
              </Button>
            </form>
          </Card>
        </div>

        {/* BOTTOM: Payment History (Prompt Requirement 18) */}
        <div className="sams-history-section">
          <div className="sams-history-header-row">
            <div>
              <h2 className="sams-section-heading">{t("paymentHistory")}</h2>
              <p className="sams-section-sub">Audit trail of previously submitted payment receipts</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCwIcon size={14} />}
              onClick={loadHistory}
              disabled={historyLoading}
            >
              Refresh
            </Button>
          </div>

          <Card className="sams-history-table-card">
            {historyLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
                Loading payment history...
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={<ClockIcon size={38} color="var(--accent)" />}
                title="No Payment Slips Uploaded"
                description="When you submit a bank deposit slip, it will appear here along with verification status."
              />
            ) : (
              <div className="sams-table-wrap">
                <table className="sams-table">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Receipt ID</th>
                      <th>{t("status")}</th>
                      <th>{t("createdAt")}</th>
                      <th>{t("verifiedAt")}</th>
                      <th>{t("verifiedBy")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => {
                      const statusVariant =
                        item.status === "APPROVED"
                          ? "success"
                          : item.status === "REJECTED"
                          ? "danger"
                          : "warning";

                      return (
                        <tr key={item.id}>
                          <td className="mono" style={{ fontWeight: 700, color: "var(--primary)" }}>
                            #{item.id}
                          </td>
                          <td>
                            <Badge variant={statusVariant} size="sm" dot>
                              {item.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="sams-table-date-cell">
                              <CalendarIcon size={12} color="var(--text-muted)" />
                              <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</span>
                            </div>
                          </td>
                          <td>
                            {item.verifiedAt ? (
                              <div className="sams-table-date-cell">
                                <CheckCircleIcon size={12} color="#16A34A" />
                                <span>{new Date(item.verifiedAt).toLocaleString()}</span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>Awaiting verification</span>
                            )}
                          </td>
                          <td style={{ color: "var(--text-secondary)" }}>
                            {item.verifiedBy || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <style>{`
        .sams-subscription-page-container {
          max-width: 1140px;
          margin: 0 auto;
        }

        .sams-subscription-top-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
          align-items: flex-start;
        }

        .sams-bank-details-card, .sams-upload-slip-card {
          padding: 28px;
          border: 1px solid var(--border-subtle);
        }

        .sams-sub-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 20px;
        }

        .sams-bank-icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: #E0F2FE;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sams-upload-icon-box {
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

        .sams-sub-card-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-sub-card-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .sams-bank-rows-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .sams-bank-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
        }

        .sams-bank-row.highlight {
          background: #F0F9FF;
          border-color: #BAE6FD;
        }

        .sams-bank-row-label {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .sams-bank-row-val {
          font-weight: 700;
          color: var(--text-main);
          font-size: 14px;
        }

        .sams-bank-acc-display {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .sams-fee-note-box {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--primary);
          background: var(--accent-soft);
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-weight: 600;
        }

        /* Drop Area */
        .sams-drop-area {
          display: block;
          border: 2px dashed var(--border-strong);
          border-radius: var(--radius-xl);
          background: var(--bg-card-muted);
          padding: 32px 20px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          margin-bottom: 20px;
        }

        .sams-drop-area:hover {
          border-color: var(--accent);
          background: #F0F9FF;
        }

        .sams-drop-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .sams-drop-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          margin-bottom: 6px;
        }

        .sams-drop-inner strong {
          font-size: 14px;
          color: var(--text-main);
        }

        .sams-drop-inner span {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-drop-selected {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #DCFCE7;
          border: 1px solid #86EFAC;
          padding: 8px 14px;
          border-radius: var(--radius-pill);
          color: #166534;
          font-size: 13px;
        }

        .sams-file-size {
          color: #15803D !important;
        }

        .sams-upload-submit-btn {
          width: 100%;
        }

        /* History */
        .sams-history-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sams-history-table-card {
          padding: 0;
          overflow: hidden;
        }

        .sams-table-date-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }

        /* Auth required */
        .sams-auth-required-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--hero-gradient);
          padding: 24px;
        }

        .sams-auth-required-card {
          max-width: 420px;
          width: 100%;
          text-align: center;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sams-auth-req-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .sams-auth-required-card h2 {
          font-size: 22px;
          margin-bottom: 8px;
        }

        .sams-auth-required-card p {
          color: var(--text-secondary);
          margin-bottom: 24px;
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .sams-subscription-top-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}