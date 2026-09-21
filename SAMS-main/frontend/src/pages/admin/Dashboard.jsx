import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, School, Wallet, CreditCard, CloudOff } from "lucide-react";
import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { StatCard, SkeletonCards, ErrorState } from "../../components/ui.jsx";

export default function Dashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      setData(await api.get("/api/admin/dashboard"));
    } catch (err) {
      setError(true);
      toast.show(err?.data?.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPending = (data?.pendingStudentPayments || 0) + (data?.pendingTeacherPayments || 0);

  return (
    <Layout title={t("adminDashboard")}>
      <div className="stack" style={{ gap: 20 }}>
        {loading ? (
          <SkeletonCards count={4} />
        ) : error ? (
          <div className="card">
            <ErrorState icon={<CloudOff size={22} />} title={t("couldntLoad")} onRetry={load} retryLabel={t("tryAgain")} />
          </div>
        ) : (
          <>
            <div className="grid grid-4">
              <StatCard icon={<GraduationCap size={18} />} label="Total teachers" value={data.totalTeachers} />
              <StatCard icon={<Users size={18} />} label="Total students" value={data.totalStudents} />
              <StatCard icon={<School size={18} />} label="Schools" value={data.totalSchools} />
              <StatCard icon={<Wallet size={18} />} label="Pending payments" value={totalPending} accent={totalPending > 0} />
            </div>

            <div className="grid grid-2">
              <div className="card">
                <div className="h2">Active subscriptions</div>
                <div className="row">
                  <div className="col">
                    <div className="stat-label">Teachers</div>
                    <div className="stat-value">{data.activeTeacherSubscriptions}</div>
                    <div className="faint" style={{ fontSize: 12 }}>of {data.totalTeachers} total</div>
                  </div>
                  <div className="col">
                    <div className="stat-label">Students</div>
                    <div className="stat-value">{data.activeStudentSubscriptions}</div>
                    <div className="faint" style={{ fontSize: 12 }}>of {data.totalStudents} total</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="h2">Pending actions</div>
                <div className="stack" style={{ gap: 10 }}>
                  <button className="btn btn-outline btn-block" type="button" onClick={() => nav("/admin/payments")} style={{ justifyContent: "space-between" }}>
                    <span className="center-v" style={{ gap: 8 }}><Wallet size={15} /> {t("pendingStudentPayments")}</span>
                    <span className="badge badge-warning">{data.pendingStudentPayments}</span>
                  </button>
                  <button className="btn btn-outline btn-block" type="button" onClick={() => nav("/admin/payments")} style={{ justifyContent: "space-between" }}>
                    <span className="center-v" style={{ gap: 8 }}><CreditCard size={15} /> {t("pendingTeacherPayments")}</span>
                    <span className="badge badge-warning">{data.pendingTeacherPayments}</span>
                  </button>
                  <button className="btn btn-block" type="button" onClick={() => nav("/admin/teachers")}>
                    <GraduationCap size={15} /> Manage teachers
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
