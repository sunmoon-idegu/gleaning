"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken, type Quote } from "@/lib/api";
import { ArrowLeft, BookOpen, Video, Mic, Copy, Check, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const sourceIcons = { book: BookOpen, video: Video, live: Mic, unknown: null };

export default function QuotePage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const { getToken, isLoaded } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  // edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiFetch<Quote>(`/quotes/${quoteId}`, token);
        setQuote(data);
        document.title = `Quote · Gleaning`;
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, isLoaded, quoteId]);

  async function handleCopy() {
    if (!quote) return;
    await navigator.clipboard.writeText(quote.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function openEdit() {
    if (!quote) return;
    setEditText(quote.text);
    setTags(quote.tags.map((t) => t.name));
    setTagInput("");
    setEditOpen(true);
  }

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags((t) => [...t, trimmed]);
    setTagInput("");
  }

  async function handleEditSubmit() {
    if (!quote || !editText.trim()) return;
    setSubmitting(true);
    const token = await waitForToken(getToken);
    const tagIds: string[] = [];
    for (const name of tags) {
      const tag = await apiFetch<{ id: string }>("/tags", token, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      tagIds.push(tag.id);
    }
    const updated = await apiFetch<Quote>(`/quotes/${quote.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ text: editText.trim(), source_id: quote.source_id, tag_ids: tagIds }),
    });
    setQuote(updated);
    setSubmitting(false);
    setEditOpen(false);
  }

  async function handleDelete() {
    if (!quote) return;
    setDeleting(true);
    const token = await waitForToken(getToken);
    await apiFetch(`/quotes/${quote.id}`, token, { method: "DELETE" });
    setDeleteOpen(false);
    setDeleted(true);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-1/3 mt-8" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p className="mb-4">Quote not found.</p>
        <Link href="/feed" className="text-sm underline underline-offset-4">Back to feed</Link>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        <p className="mb-4">Quote deleted.</p>
        <Link href="/feed" className="text-sm underline underline-offset-4">Back to feed</Link>
      </div>
    );
  }

  const s = quote.source;
  const SourceIcon = s ? sourceIcons[s.type] : null;
  const title = s?.title ?? s?.book?.title ?? null;
  const author = s?.author ?? s?.book?.author ?? quote.author ?? null;
  const page = s?.type === "book" && quote.page ? `p. ${quote.page}` : null;
  const isChinese = /[一-鿿]/.test(quote.text);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
      >
        <ArrowLeft size={15} />
        Feed
      </Link>

      <blockquote
        className={`text-2xl sm:text-3xl leading-relaxed font-[350] whitespace-pre-wrap mb-10
          ${isChinese ? "font-[family-name:var(--font-noto-serif-sc)]" : "font-[family-name:var(--font-geist-sans)]"}`}
      >
        {quote.text}
      </blockquote>

      {(title || author || page) && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          {SourceIcon && <SourceIcon size={13} className="shrink-0" />}
          {title && <span>{title}</span>}
          {page && <span>{page}</span>}
          {title && author && <span className="text-muted-foreground/40">·</span>}
          {author && <span>{author}</span>}
        </div>
      )}

      {quote.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {quote.tags.map((t) => (
            <span key={t.id} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {t.name}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground/50 mb-10">
        {new Date(quote.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
          <Pencil size={14} />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 size={14} />
          Delete
        </Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit quote</DialogTitle></DialogHeader>
          <div
            className="space-y-4 py-1"
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleEditSubmit(); }}
          >
            <Textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="resize-none text-base"
            />
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}><X size={10} /></button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                  else if (e.key === "Backspace" && !tagInput) setTags((t) => t.slice(0, -1));
                }}
                onBlur={() => addTag(tagInput)}
                placeholder="Tags (comma or Enter to add)"
              />
            </div>
          </div>
          <DialogFooter className="items-center">
            <p className="text-xs text-muted-foreground mr-auto">⌘↵ to save</p>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={!editText.trim() || submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete quote?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
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
