import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, FileText, CloudOff, Wallet } from "lucide-react";
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

function PaymentsTable({ rows, personLabel, evidenceBase, onApprove, onReject }) {
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
              <td style={{ fontWeight: 600 }}>{p.studentName || p.teacherName}</td>
              <td className="faint">{p.studentEmail || p.teacherEmail}</td>
              <td>{p.trialExpDate}</td>
              <td><span className={"badge badge-" + (STATUS_TONE[p.status] || "default")}>{p.status}</span></td>
              <td>
                <a className="badge badge-info" href={`${evidenceBase}/${p.paymentId}/evidence`} target="_blank" rel="noreferrer">
                  <FileText size={11} /> View
                </a>
              </td>
              <td>
                {p.status === "PENDING" ? (
                  <div className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                    <button className="btn btn-success btn-sm" type="button" onClick={() => onApprove(p)}>
                      <CheckCircle2 size={13} />
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => onReject(p)}>
                      <XCircle size={13} />
                    </button>
                  </div>
                ) : (
                  <span className="faint" style={{ fontSize: 12 }}>
                    {p.verifiedBy ? `by ${p.verifiedBy}` : "-"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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

  const [action, setAction] = useState(null); // { type: 'approve'|'reject', role, payment }
  const [extendMonths, setExtendMonths] = useState(1);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const [sp, tp] = await Promise.all([
        api.get("/api/admin/payments/students"),
        api.get("/api/admin/payments/teachers")
      ]);
      setStudentPayments(sp);
      setTeacherPayments(tp);
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
    setExtendMonths(1);
    setRejectReason("");
  }

  async function confirmAction() {
    if (!action) return;
    setSubmitting(true);
    try {
      const { type, role, payment } = action;
      const base = role === "STUDENT" ? "/api/admin/payments/students" : "/api/admin/payments/teachers";
      if (type === "approve") {
        await api.post(`${base}/${payment.paymentId}/approve`, { extendMonths: Number(extendMonths) || 0 });
        toast.show("Payment approved", "success");
      } else {
        await api.post(`${base}/${payment.paymentId}/reject`, { reason: rejectReason || "Invalid slip" });
        toast.show("Payment rejected", "success");
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

  return (
    <Layout title={t("payments")}>
      <div className="stack" style={{ gap: 16 }}>
        <div className="grid grid-2">
          <div className="card between">
            <div>
              <div className="stat-label">Pending student payments</div>
              <div className="stat-value">{pendingCounts.STUDENT}</div>
            </div>
            <div className="stat-icon" style={{ background: "var(--warning-50)", color: "var(--warning)" }}><Wallet size={18} /></div>
          </div>
          <div className="card between">
            <div>
              <div className="stat-label">Pending teacher payments</div>
              <div className="stat-value">{pendingCounts.TEACHER}</div>
            </div>
            <div className="stat-icon" style={{ background: "var(--warning-50)", color: "var(--warning)" }}><Wallet size={18} /></div>
          </div>
        </div>

        <div className="card">
          <div className="between mb-3" style={{ flexWrap: "wrap", gap: 10 }}>
            <div className="tabs" style={{ marginBottom: 0, maxWidth: 320 }}>
              {TABS.map((x) => (
                <button key={x.key} type="button" className={"tab " + (tab === x.key ? "active" : "")} onClick={() => setTab(x.key)}>
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
              rows={rows}
              personLabel={tab === "STUDENT" ? "Student" : "Teacher"}
              evidenceBase={tab === "STUDENT" ? "/api/payment/student" : "/api/payment/teacher"}
              onApprove={(p) => openAction("approve", tab, p)}
              onReject={(p) => openAction("reject", tab, p)}
            />
          )}
        </div>
      </div>

      <Modal
        open={!!action}
        title={action?.type === "approve" ? "Approve payment" : "Reject payment"}
        onClose={() => !submitting && setAction(null)}
        footer={
          <>
            <button className="btn btn-outline" type="button" onClick={() => setAction(null)} disabled={submitting}>
              {t("cancel")}
            </button>
            <button
              className={"btn " + (action?.type === "approve" ? "btn-success" : "btn-danger")}
              type="button"
              onClick={confirmAction}
              disabled={submitting}
            >
              {submitting ? "Please wait…" : action?.type === "approve" ? t("approve") : t("reject")}
            </button>
          </>
        }
      >
        <p className="subtitle mb-3">
          {action?.type === "approve"
            ? `This will approve payment #${action?.payment?.paymentId} and extend the subscription.`
            : `This will reject payment #${action?.payment?.paymentId}. This action cannot be undone.`}
        </p>
        {action?.type === "approve" ? (
          <div className="field">
            <label className="label">{t("extendMonths")}</label>
            <input className="input" type="number" min={1} value={extendMonths} onChange={(e) => setExtendMonths(e.target.value)} />
          </div>
        ) : (
          <div className="field">
            <label className="label">{t("rejectReason")}</label>
            <textarea className="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Slip amount does not match" />
          </div>
        )}
      </Modal>
    </Layout>
  );
}
