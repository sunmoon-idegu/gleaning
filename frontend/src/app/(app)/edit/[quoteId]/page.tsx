"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, LANGUAGES, type Book, type Quote } from "@/lib/api";
import { Plus, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LanguageSelect } from "@/components/language-select";

type SourceType = "none" | "book" | "video" | "spoken" | "unknown";

export default function EditQuotePage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const { getToken } = useAuth();
  const router = useRouter();
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("none");
  const [author, setAuthor] = useState("");
  const [page, setPage] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [spokenSpeaker, setSpokenSpeaker] = useState("");
  const [spokenContext, setSpokenContext] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookLanguage, setNewBookLanguage] = useState("");
  const [existingSourceId, setExistingSourceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await waitForToken(getToken);
      
      const [quote, booksData] = await Promise.all([
        apiFetch<Quote>(`/quotes/${quoteId}`, token),
        apiFetch<Book[]>("/books", token),
      ]);
      setBooks(booksData);

      // Pre-fill fields
      setText(quote.text);
      setAuthor(quote.author ?? "");
      setPage(quote.page?.toString() ?? "");
      setTags(quote.tags.map((t) => t.name));
      setExistingSourceId(quote.source_id);

      const s = quote.source;
      if (s) {
        setSourceType(s.type as SourceType);
        if (s.type === "book" && s.book_id) {
          setBookId(s.book_id);
          const book = booksData.find((b) => b.id === s.book_id);
          if (book) setBookSearch(book.title);
        } else if (s.type === "video") {
          setVideoTitle(s.title ?? "");
          setVideoUrl(s.url ?? "");
        } else if (s.type === "spoken") {
          setSpokenSpeaker(s.author ?? "");
          setSpokenContext(s.context ?? "");
        }
      }

      setLoading(false);
      setTimeout(() => textRef.current?.focus(), 50);
    })();
  }, [getToken, quoteId]);

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase())
  );

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags((t) => [...t, trimmed]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput) {
      setTags((t) => t.slice(0, -1));
    }
  }

  async function handleSubmit(e?: React.SyntheticEvent) {
    e?.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    const token = await waitForToken(getToken);
    

    let sourceId: string | null = existingSourceId;

    if (sourceType === "book" && bookId) {
      const source = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "book", book_id: bookId }),
      });
      sourceId = source.id;
    } else if (sourceType === "video" && videoTitle) {
      const source = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "video", title: videoTitle, url: videoUrl || null }),
      });
      sourceId = source.id;
    } else if (sourceType === "spoken") {
      const source = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "spoken", author: spokenSpeaker || null, context: spokenContext || null }),
      });
      sourceId = source.id;
    } else if (sourceType === "unknown") {
      const source = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "unknown" }),
      });
      sourceId = source.id;
    } else if (sourceType === "none") {
      sourceId = null;
    }

    const tagIds: string[] = [];
    for (const name of tags) {
      const tag = await apiFetch<{ id: string }>("/tags", token, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      tagIds.push(tag.id);
    }

    await apiFetch(`/quotes/${quoteId}`, token, {
      method: "PATCH",
      body: JSON.stringify({
        text: text.trim(),
        author: author.trim() || null,
        page: page ? parseInt(page) : null,
        source_id: sourceId,
        tag_ids: tagIds,
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

  const sourceTypes: { value: SourceType; label: string }[] = [
    { value: "book", label: "Book" },
    { value: "video", label: "Video" },
    { value: "spoken", label: "Spoken" },
    { value: "unknown", label: "Unknown" },
    { value: "none", label: "None" },
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
                onClick={() => setSourceType(value)}
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
                <LanguageSelect value={newBookLanguage} onValueChange={setNewBookLanguage} />
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleCreateBook} className="text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1 rounded">Add book</button>
                  <button type="button" onClick={() => setShowNewBook(false)} className="text-xs text-neutral-400">Cancel</button>
                </div>
              </div>
            )}
            <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page (optional)" type="number" />
          </div>
        )}

        {sourceType === "video" && (
          <div className="space-y-2">
            <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" />
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="URL (optional)" type="url" />
          </div>
        )}

        {sourceType === "spoken" && (
          <div className="space-y-2">
            <Input value={spokenSpeaker} onChange={(e) => setSpokenSpeaker(e.target.value)} placeholder="Speaker (optional)" />
            <Input value={spokenContext} onChange={(e) => setSpokenContext(e.target.value)} placeholder="Context (optional)" />
          </div>
        )}

        {(sourceType === "none" || sourceType === "unknown") && (
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" />
        )}

        <div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                {t}
                <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X size={10} /></button>
              </span>
            ))}
          </div>
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} onBlur={() => addTag(tagInput)} placeholder="Tags (comma or Enter to add)" />
        </div>

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
