"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { apiFetch, waitForToken, LANGUAGES, type Book, type Quote } from "@/lib/api";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSelect } from "@/components/language-select";

type SourceType = "book" | "video" | null;

export default function EditQuotePage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const { getToken, isLoaded } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [page, setPage] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookLanguage, setNewBookLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken();
      if (!token) return;
      const [quote, booksData] = await Promise.all([
        apiFetch<Quote>(`/quotes/${quoteId}`, token),
        apiFetch<Book[]>("/books", token),
      ]);
      setBooks(booksData);

      setText(quote.text);
      setPage(quote.page?.toString() ?? "");

      if (quote.source_type === "book" && quote.book_id) {
        setSourceType("book");
        setBookId(quote.book_id);
        const book = booksData.find((b) => b.id === quote.book_id);
        if (book) setBookSearch(book.title);
      }

      setLoading(false);
      setTimeout(() => textRef.current?.focus(), 50);
    })();
  }, [getToken, isLoaded, quoteId]);

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase())
  );

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const token = await waitForToken(getToken);

    let sourceId: string | null = existingSourceId;

    await apiFetch(`/quotes/${quoteId}`, token, {
      method: "PATCH",
      body: JSON.stringify({
        text: text.trim(),
        source_type: sourceType === "book" && bookId ? "book" : null,
        book_id: sourceType === "book" && bookId ? bookId : null,
        page: page ? parseInt(page) : null,
      }),
    });

    router.back();
  }

  async function handleCreateBook() {
    if (!newBookTitle.trim()) return;
    const token = await waitForToken(getToken);
    const book = await apiFetch<Book>("/books", token, {
      method: "POST",
      body: JSON.stringify({ title: newBookTitle.trim(), author: newBookAuthor.trim() || null, language: newBookLanguage || null }),
    });
    setBooks((b) => [...b, book]);
    setBookId(book.id);
    setBookSearch(book.title);
    setShowNewBook(false);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookLanguage("");
  }

  const sourceTypes: { value: NonNullable<SourceType>; label: string }[] = [
    { value: "book", label: "Book" },
  ];

  if (loading) return <div className="py-12 text-sm text-neutral-400 animate-pulse">Loading…</div>;

  return (
    <div className="max-w-xl">
      <Link href="/" className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 mb-6">
        <ArrowLeft size={14} /> Back
      </Link>
      <h1 className="text-lg font-semibold mb-6">Edit quote</h1>

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(); }}
        className="space-y-5"
      >
        <Textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none text-base"
        />

        <div>
          <label className="text-xs text-neutral-400 uppercase tracking-wide mb-2 block">Source</label>
          <div className="flex gap-1 flex-wrap">
            {sourceTypes.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceType(sourceType === value ? null : value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  sourceType === value
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {sourceType === "book" && (
          <div className="space-y-3">
            {!showNewBook ? (
              <>
                <div className="relative">
                  <input
                    value={bookSearch}
                    onChange={(e) => { setBookSearch(e.target.value); setBookId(""); }}
                    placeholder="Search books…"
                    className="w-full bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  />
                  {bookSearch && !bookId && filteredBooks.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden">
                      {filteredBooks.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => { setBookId(b.id); setBookSearch(b.title); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            {b.title}
                            {b.author && <span className="text-neutral-400 ml-2 text-xs">{b.author}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button type="button" onClick={() => setShowNewBook(true)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300">
                  <Plus size={12} /> Add new book
                </button>
              </>
            ) : (
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-2">
                <Input value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="Book title" autoFocus />
                <Input value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="Author (optional)" />
                <LanguageSelect value={newBookLanguage} onValueChange={setNewBookLanguage} placeholder={t("shelf.languageLabel")} />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleCreateBook} className="text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1 rounded">Add book</button>
                  <button type="button" onClick={() => setShowNewBook(false)} className="text-xs text-neutral-400">Cancel</button>
                </div>
              </div>
            )}
            <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page (optional)" type="number" />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-neutral-400">⌘↵ to submit</p>
          <button type="submit" disabled={!text.trim() || submitting} className="px-4 py-2 rounded-lg text-sm bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-40 transition-colors">
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
