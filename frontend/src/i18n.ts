import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";

const SUPPORTED = ["en", "zh", "ja"] as const;
export type WebLanguage = (typeof SUPPORTED)[number];
export const STORAGE_KEY = "gleaning_language";

export function getStoredLang(): WebLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as WebLanguage | null;
    if (stored && SUPPORTED.includes(stored)) return stored;
    const browser = navigator.language.split("-")[0] as WebLanguage;
    if (SUPPORTED.includes(browser)) return browser;
  } catch {
    // no-op
  }
  return "en";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      ja: { translation: ja },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export function setWebLanguage(lang: WebLanguage) {
  i18n.changeLanguage(lang);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lang);
  }
}

export default i18n;
