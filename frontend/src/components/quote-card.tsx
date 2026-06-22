"use client";

import type { Quote } from "@/lib/api";
import { BookOpen, Video, Mic } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const sourceIcons = {
  book: BookOpen,
  video: Video,
  live: Mic,
  unknown: null,
};

interface QuoteCardProps {
  quote: Quote;
  hideDate?: boolean;
  hideSource?: boolean;
}

export function QuoteCard({ quote, hideDate, hideSource }: QuoteCardProps) {
  const { i18n } = useTranslation();
  const dateLocale = i18n.language === "zh" ? "zh-TW" : i18n.language === "ja" ? "ja-JP" : "en-US";
  const isChinese = /[一-鿿]/.test(quote.text);
  const len = quote.text.length;
  const sizeClass =
    len < 100 ? "text-xl sm:text-2xl md:text-3xl" :
    len < 250 ? "text-lg sm:text-xl md:text-2xl" :
    len < 500 ? "text-base sm:text-lg md:text-xl" :
                "text-sm sm:text-base md:text-lg";
  const SourceIcon = quote.source_type ? sourceIcons[quote.source_type as keyof typeof sourceIcons] : null;
  const title = quote.book?.title ?? null;
  const author = quote.book?.author ?? null;
  const page = quote.source_type === "book" && quote.page ? `p. ${quote.page}` : null;

  return (
    <article className="border-b border-border last:border-0">
      {/* Quote text — links to the dedicated quote page */}
      <Link href={`/quotes/${quote.id}`} className="block no-underline hover:no-underline group/link">
        <blockquote className={`${sizeClass} leading-relaxed whitespace-pre-wrap text-foreground font-[350] group-hover/link:text-foreground/80 transition-colors ${isChinese ? "font-[family-name:var(--font-noto-serif-sc)]" : "font-[family-name:var(--font-geist-sans)]"}`}>
          {quote.text}
        </blockquote>
      </Link>

      {/* Footer: source + date */}
      <footer className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1">
        {!hideSource && (title || author || page) && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {SourceIcon && <SourceIcon size={12} className="shrink-0" />}
            {title && <span>{title}</span>}
            {page && <span>{page}</span>}
            {title && author && <span className="text-muted-foreground/40">·</span>}
            {author && <span>{author}</span>}
          </span>
        )}
        {hideSource && page && (
          <span className="text-sm text-muted-foreground">{page}</span>
        )}
        {!hideDate && (
          <span className={`text-xs text-muted-foreground/50 ${hideSource ? "" : "ml-auto"}`}>
            {new Date(quote.created_at).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        )}
      </footer>
    </article>
  );
}
