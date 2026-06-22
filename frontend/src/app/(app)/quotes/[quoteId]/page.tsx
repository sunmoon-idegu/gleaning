"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "react-i18next";
import { apiFetch, waitForToken, type Quote } from "@/lib/api";
import { BookOpen, Copy, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ReflectionsSection } from "@/components/reflections-section";

const sourceIcons = { book: BookOpen };

export default function QuotePage() {
  const { t, i18n } = useTranslation();
  const { quoteId } = useParams<{ quoteId: string }>();
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    setEditOpen(true);
  }

  async function handleEditSubmit() {
    if (!quote || !editText.trim()) return;
    setSubmitting(true);
    const token = await waitForToken(getToken);
    const updated = await apiFetch<Quote>(`/quotes/${quote.id}`, token, {
      method: "PATCH",
      body: JSON.stringify({ text: editText.trim() }),
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
    router.push("/feed");
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
        <p>{t("quoteDetail.notFound")}</p>
      </div>
    );
  }

  const dateLocale = i18n.language === "zh" ? "zh-TW" : i18n.language === "ja" ? "ja-JP" : "en-US";
  const SourceIcon = quote.source_type ? sourceIcons[quote.source_type as keyof typeof sourceIcons] : null;
  const title = quote.book?.title ?? null;
  const author = quote.book?.author ?? null;
  const page = quote.source_type === "book" && quote.page ? `p. ${quote.page}` : null;
  const isChinese = /[一-鿿]/.test(quote.text);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
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

      <p className="text-xs text-muted-foreground/50 mb-10">
        {new Date(quote.created_at).toLocaleDateString(dateLocale, { month: "long", day: "numeric", year: "numeric" })}
      </p>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? t("quoteDetail.copied") : t("quoteDetail.copy")}
        </Button>
        <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5">
          <Pencil size={14} />
          {t("quoteDetail.edit")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="gap-1.5 text-destructive hover:text-destructive">
          <Trash2 size={14} />
          {t("quoteDetail.delete")}
        </Button>
      </div>

      <ReflectionsSection targetType="quote" targetId={quoteId} />

      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("quoteDetail.editHeading")}</DialogTitle></DialogHeader>
          <div
            className="py-1"
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleEditSubmit(); }}
          >
            <Textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={5}
              className="resize-none text-base"
            />
          </div>
          <DialogFooter className="items-center">
            <p className="text-xs text-muted-foreground mr-auto">{t("add.cmdSave")}</p>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("add.cancel")}</Button>
            <Button onClick={handleEditSubmit} disabled={!editText.trim() || submitting}>
              {submitting ? t("add.saving") : t("quoteDetail.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("quoteDetail.deleteHeading")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("quoteDetail.deleteBody")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{t("add.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? t("quoteDetail.deleting") : t("quoteDetail.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
