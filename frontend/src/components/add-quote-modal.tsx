"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { apiFetch, waitForToken, type Book, type Quote } from "@/lib/api";
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

function detectLang(text: string): "en" | "zh" | "ja" | null {
  if (/[぀-ゟ゠-ヿ]/.test(text)) return "ja";
  if (/[一-鿿㐀-䶿]/.test(text)) return "zh";
  if (/[a-zA-Z]/.test(text)) return "en";
  return null;
}

type SourceType = "book" | null;

interface AddQuoteModalProps {
  open: boolean;
  prefillBookId?: string;
  onClose: () => void;
  onAdded?: (quote: Quote) => void;
}

export function AddQuoteModal({ open, prefillBookId = "", onClose, onAdded }: AddQuoteModalProps) {
  const { t } = useTranslation();
  const { getToken } = useAuth();

  const [text, setText] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>(null);
  const [page, setPage] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState(prefillBookId);
  const [bookSearch, setBookSearch] = useState("");
  const [showNewBook, setShowNewBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookLanguage, setNewBookLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [creatingBook, setCreatingBook] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText(""); setPage("");
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
        body: JSON.stringify({ title: newBookTitle.trim(), author: newBookAuthor.trim() || null, language: newBookLanguage || detectLang(newBookTitle.trim()) }),
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

    let resolvedBookId = bookId;
    if (sourceType === "book" && !resolvedBookId && bookSearch.trim()) {
      try {
        const newBook = await apiFetch<Book>("/books", token, {
          method: "POST",
          body: JSON.stringify({ title: bookSearch.trim(), language: detectLang(bookSearch.trim()) }),
        });
        setBooks((b) => [...b, newBook]);
        resolvedBookId = newBook.id;
      } catch {
        const existing = books.find((b) => b.title.toLowerCase() === bookSearch.trim().toLowerCase());
        if (existing) resolvedBookId = existing.id;
      }
    }

    const quote = await apiFetch<Quote>("/quotes", token, {
      method: "POST",
      body: JSON.stringify({
        text: text.trim(),
        source_type: sourceType === "book" && resolvedBookId ? "book" : null,
        book_id: sourceType === "book" && resolvedBookId ? resolvedBookId : null,
        page: page ? parseInt(page) : null,
      }),
    });

    setSubmitting(false);
    onAdded?.(quote);
    window.dispatchEvent(new CustomEvent("quote-added", { detail: quote }));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("add.heading")}</DialogTitle>
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
            placeholder={t("add.placeholder")}
            rows={5}
            className="resize-none text-base"
          />

          {/* Source toggle */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">{t("add.source")}:</span>
            <button
              type="button"
              onClick={() => { setSourceType(sourceType === "book" ? null : "book"); setBookId(""); setBookSearch(""); setShowNewBook(false); }}
              className={`cursor-pointer px-3 py-1.5 rounded-full text-sm transition-colors ${
                sourceType === "book"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {t("add.sourceBook")}
            </button>
          </div>

          {/* Book section */}
          {sourceType === "book" && (
            <div className="space-y-2">
              {!showNewBook && (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={bookSearch}
                        onChange={(e) => { setBookSearch(e.target.value); setBookId(""); }}
                        placeholder={t("add.bookPlaceholder")}
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
                      placeholder={t("add.page")}
                      className="w-24 shrink-0"
                      inputMode="numeric"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNewBookTitle(bookSearch); setShowNewBook(true); }}
                    className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={12} /> {t("add.addNewBook")}
                  </button>
                </>
              )}

              {showNewBook && (
                <div className="border border-border rounded-lg p-3 space-y-2">
                  <Input value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder={t("add.bookTitle")} autoFocus />
                  <div className="flex gap-2">
                    <Input value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder={t("shelf.authorPlaceholder")} className="w-3/5" />
                    <div className="w-2/5">
                      <LanguageSelect value={newBookLanguage} onValueChange={setNewBookLanguage} placeholder={t("shelf.languageLabel")} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleCreateBook} disabled={!newBookTitle.trim() || creatingBook}>
                      {creatingBook ? t("add.addingBook") : t("add.addBook")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowNewBook(false)}>{t("add.cancel")}</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="items-center">
          <p className="text-xs text-muted-foreground mr-auto">{t("add.cmdSave")}</p>
          <Button variant="outline" onClick={onClose}>{t("add.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={!text.trim() || submitting}>
            {submitting ? t("add.saving") : t("add.saveQuote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
