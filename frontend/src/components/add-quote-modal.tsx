"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, LANGUAGES, type Book, type Quote } from "@/lib/api";
import { Plus } from "lucide-react";
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

type SourceType = "book" | "video" | null;

interface AddQuoteModalProps {
  open: boolean;
  prefillBookId?: string;
  onClose: () => void;
  onAdded?: (quote: Quote) => void;
}

export function AddQuoteModal({ open, prefillBookId = "", onClose, onAdded }: AddQuoteModalProps) {
  const { getToken } = useAuth();

  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [page, setPage] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState(prefillBookId);
  const [bookSearch, setBookSearch] = useState("");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookLanguage, setNewBookLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingBook, setCreatingBook] = useState(false);

  // Reset and load books when dialog opens
  useEffect(() => {
    if (!open) return;
    setText(""); setPage("");
    setVideoTitle(""); setVideoUrl("");
    setShowNewBook(false);
    setNewBookTitle(""); setNewBookAuthor(""); setNewBookLanguage("");
    setBookId(prefillBookId);
    setSourceType(prefillBookId ? "book" : null);

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

  async function handleCreateBook() {
    if (!newBookTitle.trim() || creatingBook) return;
    setCreatingBook(true);
    try {
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
    } finally {
      setCreatingBook(false);
    }
  }

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    const token = await waitForToken(getToken);

    let sourceId: string | null = null;
    if (sourceType === "book" && bookId) {
      const src = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "book", book_id: bookId }),
      });
      sourceId = src.id;
    } else if (sourceType === "video" && (videoTitle || videoUrl)) {
      const src = await apiFetch<{ id: string }>("/sources", token, {
        method: "POST",
        body: JSON.stringify({ type: "video", title: videoTitle || null, url: videoUrl || null }),
      });
      sourceId = src.id;
    }

    const quote = await apiFetch<Quote>("/quotes", token, {
      method: "POST",
      body: JSON.stringify({
        text: text.trim(),
        page: page ? parseInt(page) : null,
        source_id: sourceId,
        tag_ids: [],
      }),
    });

    setSubmitting(false);
    onAdded?.(quote);
    window.dispatchEvent(new CustomEvent("quote-added", { detail: quote }));
    onClose();
  }

  const sourceTypes: { value: NonNullable<SourceType>; label: string }[] = [
    { value: "book", label: "Book" },
    { value: "video", label: "Video" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add quote</DialogTitle>
        </DialogHeader>

        <div
          className="space-y-3 py-1"
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(); }}
        >
          {/* Text */}
          <Textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="The quote…"
            rows={5}
            className="resize-none text-base"
          />

          {/* Source type pills */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Source:</span>
            {sourceTypes.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceType(sourceType === value ? null : value)}
                className={`cursor-pointer px-3 py-1.5 rounded-full text-sm transition-colors ${
                  sourceType === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Book */}
          {sourceType === "book" && (
            <div className="space-y-2">
              {!showNewBook && (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
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
                                className="w-full cursor-pointer text-left px-3 py-1.5 text-sm hover:bg-muted"
                              >
                                {b.title}
                                {b.author && <span className="text-muted-foreground ml-2 text-xs">{b.author}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Input
                      value={page}
                      onChange={(e) => setPage(e.target.value.replace(/\D/g, ""))}
                      placeholder="Page"
                      className="w-20 shrink-0"
                      inputMode="numeric"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewBook(true)}
                    className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={12} /> Add new book
                  </button>
                </>
              )}

              {showNewBook && (
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <Input value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="Book title" autoFocus />
                  <div className="flex gap-2">
                    <Input value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="Author (optional)" className="w-3/5" />
                    <div className="w-2/5">
                      <LanguageSelect value={newBookLanguage} onValueChange={setNewBookLanguage} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleCreateBook} disabled={!newBookTitle.trim() || creatingBook}>
                      {creatingBook ? "Adding…" : "Add book"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewBook(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video */}
          {sourceType === "video" && (
            <div className="flex gap-2">
              <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" className="flex-1" />
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="URL (optional)" type="url" className="flex-1" />
            </div>
          )}

        </div>

        <DialogFooter className="items-center">
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
