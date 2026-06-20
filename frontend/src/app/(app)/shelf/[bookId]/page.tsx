"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, type BookWithQuotes, type Quote } from "@/lib/api";
import { QuoteCard } from "@/components/quote-card";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function openAddQuote(bookId: string) {
  window.dispatchEvent(new CustomEvent("open-add-quote", { detail: { bookId } }));
}

export default function BookPage() {
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
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openEdit}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit book"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            title="Delete book"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => openAddQuote(bookId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Add quote
          </button>
        </div>
      </div>

      {book.quotes.length === 0 ? (
        <p className="text-sm text-neutral-400">No quotes from this book yet.</p>
      ) : (
        <div>
          {book.quotes.map((q) => (
            <div key={q.id} className="relative px-4 py-8">
              <QuoteCard quote={q} />
            </div>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit book</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" autoFocus />
            <Input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} placeholder="Author (optional)" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editTitle.trim() || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete book?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This will delete the book and all its quotes. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
