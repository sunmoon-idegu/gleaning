"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { apiFetch, waitForToken, type BookWithQuotes, type Quote } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReflectionsSection } from "@/components/reflections-section";

function openAddQuote(bookId: string) {
  window.dispatchEvent(new CustomEvent("open-add-quote", { detail: { bookId } }));
}

export default function BookPage() {
  const { t } = useTranslation();
  const { bookId } = useParams<{ bookId: string }>();
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [book, setBook] = useState<BookWithQuotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<BookWithQuotes>(`/books/${bookId}`, token);
        setBook(data);
        document.title = `${data.title} · Gleaning`;
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, isLoaded, bookId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const quote = (e as CustomEvent).detail as Quote;
      if (quote.book_id === bookId) {
        setBook((b) => b ? { ...b, quotes: [...b.quotes, quote] } : b);
      }
    };
    window.addEventListener("quote-added", handler);
    return () => window.removeEventListener("quote-added", handler);
  }, [bookId]);

  function openEdit() {
    if (!book) return;
    setEditTitle(book.title);
    setEditAuthor(book.author ?? "");
    setEditOpen(true);
  }

  async function handleEditSave() {
    if (!book || !editTitle.trim()) return;
    setSaving(true);
    const token = await waitForToken(getToken);
    const updated = await apiFetch<BookWithQuotes>(`/books/${bookId}`, token, {
      method: "PATCH",
      body: JSON.stringify({ title: editTitle.trim(), author: editAuthor.trim() || null }),
    });
    setBook((b) => b ? { ...b, title: updated.title, author: updated.author } : b);
    document.title = `${updated.title} · Gleaning`;
    setSaving(false);
    setEditOpen(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const token = await waitForToken(getToken);
    await apiFetch(`/books/${bookId}`, token, { method: "DELETE" });
    router.push("/shelf");
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 pt-4">
        <div className="h-5 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4 mt-1" />
        <div className="h-3 bg-muted rounded w-16 mt-2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-32 text-neutral-400">
        <p className="text-sm">{t("bookDetail.error")}</p>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/50 mb-8">{t("bookDetail.pageLabel")}</p>

      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-1.5 group/title">
            <h1 className="text-2xl font-semibold">{book.title}</h1>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/title:opacity-100 transition-opacity">
              <button
                onClick={openEdit}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                title={t("bookDetail.editTitle")}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                title={t("bookDetail.deleteTitle")}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          {book.author && <p className="text-sm text-muted-foreground mt-1">{book.author}</p>}
          <p className="text-xs text-muted-foreground/50 mt-1.5">
            {t(book.quotes.length === 1 ? "bookDetail.quoteSingular" : "bookDetail.quotePlural", { count: book.quotes.length })}
          </p>
        </div>
        <button
          onClick={() => openAddQuote(bookId)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 mt-1"
        >
          <Plus size={14} /> {t("bookDetail.addQuote")}
        </button>
      </div>

      {book.quotes.length === 0 ? (
        <p className="text-sm text-neutral-400 mt-10">{t("bookDetail.empty")}</p>
      ) : (
        <div>
          {book.quotes.map((q) => (
            <div key={q.id} className="relative px-4 py-8">
              <QuoteCard quote={q} hideSource hideDate />
            </div>
          ))}
        </div>
      )}

      <ReflectionsSection targetType="book" targetId={bookId} defaultRows={6} />

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("bookDetail.editHeading")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder={t("shelf.titlePlaceholder")} autoFocus />
            <Input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} placeholder={t("shelf.authorPlaceholder")} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("add.cancel")}</Button>
            <Button onClick={handleEditSave} disabled={!editTitle.trim() || saving}>
              {saving ? t("add.saving") : t("bookDetail.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("bookDetail.deleteHeading")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("bookDetail.deleteBody")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("add.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("bookDetail.deleting") : t("bookDetail.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
