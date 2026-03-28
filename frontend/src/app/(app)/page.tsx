"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, type Quote } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";
import Link from "next/link";

const PAGE_SIZE = 5;

export default function FeedPage() {
  const { getToken } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await waitForToken(getToken);
      
      const data = await apiFetch<Quote[]>("/quotes", token);
      setQuotes(data);
      setLoading(false);
    })();
  }, [getToken]);

  if (loading) {
    return (
      <div className="space-y-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-10 border-b border-neutral-100 dark:border-neutral-800 space-y-3 animate-pulse">
            <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded w-4/5" />
            <div className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded w-3/5" />
            <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4 mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-32 text-neutral-400">
        <p className="text-sm">No quotes yet.</p>
        <Link href="/add" className="mt-3 inline-block text-sm text-neutral-900 dark:text-neutral-100 underline underline-offset-4">
          Add your first one
        </Link>
      </div>
    );
  }

  const shown = quotes.slice(0, visible);
  const hasMore = visible < quotes.length;

  return (
    <div>
      {shown.map((q) => (
        <QuoteCard
          key={q.id}
          quote={q}
          onDeleted={(id) => setQuotes((qs) => qs.filter((x) => x.id !== id))}
          onUpdated={(updated) => setQuotes((qs) => qs.map((x) => x.id === updated.id ? updated : x))}
        />
      ))}

      {hasMore && (
        <div className="pt-8 pb-4 text-center">
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
