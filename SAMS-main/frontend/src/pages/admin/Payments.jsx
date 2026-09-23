import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, Button, Badge, Modal, EmptyState } from "../../components/UI/index.jsx";
import {
  CreditCardIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XIcon,
  EyeIcon,
  DownloadIcon,
  ZoomInIcon,
  ZoomOutIcon,
  AlertCircleIcon,
} from "../../components/UI/Icons.jsx";

export default function AdminPayments() {
  const { t } = useI18n();
  const toast = useToast();

  const [studentPayments, setStudentPayments] = useState([]);
  const [teacherPayments, setTeacherPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("students"); // "students" | "teachers"
  const [searchQuery, setSearchQuery] = useState("");

  // Default action configurations
  const [extendMonths, setExtendMonths] = useState(0);
  const [rejectReason, setRejectReason] = useState("");

  // Document preview modal
  const [viewerItem, setViewerItem] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadPayments() {
    try {
      setLoading(true);
      const [sp, tp] = await Promise.all([
        api.get("/api/admin/payments/students"),
        api.get("/api/admin/payments/teachers"),
      ]);
      setStudentPayments(Array.isArray(sp) ? sp : []);
      setTeacherPayments(Array.isArray(tp) ? tp : []);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to load payment records", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line
  }, []);

  async function handleApprove(paymentId) {
    setActionLoading(true);
    try {
      const url = activeTab === "students"
        ? `/api/admin/payments/students/${paymentId}/approve`
        : `/api/admin/payments/teachers/${paymentId}/approve`;
      await api.post(url, {
        extendMonths: Number(extendMonths) || 0,
      });
      toast.show("Payment slip verified and approved!");
      setViewerItem(null);
      await loadPayments();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to approve payment", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(paymentId) {
    setActionLoading(true);
    try {
      const url = activeTab === "students"
        ? `/api/admin/payments/students/${paymentId}/reject`
        : `/api/admin/payments/teachers/${paymentId}/reject`;
      await api.post(url, {
        reason: rejectReason || "Invalid or unreadable payment slip",
      });
      toast.show("Payment slip rejected with notice sent to user");
      setViewerItem(null);
      await loadPayments();
    } catch (err) {
      toast.show(err?.data?.message || "Failed to reject payment", "error");
    } finally {
      setActionLoading(false);
    }
  }

  const rawList = activeTab === "students" ? studentPayments : teacherPayments;

  const filteredList = rawList.filter((p) => {
    const name = (activeTab === "students" ? p.studentName : p.teacherName) || "";
    const email = (activeTab === "students" ? p.studentEmail : p.teacherEmail) || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.paymentId).includes(searchQuery)
    );
  });

  const evidenceUrl = viewerItem
    ? activeTab === "students"
      ? `/api/payment/student/${viewerItem.paymentId}/evidence`
      : `/api/payment/teacher/${viewerItem.paymentId}/evidence`
    : null;

  return (
    <Layout
      title={t("payments")}
      subtitle="Audit and verify uploaded bank payment slips for students and teachers"
    >
      <div className="sams-payments-container">
        {/* Top Controls Toolbar */}
        <div className="sams-payments-topbar">
          {/* Segmented Tab Switcher (Prompt Requirement 27) */}
          <div className="sams-payments-segmented-control">
            <button
              type="button"
              className={`sams-seg-btn ${activeTab === "students" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("students");
                setSearchQuery("");
              }}
            >
              <span>{t("studentPayments")}</span>
              <span className="sams-seg-count">{studentPayments.length}</span>
            </button>
            <button
              type="button"
              className={`sams-seg-btn ${activeTab === "teachers" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("teachers");
                setSearchQuery("");
              }}
            >
              <span>{t("teacherPayments")}</span>
              <span className="sams-seg-count">{teacherPayments.length}</span>
            </button>
          </div>

          <div className="sams-payments-top-actions">
            <div className="sams-search-field-wrap">
              <SearchIcon size={16} color="var(--text-muted)" />
              <input
                type="text"
                className="sams-search-field"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, email, or ID..."
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCwIcon size={14} />}
              onClick={loadPayments}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Global Action Defaults Box */}
        <Card className="sams-defaults-panel">
          <div className="sams-defaults-title">Verification Defaults</div>
          <div className="sams-defaults-grid">
            <div className="sams-field" style={{ marginBottom: 0 }}>
              <label className="sams-label">
                <span>{t("extendMonths")}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Months added upon approval</span>
              </label>
              <input
                type="number"
                min="0"
                className="sams-input"
                value={extendMonths}
                onChange={(e) => setExtendMonths(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="sams-field" style={{ marginBottom: 0 }}>
              <label className="sams-label">
                <span>{t("rejectReason")}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Sent to user if rejected</span>
              </label>
              <input
                type="text"
                className="sams-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unclear receipt date or invalid transfer reference"
              />
            </div>
          </div>
        </Card>

        {/* Payments Table Card */}
        <Card className="sams-payments-table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8" }}>
              Loading payment requests...
            </div>
          ) : filteredList.length === 0 ? (
            <EmptyState
              icon={<CreditCardIcon size={40} color="var(--accent)" />}
              title="No Payment Records Found"
              description={`No ${activeTab === "students" ? "student" : "teacher"} payment slips found matching your filters.`}
            />
          ) : (
            <div className="sams-table-wrap">
              <table className="sams-table">
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>ID</th>
                    <th>User Information</th>
                    <th>Contact Email</th>
                    <th>Current Expiry</th>
                    <th>Status</th>
                    <th>Slip Evidence</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((p) => {
                    const userName = activeTab === "students" ? p.studentName : p.teacherName;
                    const userEmail = activeTab === "students" ? p.studentEmail : p.teacherEmail;
                    const statusVariant =
                      p.status === "APPROVED"
                        ? "success"
                        : p.status === "REJECTED"
                        ? "danger"
                        : "warning";

                    return (
                      <tr key={p.paymentId}>
                        <td className="mono" style={{ fontWeight: 700, color: "var(--primary)" }}>
                          #{p.paymentId}
                        </td>
                        <td>
                          <div className="sams-user-table-cell">
                            <div className="sams-user-cell-avatar">
                              {userName?.charAt(0) || "U"}
                            </div>
                            <span className="sams-user-cell-name">{userName}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>{userEmail}</td>
                        <td>{p.trialExpDate || "—"}</td>
                        <td>
                          <Badge variant={statusVariant} size="sm" dot>
                            {p.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<EyeIcon size={14} />}
                            onClick={() => {
                              setZoomLevel(1);
                              setViewerItem(p);
                            }}
                          >
                            Review Slip
                          </Button>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="sams-action-btns-row">
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircleIcon size={14} />}
                              onClick={() => handleApprove(p.paymentId)}
                            >
                              {t("approve")}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<XIcon size={14} />}
                              onClick={() => handleReject(p.paymentId)}
                            >
                              {t("reject")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Interactive Payment Slip Viewer Modal (Prompt Requirement 28) */}
        <Modal
          isOpen={!!viewerItem}
          onClose={() => setViewerItem(null)}
          title={t("evidenceViewer")}
          subtitle={`Payment #${viewerItem?.paymentId} · ${activeTab === "students" ? viewerItem?.studentName : viewerItem?.teacherName}`}
          maxWidth="720px"
        >
          {viewerItem && (
            <div className="sams-slip-viewer-content">
              {/* Slip Toolbar */}
              <div className="sams-slip-toolbar">
                <div className="sams-slip-zoom-controls">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ZoomInIcon size={15} />}
                    onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  >
                    {t("zoomIn")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ZoomOutIcon size={15} />}
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  >
                    {t("zoomOut")}
                  </Button>
                  <span className="sams-zoom-level-text">{Math.round(zoomLevel * 100)}%</span>
                </div>

                <a
                  href={evidenceUrl}
                  download={`Payment_Slip_${viewerItem.paymentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sams-btn sams-btn-outline sams-btn-sm"
                >
                  <DownloadIcon size={15} />
                  <span>{t("download")}</span>
                </a>
              </div>

              {/* Document Display Canvas */}
              <div className="sams-slip-display-canvas">
                <img
                  src={evidenceUrl}
                  alt="Payment Receipt Slip"
                  className="sams-slip-preview-img"
                  style={{ transform: `scale(${zoomLevel})` }}
                  onError={(e) => {
                    // Fallback to iframe if document is a PDF
                    e.target.style.display = "none";
                    const iframe = document.getElementById("pdf-frame");
                    if (iframe) iframe.style.display = "block";
                  }}
                />
                <iframe
                  id="pdf-frame"
                  src={evidenceUrl}
                  title="PDF Slip Preview"
                  className="sams-slip-pdf-frame"
                  style={{ display: "none" }}
                />
              </div>

              {/* In-Modal Approval Controls */}
              <div className="sams-slip-modal-footer">
                <div className="sams-slip-footer-meta">
                  <span>Status: <strong>{viewerItem.status}</strong></span>
                  <span>Expiry: {viewerItem.trialExpDate || "—"}</span>
                </div>

                <div className="sams-slip-footer-actions">
                  <Button
                    variant="danger"
                    size="md"
                    loading={actionLoading}
                    icon={<XIcon size={16} />}
                    onClick={() => handleReject(viewerItem.paymentId)}
                  >
                    {t("reject")}
                  </Button>
                  <Button
                    variant="success"
                    size="md"
                    loading={actionLoading}
                    icon={<CheckCircleIcon size={16} />}
                    onClick={() => handleApprove(viewerItem.paymentId)}
                  >
                    {t("approve")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>

      <style>{`
        .sams-payments-container {
          max-width: 1180px;
          margin: 0 auto;
        }

        .sams-payments-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Segmented Control */
        .sams-payments-segmented-control {
          display: inline-flex;
          background: #FFFFFF;
          border: 1.5px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 4px;
          box-shadow: var(--shadow-xs);
        }

        .sams-seg-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: var(--radius-pill);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sams-seg-btn.active {
          background: var(--primary);
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(11, 46, 89, 0.25);
        }

        .sams-seg-count {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: var(--radius-pill);
          background: rgba(0, 0, 0, 0.08);
        }

        .sams-seg-btn.active .sams-seg-count {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .sams-payments-top-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sams-search-field-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 7px 12px;
        }

        .sams-search-field {
          border: none;
          background: transparent;
          font-size: 13px;
          outline: none;
          width: 220px;
        }

        /* Defaults Panel */
        .sams-defaults-panel {
          padding: 16px 20px;
          margin-bottom: 20px;
          background: var(--bg-card-muted);
        }

        .sams-defaults-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--text-secondary);
          margin-bottom: 10px;
        }

        .sams-defaults-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 16px;
        }

        /* Table Card */
        .sams-payments-table-card {
          padding: 0;
          overflow: hidden;
        }

        .sams-user-table-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sams-user-cell-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 700;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sams-user-cell-name {
          font-weight: 700;
          color: var(--text-main);
        }

        .sams-action-btns-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        /* Viewer Modal */
        .sams-slip-viewer-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sams-slip-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-card-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 8px 12px;
        }

        .sams-slip-zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sams-zoom-level-text {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          width: 44px;
          text-align: center;
        }

        .sams-slip-display-canvas {
          background: #0F172A;
          border-radius: var(--radius-lg);
          min-height: 380px;
          max-height: 55vh;
          overflow: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .sams-slip-preview-img {
          max-width: 100%;
          border-radius: var(--radius-sm);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          transition: transform 0.2s ease;
          transform-origin: center center;
        }

        .sams-slip-pdf-frame {
          width: 100%;
          height: 400px;
          border: none;
          border-radius: var(--radius-sm);
        }

        .sams-slip-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
          margin-top: 4px;
        }

        .sams-slip-footer-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
          color: var(--text-secondary);
        }

        .sams-slip-footer-actions {
          display: flex;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .sams-defaults-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}