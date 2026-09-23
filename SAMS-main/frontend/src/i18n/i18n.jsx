import React, { createContext, useContext, useMemo, useState } from "react";
import { translations } from "./translations.js";

const I18nCtx = createContext(null);

export function I18nProvider({ children }) {
  const saved = localStorage.getItem("lang") || "en";
  const [lang, setLang] = useState(saved);

  const value = useMemo(() => {
    function t(key) {
      return translations[lang]?.[key] ?? translations.en[key] ?? key;
    }
    function setLanguage(next) {
      setLang(next);
      localStorage.setItem("lang", next);
    }
    return { lang, t, setLanguage };
  }, [lang]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  return useContext(I18nCtx);
}