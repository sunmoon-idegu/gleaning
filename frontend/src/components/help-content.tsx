"use client";

import { useTranslation } from "react-i18next";
import "@/i18n";
import { ChevronDown } from "lucide-react";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 text-xs rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
      {children}
    </kbd>
  );
}

export function HelpContent() {
  const { t } = useTranslation();

  const shortcuts = [
    { keys: ["⌘", "E"], description: t("help.shortcuts.quickAdd"), detail: t("help.shortcuts.quickAddDetail") },
    { keys: ["⌘", "K"], description: t("help.shortcuts.search"), detail: t("help.shortcuts.searchDetail") },
    { keys: ["F"], description: t("help.shortcuts.displayMode"), detail: t("help.shortcuts.displayModeDetail") },
    { keys: ["Space"], description: t("help.shortcuts.nextQuote"), detail: t("help.shortcuts.nextQuoteDetail") },
  ];

  const faqs = [
    { q: t("help.faq.q1"), a: t("help.faq.a1") },
    { q: t("help.faq.q2"), a: t("help.faq.a2") },
    { q: t("help.faq.q3"), a: t("help.faq.a3") },
    { q: t("help.faq.q4"), a: t("help.faq.a4") },
    { q: t("help.faq.q5"), a: t("help.faq.a5") },
    { q: t("help.faq.q6"), a: t("help.faq.a6") },
  ];

  return (
    <div className="max-w-2xl space-y-12">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t("nav.help")}</h1>
        <p className="mt-2 text-sm text-neutral-500">{t("help.subtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{t("help.shortcuts.heading")}</h2>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {shortcuts.map(({ keys, description, detail }) => (
            <div key={description} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <span className="text-sm text-neutral-900 dark:text-neutral-100">{description}</span>
                <span className="ml-2 text-sm text-neutral-400">{detail}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{t("help.faq.heading")}</h2>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 list-none">
                {q}
                <ChevronDown size={14} className="shrink-0 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-3 pb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{t("help.contact.heading")}</h2>
        <p className="text-sm text-neutral-500 leading-relaxed">{t("help.contact.body")}</p>
        <a
          href="mailto:sunmoon.idegu@gmail.com"
          className="inline-block text-sm text-neutral-900 dark:text-neutral-100 underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors"
        >
          sunmoon.idegu@gmail.com
        </a>
      </section>
    </div>
  );
}
