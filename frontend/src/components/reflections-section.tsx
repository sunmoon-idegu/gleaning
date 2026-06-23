"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/nextjs";
import { apiFetch, waitForToken } from "@/lib/api";

interface Reflection {
  id: string;
  target_type: string;
  target_id: string;
  content: string;
  created_at: string;
}

interface Props {
  targetType: "quote" | "book";
  targetId: string;
  defaultRows?: number;
}

export function ReflectionsSection({ targetType, targetId, defaultRows = 6 }: Props) {
  const { t, i18n } = useTranslation();
  const { getToken } = useAuth();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const addRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const dateLocale = i18n.language === "zh" ? "zh-TW" : i18n.language === "ja" ? "ja-JP" : "en-US";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const token = await waitForToken(getToken);
        const data = await apiFetch<Reflection[]>(
          `/reflections?target_type=${targetType}&target_id=${targetId}`,
          token,
        );
        if (!cancelled) setReflections(data);
      } catch {
        // show empty on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [targetType, targetId]);

  useEffect(() => { if (adding) addRef.current?.focus(); }, [adding]);
  useEffect(() => { if (editingId) editRef.current?.focus(); }, [editingId]);

  async function handleAdd() {
    if (!newText.trim()) { setAdding(false); return; }
    const content = newText.trim();
    // Optimistic: show immediately with temp id
    const tempId = `temp-${Date.now()}`;
    const tempEntry: Reflection = {
      id: tempId,
      target_type: targetType,
      target_id: targetId,
      content,
      created_at: new Date().toISOString(),
    };
    setAdding(false);
    setNewText("");
    setReflections((prev) => [tempEntry, ...prev]);
    try {
      const token = await waitForToken(getToken);
      const created = await apiFetch<Reflection>("/reflections", token, {
        method: "POST",
        body: JSON.stringify({ target_type: targetType, target_id: targetId, content }),
      });
      setReflections((prev) => prev.map((r) => r.id === tempId ? created : r));
    } catch {
      setReflections((prev) => prev.filter((r) => r.id !== tempId));
    }
  }

  async function handleEditSave() {
    if (!editingId) return;
    const content = editText.trim();
    if (!content) return;
    const id = editingId;
    setEditingId(null);
    setReflections((prev) => prev.map((r) => r.id === id ? { ...r, content } : r));
    try {
      const token = await waitForToken(getToken);
      const updated = await apiFetch<Reflection>(`/reflections/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });
      setReflections((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch {
      // optimistic stays
    }
  }

  function startEdit(r: Reflection) {
    setAdding(false);
    setEditingId(r.id);
    setEditText(r.content);
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(null);
    if (editingId === id) setEditingId(null);
    setReflections((prev) => prev.filter((r) => r.id !== id));
    try {
      const token = await waitForToken(getToken);
      await apiFetch(`/reflections/${id}`, token, { method: "DELETE" });
    } catch {
      // optimistic stays
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(dateLocale, {
      month: "long", day: "numeric", year: "numeric",
    });
  }

  const isPending = (id: string) => id.startsWith("temp-");

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("reflections.heading")}
        </h2>
        <button
          onClick={() => { setAdding(true); setEditingId(null); }}
          className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          title={t("reflections.addTitle")}
        >
          <Plus size={15} />
        </button>
      </div>

      {adding && (
        <div className="mb-6">
          <textarea
            ref={addRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleAdd(); }}
            placeholder={t("reflections.placeholder")}
            rows={defaultRows}
            className="w-full text-base bg-muted/50 rounded-md px-3 py-2.5 resize-none outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleAdd}
              disabled={!newText.trim()}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-foreground/20 bg-foreground text-background hover:opacity-80 disabled:opacity-30 disabled:cursor-default transition-opacity"
            >
              {t("reflections.save")}
            </button>
            <button
              onClick={() => { setAdding(false); setNewText(""); }}
              className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("reflections.cancel")}
            </button>
            <span className="text-xs text-muted-foreground/40 ml-auto">{t("reflections.cmdSave")}</span>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      )}

      {!loading && reflections.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground/40">{t("reflections.empty")}</p>
      )}

      <div className="space-y-6">
        {reflections.map((r) => isPending(r.id) ? (
          <div key={r.id} className="py-3">
            <Loader2 size={14} className="animate-spin text-muted-foreground/50" />
          </div>
        ) : (
          <div key={r.id} className="group">
            {editingId === r.id ? (
              <div>
                <textarea
                  ref={editRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleEditSave(); }}
                  rows={defaultRows}
                  className="w-full text-base bg-muted/50 rounded-md px-3 py-2.5 resize-none outline-none focus:ring-1 focus:ring-ring"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleEditSave}
                    disabled={!editText.trim()}
                    className="text-xs font-medium px-3 py-1.5 rounded-md border border-foreground/20 bg-foreground text-background hover:opacity-80 disabled:opacity-30 disabled:cursor-default transition-opacity"
                  >
                    {t("reflections.save")}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("reflections.cancel")}
                  </button>
                  <span className="text-xs text-muted-foreground/40 ml-auto">{t("reflections.cmdSave")}</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {r.content}
                </p>
                <div className="flex items-center mt-3">
                  <span className="text-xs text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">{formatDate(r.created_at)}</span>
                  {confirmDeleteId === r.id ? (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-muted-foreground">{t("reflections.deleteConfirm")}</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs font-medium px-2 py-0.5 rounded border border-foreground/30 text-foreground hover:opacity-60 transition-opacity"
                      >
                        {t("reflections.deleteConfirmYes")}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t("reflections.cancel")}
                      </button>
                    </div>
                  ) : (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all ml-auto">
                      <button
                        onClick={() => startEdit(r)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title={t("reflections.editTitle")}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(r.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title={t("reflections.deleteTitle")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
