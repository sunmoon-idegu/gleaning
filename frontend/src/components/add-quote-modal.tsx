"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, LANGUAGES, type Book, type Quote } from "@/lib/api";
import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSelect } from "@/components/language-select";

type SourceType = "none" | "book" | "video" | "spoken" | "unknown";

interface AddQuoteModalProps {
  open: boolean;
  prefillBookId?: string;
  onClose: () => void;
  onAdded?: (quote: Quote) => void;
}

export function AddQuoteModal({ open, prefillBookId = "", onClose, onAdded }: AddQuoteModalProps) {
  const { getToken } = useAuth();

  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("book");
  const [author, setAuthor] = useState("");
  const [page, setPage] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [spokenSpeaker, setSpokenSpeaker] = useState("");
  const [spokenContext, setSpokenContext] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState(prefillBookId);
  const [bookSearch, setBookSearch] = useState("");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookLanguage, setNewBookLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset and load books when dialog opens
  useEffect(() => {
    if (!open) return;
    setText(""); setAuthor(""); setPage("");
    setVideoTitle(""); setVideoUrl("");
    setSpokenSpeaker(""); setSpokenContext("");
    setTagInput(""); setTags([]);
    setShowNewBook(false);
    setNewBookTitle(""); setNewBookAuthor(""); setNewBookLanguage("");
    setBookId(prefillBookId);
    setSourceType("book");

    (async () => {
      const token = await waitForToken(getToken);
      const data = await apiFetch<Book[]>("/books", token);
      setBooks(data);
      if (prefillBookId) {
        const b = data.find((x) => x.id === prefillBookId);
        setBookSearch(b?.title ?? "");
      } else {
        setBookSearch("");
      }
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase())
  );

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags((t) => [...t, trimmed]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput) setTags((t) => t.slice(0, -1));
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
    setNewBookTitle(""); setNewBookAuthor(""); setNewBookLanguage("");
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setSubmitting(true);
    const token = await waitForToken(getToken);

    let sourceId: string | null = null;
    if (sourceType === "book" && bookId) {
      const src = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "book", book_id: bookId }),
      });
      sourceId = src.id;
    } else if (sourceType === "video" && videoTitle) {
      const src = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "video", title: videoTitle, url: videoUrl || null }),
      });
      sourceId = src.id;
    } else if (sourceType === "spoken") {
      const src = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "spoken", author: spokenSpeaker || null, context: spokenContext || null }),
      });
      sourceId = src.id;
    } else if (sourceType === "unknown") {
      const src = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "unknown" }),
      });
      sourceId = src.id;
    }

    const tagIds: string[] = [];
    for (const name of tags) {
      const tag = await apiFetch<{ id: string }>("/tags", token, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      tagIds.push(tag.id);
    }

    const quote = await apiFetch<Quote>("/quotes", token, {
      method: "POST",
      body: JSON.stringify({
        text: text.trim(),
        author: author.trim() || null,
        page: page ? parseInt(page) : null,
        source_id: sourceId,
        tag_ids: tagIds,
      }),
    });

    setSubmitting(false);
    onAdded?.(quote);
    onClose();
  }

  const fromBook = !!prefillBookId;

  const sourceTypes: { value: SourceType; label: string }[] = [
    { value: "book", label: "Book" },
    { value: "video", label: "Video" },
    { value: "spoken", label: "Spoken" },
    { value: "unknown", label: "Unknown" },
    { value: "none", label: "None" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add quote</DialogTitle>
        </DialogHeader>

        <div
          className="space-y-4 py-1"
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(); }}
        >
          {/* Text */}
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="The quote…"
            rows={4}
            className="resize-none text-base"
          />

          {/* Source tabs — hidden when pre-filled from book */}
          {!fromBook && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">Source</label>
              <div className="flex gap-1 flex-wrap">
                {sourceTypes.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSourceType(value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      sourceType === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Book */}
          {sourceType === "book" && (
            <div className="space-y-2">
              {!fromBook && !showNewBook && (
                <>
                  <div className="relative">
                    <Input
                      value={bookSearch}
                      onChange={(e) => { setBookSearch(e.target.value); setBookId(""); }}
                      placeholder="Search books…"
                    />
                    {bookSearch && !bookId && filteredBooks.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                        {filteredBooks.map((b) => (
                          <li key={b.id}>
                            <button
                              type="button"
                              onClick={() => { setBookId(b.id); setBookSearch(b.title); }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            >
                              {b.title}
                              {b.author && <span className="text-muted-foreground ml-2 text-xs">{b.author}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewBook(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={12} /> Add new book
                  </button>
                </>
              )}

              {!fromBook && showNewBook && (
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <Input value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="Book title" autoFocus />
                  <Input value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="Author (optional)" />
                  <LanguageSelect value={newBookLanguage} onValueChange={setNewBookLanguage} />
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleCreateBook}>Add book</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewBook(false)}>Cancel</Button>
                  </div>
                </div>
              )}

              <Input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Page (optional)" type="number" />
            </div>
          )}

          {/* Video */}
          {sourceType === "video" && (
            <div className="space-y-2">
              <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" />
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="URL (optional)" type="url" />
            </div>
          )}

          {/* Spoken */}
          {sourceType === "spoken" && (
            <div className="space-y-2">
              <Input value={spokenSpeaker} onChange={(e) => setSpokenSpeaker(e.target.value)} placeholder="Speaker (optional)" />
              <Input value={spokenContext} onChange={(e) => setSpokenContext(e.target.value)} placeholder="Context (optional)" />
            </div>
          )}

          {/* Author */}
          {(sourceType === "none" || sourceType === "unknown") && (
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" />
          )}

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => addTag(tagInput)}
              placeholder="Tags (comma or Enter to add)"
            />
          </div>
        </div>

        <DialogFooter>
          <p className="text-xs text-muted-foreground mr-auto">⌘↵ to save</p>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!text.trim() || submitting}>
            {submitting ? "Saving…" : "Save quote"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
