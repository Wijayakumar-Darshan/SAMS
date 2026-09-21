import { ShieldAlert } from "lucide-react";
import { useI18n } from "../i18n/i18n.jsx";
import { useNavigate } from "react-router-dom";

export default function TrialGate({ blocked, children, message }) {
  const { t } = useI18n();
  const nav = useNavigate();

  return (
    <div className="trialGateWrap">
      <div className={blocked ? "trialBlur" : ""}>{children}</div>
      {blocked && (
        <div className="trialOverlay">
          <div className="box card card-pad-lg">
            <div className="icon-wrap" style={{ margin: "0 auto 12px", background: "var(--warning-50)", color: "var(--warning)" }}>
              <ShieldAlert size={24} />
            </div>
            <div className="h2">{t("trialEndedTitle")}</div>
            <p className="subtitle" style={{ marginBottom: 16 }}>
              {message || t("trialEndedMsg")}
            </p>
            <button className="btn btn-accent" onClick={() => nav("/subscription")} type="button">
              {t("goToSubscription")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}