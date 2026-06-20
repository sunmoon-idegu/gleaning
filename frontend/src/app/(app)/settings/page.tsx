"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { ChevronRight, HelpCircle, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { setWebLanguage, type WebLanguage } from "@/i18n";
import "@/i18n";

const LANGS: { value: WebLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentLang = i18n.language as WebLanguage;

  const THEMES = [
    { value: "light", label: t("settings.themeLight") },
    { value: "system", label: t("settings.themeSystem") },
    { value: "dark", label: t("settings.themeDark") },
  ];

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t("settings.heading")}</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{t("settings.appearance")}</h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-900 dark:text-neutral-100">{t("settings.colorTheme")}</span>
            {mounted ? (
              <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1">
                {THEMES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      theme === value
                        ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-8 w-48 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{t("settings.language")}</h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-neutral-900 dark:text-neutral-100">{t("settings.language")}</span>
            <div className="flex items-center gap-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1">
              {LANGS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setWebLanguage(value)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    currentLang === value
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{t("settings.support")}</h2>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <Link href="/help" className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle size={16} className="text-neutral-400" />
              <span className="text-sm text-neutral-900 dark:text-neutral-100">{t("nav.help")}</span>
            </div>
            <ChevronRight size={14} className="text-neutral-400" />
          </Link>
          <Link href="/feedback" className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare size={16} className="text-neutral-400" />
              <span className="text-sm text-neutral-900 dark:text-neutral-100">{t("nav.feedback")}</span>
            </div>
            <ChevronRight size={14} className="text-neutral-400" />
          </Link>
        </div>
      </section>
    </div>
  );
}
