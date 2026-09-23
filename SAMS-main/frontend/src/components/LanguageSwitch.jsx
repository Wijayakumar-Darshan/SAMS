import React from "react";
import { useI18n } from "../i18n/i18n.jsx";

export default function LanguageSwitch() {
  const { lang, setLanguage } = useI18n();

  return (
    <div className="sams-lang-pill-switch" role="group" aria-label="Language selector">
      <button
        type="button"
        className={`sams-lang-btn ${lang === "en" ? "active" : ""}`}
        onClick={() => setLanguage("en")}
        title="Switch to English"
      >
        EN
      </button>
      <div className="sams-lang-sep" />
      <button
        type="button"
        className={`sams-lang-btn ${lang === "si" ? "active" : ""}`}
        onClick={() => setLanguage("si")}
        title="සිංහල භාෂාවට මාරු වන්න"
      >
        සිං
      </button>

      <style>{`
        .sams-lang-pill-switch {
          display: inline-flex;
          align-items: center;
          background: #FFFFFF;
          border: 1.5px solid var(--border-subtle);
          border-radius: var(--radius-pill);
          padding: 3px 4px;
          box-shadow: var(--shadow-xs);
          transition: all var(--transition-fast);
        }

        .sams-lang-pill-switch:hover {
          border-color: var(--accent);
        }

        .sams-lang-btn {
          border: none;
          background: transparent;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
          line-height: 1;
        }

        .sams-lang-btn:hover {
          color: var(--primary);
        }

        .sams-lang-btn.active {
          background: var(--primary);
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(11, 46, 89, 0.25);
        }

        .sams-lang-sep {
          width: 1px;
          height: 12px;
          background: var(--border-subtle);
          margin: 0 1px;
        }
      `}</style>
    </div>
  );
}