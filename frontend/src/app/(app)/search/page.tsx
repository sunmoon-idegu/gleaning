"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, type Quote } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { getToken } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    (async () => {
      const token = await waitForToken(getToken);
      
      const data = await apiFetch<{ quotes: Quote[] }>(`/search?q=${encodeURIComponent(q)}`, token);
      setQuotes(data.quotes);
      setLoading(false);
    })();
  }, [q, getToken]);

  return (
    <div>
      <h1 className="text-lg font-semibold mb-1">Search</h1>
      {q && <p className="text-sm text-neutral-400 mb-6">Results for &ldquo;{q}&rdquo;</p>}

      {loading && (
        <div className="space-y-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-5 border-b border-neutral-100 dark:border-neutral-800 space-y-2 animate-pulse">
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && q && quotes.length === 0 && (
        <p className="text-sm text-neutral-400">No results found.</p>
      )}

      {!loading && quotes.map((q) => <QuoteCard key={q.id} quote={q} onDeleted={(id) => setQuotes((qs) => qs.filter((x) => x.id !== id))} />)}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
