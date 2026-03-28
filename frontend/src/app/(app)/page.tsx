"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, type Quote } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function FeedPage() {
  const { getToken } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { document.title = "Feed · Quote"; }, []);

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
    (async () => {
      try {
        const token = await waitForToken(getToken);
        const data = await apiFetch<Quote[]>("/quotes", token);
        setQuotes(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(quotes.length - 1, i + 1));
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
        <div className="w-full max-w-2xl space-y-4 animate-pulse px-4">
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
        <p className="text-sm">No quotes yet. Press ⌘N to add one.</p>
      </div>
    );
  }

  const quote = quotes[index];

  return (
    <div className="-my-8 h-[calc(100vh-56px)] flex flex-col items-center justify-center gap-8 px-4">
      {/* Card */}
      <div key={index} className="relative w-full max-w-2xl rounded-2xl border border-border px-10 py-12 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
        <QuoteCard
          quote={quote}
          onDeleted={(id) => {
            const next = quotes.filter((x) => x.id !== id);
            setQuotes(next);
            setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
          }}
          onUpdated={(updated) => setQuotes((qs) => qs.map((x) => x.id === updated.id ? updated : x))}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="cursor-pointer p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:cursor-default"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="text-sm text-muted-foreground tabular-nums">
          {index + 1} / {quotes.length}
        </span>

        <button
          onClick={() => setIndex((i) => Math.min(quotes.length - 1, i + 1))}
          disabled={index === quotes.length - 1}
          className="cursor-pointer p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-20 disabled:cursor-default"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
