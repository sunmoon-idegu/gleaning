import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";

const SUPPORTED = ["en", "zh", "ja"] as const;
export type AppLanguage = (typeof SUPPORTED)[number];

const deviceLang = Localization.getLocales()[0]?.languageCode ?? "en";
const defaultLng: AppLanguage = SUPPORTED.includes(deviceLang as AppLanguage)
  ? (deviceLang as AppLanguage)
  : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },
  },
  lng: defaultLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
