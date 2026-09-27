import { Languages } from "lucide-react";
import { useI18n } from "../i18n/i18n.jsx";

export default function LanguageSwitch() {
  const { lang, setLanguage, t } = useI18n();
  return (
    <button
      className="btn btn-outline btn-sm"
      onClick={() => setLanguage(lang === "en" ? "si" : "en")}
      type="button"
      title={t("language")}
    >
      <Languages size={15} />
      {lang === "en" ? t("sinhala") : t("english")}
    </button>
  );
}
