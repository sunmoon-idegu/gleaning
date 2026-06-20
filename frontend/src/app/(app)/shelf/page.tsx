"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { apiFetch, waitForToken, LANGUAGES, type Book } from "@/lib/api";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LanguageSelect } from "@/components/language-select";

function langLabel(code: string | null, other: string) {
  if (!code) return other;
  return LANGUAGES.find((l) => l.code === code)?.label ?? other;
}

function groupByLanguage(books: Book[]): [string, Book[]][] {
  const map = new Map<string, Book[]>();
  for (const book of books) {
    const key = book.language ?? "other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(book);
  }
  const order = LANGUAGES.map((l) => l.code as string);
  return [...map.entries()].sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

export default function ShelfPage() {
  const { t } = useTranslation();
  const { getToken, isLoaded } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Add book modal
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<Book[]>("/books", token);
        setBooks([...data].sort((a, b) => a.title.localeCompare(b.title)));
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, isLoaded]);

  useEffect(() => { document.title = "Shelf · Gleaning"; }, []);

  useEffect(() => {
    if (showAdd) setTimeout(() => titleRef.current?.focus(), 50);
  }, [showAdd]);

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const token = await waitForToken(getToken);
    const book = await apiFetch<Book>("/books", token, {
      method: "POST",
      body: JSON.stringify({ title: title.trim(), author: author.trim() || null, language: language || null }),
    });
    setBooks((b) => [...b, book].sort((a, z) => a.title.localeCompare(z.title)));
    setTitle(""); setAuthor(""); setLanguage("");
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); setShowAdd(false); }, 1000);
  }

  if (error) {
    return (
      <div className="text-center py-32 text-neutral-400">
        <p className="text-sm">{t("shelf.error")}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const groups = groupByLanguage(books);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">{t("shelf.heading")}</h1>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} /> {t("shelf.addBook")}
        </Button>
      </div>

      {/* Add book modal */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open && !saving) { setShowAdd(false); setTitle(""); setAuthor(""); setLanguage(""); setSaved(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shelf.addBook")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBook}>
            <div className="space-y-3 py-1">
              <Input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("shelf.titlePlaceholder")} />
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t("shelf.authorPlaceholder")} />
              <LanguageSelect value={language} onValueChange={setLanguage} placeholder={t("shelf.languageLabel")} />
            </div>
            <DialogFooter className="items-center mt-4">
              <Button variant="outline" type="button" onClick={() => setShowAdd(false)}>{t("shelf.cancel")}</Button>
              <Button type="submit" disabled={!title.trim() || saving || saved}
                className={saved ? "bg-green-600 hover:bg-green-600 text-white" : ""}>
                {saved ? t("shelf.added") : saving ? t("shelf.saving") : t("shelf.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Book grid grouped by language */}
      {books.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-sm">{t("shelf.empty")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([code, groupBooks]) => (
            <div key={code}>
              <h2 className="text-base font-medium text-muted-foreground mb-3">
                {langLabel(code, t("shelf.langOther"))}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {groupBooks.map((book) => (
                  <div key={book.id} className="group relative">
                    <Link
                      href={`/shelf/${book.id}`}
                      className="flex flex-col justify-between p-4 rounded-lg border border-border hover:border-foreground/30 transition-colors min-h-24"
                    >
                      <div>
                        <p className="text-sm font-medium leading-snug pr-6">{book.title}</p>
                        {book.author && <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>}
                      </div>
                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <BookOpen size={11} />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
