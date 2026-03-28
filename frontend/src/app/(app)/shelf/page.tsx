"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, LANGUAGES, type Book } from "@/lib/api";
import Link from "next/link";
import { BookOpen, Plus, X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { LanguageSelect } from "@/components/language-select";

function langLabel(code: string | null) {
  if (!code) return "Other";
  return LANGUAGES.find((l) => l.code === code)?.label ?? "Other";
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
  const { getToken } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Add book form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [language, setLanguage] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Edit book dialog
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await waitForToken(getToken);
      const data = await apiFetch<Book[]>("/books", token);
      setBooks([...data].sort((a, b) => a.title.localeCompare(b.title)));
      setLoading(false);
    })();
  }, [getToken]);

  useEffect(() => {
    if (showForm) setTimeout(() => titleRef.current?.focus(), 50);
  }, [showForm]);

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
    setTimeout(() => { setSaved(false); setShowForm(false); }, 1000);
  }

  function openEdit(book: Book) {
    setEditBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author ?? "");
    setEditLanguage(book.language ?? "");
  }

  async function handleEditSave() {
    if (!editBook || !editTitle.trim()) return;
    setEditSaving(true);
    const token = await waitForToken(getToken);
    const updated = await apiFetch<Book>(`/books/${editBook.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ title: editTitle.trim(), author: editAuthor.trim() || null, language: editLanguage || null }),
    });
    setBooks((bs) => bs.map((b) => b.id === updated.id ? updated : b).sort((a, b) => a.title.localeCompare(b.title)));
    setEditBook(null);
    setEditSaving(false);
  }

  async function handleDelete() {
    if (!deleteBookId) return;
    setDeleting(true);
    const token = await waitForToken(getToken);
    await apiFetch(`/books/${deleteBookId}`, token, { method: "DELETE" });
    setBooks((bs) => bs.filter((b) => b.id !== deleteBookId));
    setDeleteBookId(null);
    setDeleting(false);
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
        <h1 className="text-lg font-semibold">Shelf</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> Add book
        </Button>
      </div>

      {/* Add book form */}
      {showForm && (
        <form onSubmit={handleAddBook} className="mb-8 border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New book</span>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <Input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author (optional)" />
          <LanguageSelect value={language} onValueChange={setLanguage} />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={!title.trim() || saving || saved}
              className={saved ? "bg-green-600 hover:bg-green-600 text-white" : ""}>
              {saved ? "Added!" : saving ? "Saving…" : "Add book"}
            </Button>
          </div>
        </form>
      )}

      {/* Book grid grouped by language */}
      {books.length === 0 && !showForm ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-sm">No books yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([code, groupBooks]) => (
            <div key={code}>
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">
                {langLabel(code)}
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
                    {/* Book actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                          <MoreHorizontal size={13} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(book)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleteBookId(book.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit book dialog */}
      <Dialog open={!!editBook} onOpenChange={(open) => !open && setEditBook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit book</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
            <Input value={editAuthor} onChange={(e) => setEditAuthor(e.target.value)} placeholder="Author (optional)" />
            <LanguageSelect value={editLanguage} onValueChange={setEditLanguage} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBook(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={!editTitle.trim() || editSaving}>
              {editSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete book dialog */}
      <Dialog open={!!deleteBookId} onOpenChange={(open) => !open && setDeleteBookId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete book?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            The book will be removed. Quotes from this book will remain but lose their source.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBookId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
