"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { Quote } from "@/lib/api";
import { apiFetch, waitForToken } from "@/lib/api";
import { BookOpen, Video, Mic, Pencil, Trash2, X } from "lucide-react";
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

const sourceIcons = {
  book: BookOpen,
  video: Video,
  spoken: Mic,
  unknown: null,
};

interface QuoteCardProps {
  quote: Quote;
  onDeleted?: (id: string) => void;
  onUpdated?: (quote: Quote) => void;
}

export function QuoteCard({ quote, onDeleted, onUpdated }: QuoteCardProps) {
  const { getToken } = useAuth();

  const s = quote.source;
  const SourceIcon = s ? sourceIcons[s.type] : null;
  const title = s?.title ?? s?.book?.title ?? null;
  const author = s?.author ?? s?.book?.author ?? quote.author ?? null;
  const page = s?.type === "book" && quote.page ? `p. ${quote.page}` : null;

  // ── delete ───────────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const token = await waitForToken(getToken);
    await apiFetch(`/quotes/${quote.id}`, token, { method: "DELETE" });
    setDeleteOpen(false);
    onDeleted?.(quote.id);
  }

  // ── edit ─────────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [text, setText] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editOpen) return;
    setText(quote.text);
    setTags(quote.tags.map((t) => t.name));
    setTagInput("");
  }, [editOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags((t) => [...t, trimmed]);
    setTagInput("");
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput) setTags((t) => t.slice(0, -1));
  }

  async function handleEditSubmit() {
    if (!text.trim()) return;
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
      body: JSON.stringify({
        text: text.trim(),
        source_id: quote.source_id,
        tag_ids: tagIds,
      }),
    });

    setSubmitting(false);
    setEditOpen(false);
    onUpdated?.(updated);
  }

  return (
    <article className="border-b border-border last:border-0 group">
      {/* Icons — absolute relative to outer card wrapper's padding */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditOpen(true)}
          className="cursor-pointer p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="cursor-pointer p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-muted transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Quote text */}
      <blockquote className="text-xl leading-relaxed tracking-[-0.01em] text-foreground font-[350]">
        {quote.text}
      </blockquote>

      {/* Footer: source + tags + date */}
      <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        {(title || author || page) && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {SourceIcon && <SourceIcon size={12} className="shrink-0" />}
            {title && <span>{title}</span>}
            {title && author && <span className="text-muted-foreground/40">·</span>}
            {author && <span>{author}</span>}
            {page && <span className="text-muted-foreground/40">·</span>}
            {page && <span>{page}</span>}
          </span>
        )}
        {quote.tags.map((t) => (
          <span key={t.id} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {t.name}
          </span>
        ))}
        <span className="text-xs text-muted-foreground/50 ml-auto">
          {new Date(quote.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </footer>

      {/* ── Delete confirm dialog ── */}
      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete quote?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit quote</DialogTitle>
          </DialogHeader>

          <div
            className="space-y-4 py-1"
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleEditSubmit(); }}
          >
            <Textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              className="resize-none text-base"
            />

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
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={!text.trim() || submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
