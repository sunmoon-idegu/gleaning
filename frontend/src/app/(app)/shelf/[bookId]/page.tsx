"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, type BookWithQuotes } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

function openAddQuote(bookId: string) {
  window.dispatchEvent(new CustomEvent("open-add-quote", { detail: { bookId } }));
}

export default function BookPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const { getToken } = useAuth();
  const [book, setBook] = useState<BookWithQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await waitForToken(getToken);
        const data = await apiFetch<BookWithQuotes>(`/books/${bookId}`, token);
        setBook(data);
        document.title = `${data.title} · Quote`;
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, bookId]);

  if (loading) {
    return <div className="py-12 text-center text-neutral-400 text-sm animate-pulse">Loading…</div>;
  }

  if (error) {
    return (
      <div className="text-center py-32 text-neutral-400">
        <p className="text-sm">Failed to load book. Please refresh.</p>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div>
      <Link href="/shelf" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 mb-8">
        <ArrowLeft size={14} /> Shelf
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold">{book.title}</h1>
          {book.author && <p className="text-sm text-neutral-500 mt-1">{book.author}</p>}
          <p className="text-xs text-neutral-400 mt-2">
            {book.quotes.length} {book.quotes.length === 1 ? "quote" : "quotes"}
          </p>
        </div>
        <button
          onClick={() => openAddQuote(bookId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus size={14} /> Add quote
        </button>
      </div>

      {book.quotes.length === 0 ? (
        <p className="text-sm text-neutral-400">No quotes from this book yet.</p>
      ) : (
        <div>
          {book.quotes.map((q) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onDeleted={(id) => setBook((b) => b ? { ...b, quotes: b.quotes.filter((x) => x.id !== id) } : b)}
              onUpdated={(updated) => setBook((b) => b ? { ...b, quotes: b.quotes.map((x) => x.id === updated.id ? updated : x) } : b)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
