"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AddQuoteModal } from "./add-quote-modal";

export function FloatingAddButton() {
  const [open, setOpen] = useState(false);
  const [prefillBookId, setPrefillBookId] = useState("");

  useEffect(() => {
    const handler = (e: Event) => {
      const bookId = (e as CustomEvent<{ bookId?: string }>).detail?.bookId ?? "";
      setPrefillBookId(bookId);
      setOpen(true);
    };
    window.addEventListener("open-add-quote", handler);
    return () => window.removeEventListener("open-add-quote", handler);
  }, []);

  return (
    <>
      <button
        onClick={() => { setPrefillBookId(""); setOpen(true); }}
        aria-label="Add quote (⌘N)"
        title="Add quote (⌘N)"
        className="fixed bottom-6 right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus size={22} />
      </button>

      <AddQuoteModal
        open={open}
        prefillBookId={prefillBookId}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
