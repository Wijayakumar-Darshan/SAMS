import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, FileText, CloudOff, Wallet, CalendarDays } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Modal, Skeleton, ErrorState, EmptyState } from "../../components/ui.jsx";

const STATUS_TONE = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" };
const TABS = [
  { key: "STUDENT", label: "Student payments" },
  { key: "TEACHER", label: "Teacher payments" }
];
const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"];

function PaymentsTable({ tab, rows, onApprove, onReject, onEditExpiry, onViewEvidence }) {
  const personLabel = tab === "STUDENT" ? "Student" : "Teacher";

  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{personLabel}</th>
            <th>Email</th>
            <th>Expiry</th>
            <th>Status</th>
            <th>Evidence</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((p) => (
            <tr key={p.paymentId}>
              <td>#{p.paymentId}</td>
              <td style={{ fontWeight: 600 }}>{p.studentName || p.teacherName || "-"}</td>
              <td className="faint">{p.studentEmail || p.teacherEmail || "-"}</td>
              <td style={{ whiteSpace: "nowrap" }}>{p.trialExpDate || "-"}</td>

              <td>
                <span className={"badge badge-" + (STATUS_TONE[p.status] || "default")}>
                  {p.status || "-"}
                </span>
              </td>

              <td>
                {/* IMPORTANT: use button + fetch blob, not <a href> (browser won't send JWT header) */}
                <button
                  type="button"
                  className="badge badge-info"
                  style={{ cursor: "pointer", border: "none" }}
                  onClick={() => onViewEvidence(p)}
                  title="View evidence"
                >
                  <FileText size={11} /> View
                </button>
              </td>

              <td>
                {p.status === "PENDING" ? (
                  <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    <button className="btn btn-success btn-sm" type="button" onClick={() => onApprove(p)} title="Approve">
                      <CheckCircle2 size={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => onReject(p)} title="Reject">
                      <XCircle size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="stack" style={{ gap: 6, alignItems: "flex-start" }}>
                    {p.status === "APPROVED" && (
                      <button
                        className="btn btn-outline btn-sm"
                        type="button"
                        onClick={() => onEditExpiry(p)}
                        title="Edit expiry"
                      >
                        <CalendarDays size={14} /> Edit expiry
                      </button>
                    )}

                    <span className="faint" style={{ fontSize: 12 }}>
                      {p.verifiedBy ? `by ${p.verifiedBy}` : "-"}
                    </span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Fetch evidence using JWT header (works for ADMIN too, if backend allows). */
async function fetchEvidenceBlob(roleTab, paymentId) {
  const token = api.storage.getAccess();

  const url =
    roleTab === "STUDENT"
      ? `/api/payment/student/${paymentId}/evidence`
      : `/api/payment/teacher/${paymentId}/evidence`;

  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // show something meaningful
    throw new Error(text || `Failed to load evidence (${res.status})`);
  }

  return await res.blob();
}

export default function Payments() {
  const { t } = useI18n();
  const toast = useToast();

  const [tab, setTab] = useState("STUDENT");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [studentPayments, setStudentPayments] = useState([]);
  const [teacherPayments, setTeacherPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // { type: 'approve'|'reject'|'expiry', role, payment }
  const [action, setAction] = useState(null);

  // keep as string to avoid controlled input edge cases, convert on submit
  const [extendMonths, setExtendMonths] = useState("1");
  const [rejectReason, setRejectReason] = useState("");
  const [expiryDate, setExpiryDate] = useState(""); // YYYY-MM-DD
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const [sp, tp] = await Promise.all([
        api.get("/api/admin/payments/students"),
        api.get("/api/admin/payments/teachers")
      ]);
      setStudentPayments(sp || []);
      setTeacherPayments(tp || []);
    } catch (err) {
      setError(true);
      toast.show(err?.data?.message || "Failed to load payments", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAction(type, role, payment) {
    setAction({ type, role, payment });
    setExtendMonths("1");
    setRejectReason("");
    setExpiryDate((payment?.trialExpDate || "").slice(0, 10)); // if "2026-10-20", stays same
  }

  async function onViewEvidence(paymentRow) {
    try {
      const blob = await fetchEvidenceBlob(tab, paymentRow.paymentId);

      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");

      // cleanup memory later
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e) {
      toast.show(e?.message || "Could not open evidence", "error");
    }
  }

  async function confirmAction() {
    if (!action) return;
    setSubmitting(true);

    try {
      const { type, role, payment } = action;

      if (type === "approve") {
        const months = Number(extendMonths);
        if (!Number.isFinite(months) || months < 1) {
          toast.show("Enter valid months (min 1)", "error");
          return;
        }
        const base = role === "STUDENT" ? "/api/admin/payments/students" : "/api/admin/payments/teachers";
        await api.post(`${base}/${payment.paymentId}/approve`, { extendMonths: months });
        toast.show("Payment approved", "success");
      }

      if (type === "reject") {
        const base = role === "STUDENT" ? "/api/admin/payments/students" : "/api/admin/payments/teachers";
        await api.post(`${base}/${payment.paymentId}/reject`, { reason: rejectReason?.trim() || "Invalid slip" });
        toast.show("Payment rejected", "success");
      }

      if (type === "expiry") {
        const isStudent = role === "STUDENT";
        const accountId = isStudent ? payment.studentId : payment.teacherId;

        if (!accountId) {
          toast.show("Missing studentId/teacherId in payment row", "error");
          return;
        }
        if (!expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
          toast.show("Please select a valid expiry date", "error");
          return;
        }

        const url = isStudent
          ? `/api/admin/students/${accountId}/expiry`
          : `/api/admin/teachers/${accountId}/expiry`;

        await api.put(url, { expiryDate });
        toast.show("Expiry date updated", "success");
      }

      setAction(null);
      await load();
    } catch (err) {
      toast.show(err?.data?.message || "Action failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  const pendingCounts = useMemo(
    () => ({
      STUDENT: studentPayments.filter((p) => p.status === "PENDING").length,
      TEACHER: teacherPayments.filter((p) => p.status === "PENDING").length
    }),
    [studentPayments, teacherPayments]
  );

  const rows = useMemo(() => {
    const src = tab === "STUDENT" ? studentPayments : teacherPayments;
    return statusFilter === "ALL" ? src : src.filter((p) => p.status === statusFilter);
  }, [tab, statusFilter, studentPayments, teacherPayments]);

  const isExpiryEdit = action?.type === "expiry";

  return (
    <Layout title={t("payments")}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="grid grid-2">
          <div className="card between">
            <div>
              <div className="stat-label">Pending student payments</div>
              <div className="stat-value">{pendingCounts.STUDENT}</div>
            </div>
            <div className="stat-icon" style={{ background: "var(--warning-50)", color: "var(--warning)" }}>
              <Wallet size={18} />
            </div>
          </div>

          <div className="card between">
            <div>
              <div className="stat-label">Pending teacher payments</div>
              <div className="stat-value">{pendingCounts.TEACHER}</div>
            </div>
            <div className="stat-icon" style={{ background: "var(--warning-50)", color: "var(--warning)" }}>
              <Wallet size={18} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="between mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="tabs" style={{ marginBottom: 0, maxWidth: 320 }}>
              {TABS.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  className={"tab " + (tab === x.key ? "active" : "")}
                  onClick={() => setTab(x.key)}
                >
                  {x.label}
                </button>
              ))}
            </div>

            <div className="center-v" style={{ gap: 6 }}>
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={"badge" + (statusFilter === s ? " badge-primary" : "")}
                  style={{ cursor: "pointer", border: statusFilter === s ? undefined : "1px solid var(--border)" }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "ALL" ? "All" : s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <Skeleton height={200} radius={12} />
          ) : error ? (
            <ErrorState icon={<CloudOff size={20} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          ) : rows.length === 0 ? (
            <EmptyState icon={<Wallet size={20} />} title="No payment records" message="Payments matching this filter will appear here." />
          ) : (
            <PaymentsTable
              tab={tab}
              rows={rows}
              onApprove={(p) => openAction("approve", tab, p)}
              onReject={(p) => openAction("reject", tab, p)}
              onEditExpiry={(p) => openAction("expiry", tab, p)}
              onViewEvidence={onViewEvidence}
            />
          )}
        </div>
      </div>

      <Modal
        open={!!action}
        title={
          isExpiryEdit
            ? "Edit expiry date"
            : action?.type === "approve"
              ? "Approve payment"
              : "Reject payment"
        }
        onClose={() => !submitting && setAction(null)}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setAction(null)} disabled={submitting}>
              {t("cancel")}
            </button>

            <button
              className={"btn " + (isExpiryEdit ? "btn-accent" : action?.type === "approve" ? "btn-success" : "btn-danger")}
              type="button"
              onClick={confirmAction}
              disabled={submitting}
            >
              {submitting ? "Please wait…" : isExpiryEdit ? "Save" : action?.type === "approve" ? t("approve") : t("reject")}
            </button>
          </>
        }
      >
        {isExpiryEdit ? (
          <div className="field">
            <label className="label">New expiry date</label>
            <input
              className="input"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={submitting}
            />
            <p className="subtitle mt-2">
              This changes the account expiry date (student/teacher). Payment status will not change.
            </p>
          </div>
        ) : (
          <>
            <p className="subtitle mb-3">
              {action?.type === "approve"
                ? `This will approve payment #${action?.payment?.paymentId} and extend the subscription.`
                : `This will reject payment #${action?.payment?.paymentId}. This action cannot be undone.`}
            </p>

            {action?.type === "approve" ? (
              <div className="field">
                <label className="label">{t("extendMonths")}</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  step={1}
                  value={extendMonths}
                  onChange={(e) => setExtendMonths(e.target.value)}
                  disabled={submitting}
                />
              </div>
            ) : (
              <div className="field">
                <label className="label">{t("rejectReason")}</label>
                <textarea
                  className="textarea"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Slip amount does not match"
                  disabled={submitting}
                />
              </div>
            )}
          </>
        )}
      </Modal>
    </Layout>
  );
}