import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout.jsx";
import { api } from "../../api/client.js";
import { useToast } from "../../components/Toast.jsx";
import { useI18n } from "../../i18n/i18n.jsx";
import { Card, StatCard, Button } from "../../components/UI/index.jsx";
import {
  ShieldIcon,
  CreditCardIcon,
  UsersIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  SchoolIcon,
  CheckCircleIcon,
} from "../../components/UI/Icons.jsx";

export default function AdminDashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);
      const d = await api.get("/api/admin/dashboard");
      setData(d);
    } catch (err) {
      toast.show(err?.data?.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line
  }, []);

  return (
    <Layout
      title={t("adminDashboard")}
      subtitle="School management, teacher credentials, and payment slip verifications"
    >
      <div className="sams-admin-dash-container">
        {/* Top Header Controls */}
        <div className="sams-admin-header-row">
          <div>
            <h2 className="sams-admin-title">System Overview</h2>
            <p className="sams-admin-sub">Monitor pending verifications and institutional setup</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCwIcon size={14} />}
            onClick={loadDashboard}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </div>

        {/* Metrics Grid (Prompt Requirement 25) */}
        <div className="sams-admin-metrics-grid">
          <StatCard
            icon={<CreditCardIcon size={24} />}
            iconColor="amber"
            label={t("pendingStudentPayments")}
            value={data?.pendingStudentPayments ?? 0}
            sublabel="Awaiting bank slip confirmation"
            loading={loading && !data}
          />

          <StatCard
            icon={<CreditCardIcon size={24} />}
            iconColor="purple"
            label={t("pendingTeacherPayments")}
            value={data?.pendingTeacherPayments ?? 0}
            sublabel="Awaiting teacher slip approval"
            loading={loading && !data}
          />
        </div>

        {/* Quick Action Cards */}
        <div className="sams-admin-cards-grid">
          {/* Card 1: Review Payments */}
          <Card hover className="sams-admin-action-card" onClick={() => nav("/admin/payments")}>
            <div className="sams-admin-card-icon-wrap amber">
              <CreditCardIcon size={24} color="#D97706" />
            </div>
            <div className="sams-admin-card-info">
              <h3 className="sams-admin-card-title">Payment Verification Center</h3>
              <p className="sams-admin-card-desc">
                Review uploaded bank slips, inspect proof documents, and approve or reject subscription requests.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconRight={<ArrowRightIcon size={14} />}
            >
              Manage Payments
            </Button>
          </Card>

          {/* Card 2: Teacher & School Management */}
          <Card hover className="sams-admin-action-card" onClick={() => nav("/admin/teachers")}>
            <div className="sams-admin-card-icon-wrap blue">
              <UsersIcon size={24} color="#0284C7" />
            </div>
            <div className="sams-admin-card-info">
              <h3 className="sams-admin-card-title">Teacher & School Management</h3>
              <p className="sams-admin-card-desc">
                Register teacher accounts with secure temporary OTPs, create schools, grades, and classes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              iconRight={<ArrowRightIcon size={14} />}
            >
              Manage Teachers
            </Button>
          </Card>
        </div>
      </div>

      <style>{`
        .sams-admin-dash-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .sams-admin-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .sams-admin-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.02em;
        }

        .sams-admin-sub {
          font-size: 13px;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .sams-admin-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }

        .sams-admin-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .sams-admin-action-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          cursor: pointer;
        }

        .sams-admin-card-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .sams-admin-card-icon-wrap.amber {
          background: #FEF3C7;
        }

        .sams-admin-card-icon-wrap.blue {
          background: #E0F2FE;
        }

        .sams-admin-card-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 6px;
        }

        .sams-admin-card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .sams-admin-metrics-grid {
            grid-template-columns: 1fr;
          }
          .sams-admin-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Layout>
  );
}