"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { apiFetch, waitForToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";

const PRESET_IDS = ["feature", "love", "bug", "other"] as const;

export default function FeedbackPage() {
  const { getToken } = useAuth();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(false);

  const canSend = !!selected || message.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(false);
    try {
      const token = await waitForToken(getToken);
      await apiFetch("/feedback", token, {
        method: "POST",
        body: JSON.stringify({ category: selected, message: message.trim() || null }),
      });
      setSent(true);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto py-24 flex flex-col items-center gap-4 text-center">
        <CheckCircle size={40} className="text-green-500" />
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{t("feedback.thankYouTitle")}</h1>
        <p className="text-sm text-neutral-500">{t("feedback.thankYouBody")}</p>
        <Button variant="outline" onClick={() => { setSent(false); setSelected(null); setMessage(""); }} className="mt-2">
          {t("feedback.sendMore")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t("feedback.heading")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("feedback.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category chips */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t("feedback.whatsMind")}</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(selected === id ? null : id)}
                className={`px-3.5 py-1.5 rounded-full border text-sm transition-colors cursor-pointer
                  ${selected === id
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                    : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 dark:hover:border-neutral-500"
                  }`}
              >
                {t(`feedback.${id}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t("feedback.details")} <span className="text-neutral-400 font-normal">{t("feedback.detailsOptional")}</span>
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("feedback.placeholder")}
            rows={5}
            maxLength={1000}
            className="resize-none"
          />
          <p className="text-xs text-neutral-400 text-right">{t("feedback.charCount", { count: message.length })}</p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{t("feedback.errorMessage")}</p>
        )}

        <Button type="submit" disabled={!canSend || sending}>
          {sending ? t("feedback.sending") : t("feedback.send")}
        </Button>
      </form>
    </div>
  );
}
