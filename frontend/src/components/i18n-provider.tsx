"use client";

import { useEffect } from "react";
import i18n, { getStoredLang } from "@/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lang = getStoredLang();
    if (lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  }, []);
  return <>{children}</>;
}
