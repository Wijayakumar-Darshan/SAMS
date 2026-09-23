import React from "react";
import { useI18n } from "../i18n/i18n.jsx";
import { useNavigate } from "react-router-dom";
import { ShieldIcon, ArrowRightIcon } from "./UI/Icons.jsx";
import { Button } from "./UI/index.jsx";

export default function TrialGate({ blocked, children, message }) {
  const { t } = useI18n();
  const nav = useNavigate();

  return (
    <div className="sams-trial-gate-container">
      <div className={blocked ? "sams-trial-blur" : ""}>{children}</div>

      {blocked && (
        <div className="sams-trial-backdrop">
          <div className="sams-trial-card animate-scale-in">
            <div className="sams-trial-icon-wrap">
              <ShieldIcon size={36} color="var(--accent)" />
            </div>

            <h2 className="sams-trial-title">
              {t("trialEndedCalmTitle")}
            </h2>

            <p className="sams-trial-msg">
              {message || t("trialEndedCalmMsg")}
            </p>

            <div className="sams-trial-features">
              <div className="sams-trial-feature-item">
                <span className="sams-check-dot">✓</span>
                <span>All your study logs & analytics are preserved</span>
              </div>
              <div className="sams-trial-feature-item">
                <span className="sams-check-dot">✓</span>
                <span>Instant re-activation upon payment slip verification</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              iconRight={<ArrowRightIcon size={18} />}
              onClick={() => nav("/subscription")}
              className="sams-trial-btn"
            >
              {t("viewSubscription")}
            </Button>
          </div>
        </div>
      )}

      <style>{`
        .sams-trial-gate-container {
          position: relative;
          min-height: 100%;
        }

        .sams-trial-blur {
          filter: blur(5px);
          pointer-events: none;
          user-select: none;
          opacity: 0.5;
        }

        .sams-trial-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(11, 46, 89, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 100;
          animation: fadeIn 0.25s ease;
        }

        .sams-trial-card {
          background: #FFFFFF;
          border-radius: var(--radius-2xl);
          padding: 36px 32px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(11, 46, 89, 0.25);
          border: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sams-trial-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 0 0 8px rgba(234, 244, 252, 0.6);
        }

        .sams-trial-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .sams-trial-msg {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .sams-trial-features {
          width: 100%;
          background: var(--bg-card-muted);
          border-radius: var(--radius-lg);
          padding: 14px 16px;
          margin-bottom: 24px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
          color: var(--text-main);
        }

        .sams-trial-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sams-check-dot {
          color: var(--success);
          font-weight: 800;
        }

        .sams-trial-btn {
          width: 100%;
        }
      `}</style>
    </div>
  );
}