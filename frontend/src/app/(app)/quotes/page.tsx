"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { apiFetch, waitForToken, type Quote } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";
import { ChevronRight } from "lucide-react";

function setDisplayMode(active: boolean) {
  window.dispatchEvent(new CustomEvent("gleaning:display-mode", { detail: active }));
}

export default function FeedPage() {
  const { t } = useTranslation();
  const { getToken, isLoaded } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [displayMode, setDisplayModeState] = useState(false);
  const lastTapRef = useRef(0);

  function handleDoubleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setDisplayModeState((prev) => !prev);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }

  useEffect(() => { document.title = "Quotes · Gleaning"; }, []);

  // Sync display mode state to nav/button via custom event
  useEffect(() => {
    setDisplayMode(displayMode);
  }, [displayMode]);

  // Clean up display mode when leaving the page
  useEffect(() => () => setDisplayMode(false), []);

  useEffect(() => {
    const handler = (e: Event) => {
      const quote = (e as CustomEvent).detail as Quote;
      setQuotes((qs) => [quote, ...qs]);
      setIndex(0);
    };
    window.addEventListener("quote-added", handler);
    return () => window.removeEventListener("quote-added", handler);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<Quote[]>("/quotes", token);
        setQuotes(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, isLoaded]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        setIndex((i) => (i + 1) % quotes.length);
      }
      if (e.key === "f" || e.key === "F") {
        setDisplayModeState((prev) => !prev);
      }
      if (e.key === "Escape") {
        setDisplayModeState(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [quotes.length]);

  if (error) {
    return (
      <div className="text-center py-32 text-neutral-400">
        <p className="text-sm">Failed to load quotes. Please refresh.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="-my-8 h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="w-full max-w space-y-4 animate-pulse px-4">
          <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded w-4/5" />
          <div className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded w-3/5" />
          <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4 mt-6" />
        </div>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-32 text-neutral-400">
        <p className="text-sm">{t("quotes.empty")}</p>
      </div>
    );
  }

  const quote = quotes[index];

  return (
    <div className={`flex items-center justify-center px-4 transition-all duration-300 ${displayMode ? "fixed inset-0 bg-background z-30" : "-my-8 h-[calc(100vh-56px)]"}`}>
      {/* Card + navigation */}
      <div className="relative w-full max-w-3xl">
        <div key={index} onTouchEnd={handleDoubleTap} className="relative rounded-2xl border border-transparent px-10 py-12 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <QuoteCard
            quote={quote}
            hideDate={displayMode}
          />
        </div>

        {/* Counter + arrow — hidden in display mode */}
        {!displayMode && (
          <div className="
            flex items-center gap-2
            absolute -bottom-10 left-1/2 -translate-x-1/2 flex-row
            md:flex-col md:top-1/2 md:-translate-y-1/2 md:-right-16 md:bottom-auto md:left-auto md:translate-x-0
          ">
            <span className="text-xs text-muted-foreground/50 tabular-nums md:order-last">
              {index + 1}/{quotes.length}
            </span>
            <button
              onClick={() => setIndex((i) => (i + 1) % quotes.length)}
              className="cursor-pointer p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Next (Space)"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
