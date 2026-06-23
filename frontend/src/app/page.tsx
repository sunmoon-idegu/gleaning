import type { Metadata } from "next";
import Link from "next/link";
import { GleaningIcon } from "@/components/gleaning-icon";
import { Camera, BookOpen, PenLine } from "lucide-react";
import { AuthRedirect } from "@/components/auth-redirect";

export const metadata: Metadata = {
  title: "Gleaning — Keep the sentences that stop you",
  description: "Gleaning is a quote-saving app. Take a photo, draw a box around the text, and it's saved in seconds. No typing. Available on iPhone and the web.",
  openGraph: {
    title: "Gleaning — Quotes. Keep the best. Nothing else.",
    description: "Save quotes from books in seconds. Take a photo, draw a box, done. No tags, no system, no streaks.",
    url: "https://gleaning.io",
    siteName: "Gleaning",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gleaning — Quotes. Keep the best. Nothing else.",
    description: "Save quotes from books in seconds. Take a photo, draw a box, done.",
  },
  alternates: {
    canonical: "https://gleaning.io",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Gleaning",
  operatingSystem: "iOS, Web",
  applicationCategory: "LifestyleApplication",
  description: "A quote-saving app. Take a photo, draw a box around the text, and it's saved in seconds.",
  url: "https://gleaning.io",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-[#111] text-[#1a1a1a] dark:text-[#f0ebe3]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AuthRedirect />

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <GleaningIcon size={26} />
          <span className="font-semibold text-base tracking-tight">Gleaning</span>
        </Link>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-[#1a1a1a]/60 dark:text-[#f0ebe3]/60 hover:text-[#1a1a1a] dark:hover:text-[#f0ebe3] transition-colors"
        >
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-28">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05] max-w-2xl">
          Keep the sentences that stop you.
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-[#1a1a1a]/60 dark:text-[#f0ebe3]/55 max-w-lg leading-relaxed">
          Gleaning saves quotes from books, articles, anywhere. Take a photo,
          draw a box around the text, and it&apos;s saved in seconds. No typing.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex items-center px-5 py-2.5 rounded-md bg-[#1a1a1a] dark:bg-[#f0ebe3] text-[#f5f0e8] dark:text-[#1a1a1a] text-sm font-medium hover:opacity-85 transition-opacity"
          >
            Open the web app
          </Link>
          <span className="text-sm text-[#1a1a1a]/40 dark:text-[#f0ebe3]/40">
            Also on the App Store for iPhone
          </span>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-[#1a1a1a]/10 dark:border-[#f0ebe3]/10" />
      </div>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid sm:grid-cols-3 gap-12 sm:gap-8">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#c9a96e]/15 flex items-center justify-center mb-5">
              <Camera size={17} className="text-[#c9a96e]" />
            </div>
            <h3 className="font-semibold text-base mb-2">Save in seconds</h3>
            <p className="text-[#1a1a1a]/55 dark:text-[#f0ebe3]/50 text-sm leading-relaxed">
              Take a photo of the page. Draw a box around the text you want.
              Gleaning reads it automatically — no typing, no copy-pasting.
            </p>
          </div>
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#c9a96e]/15 flex items-center justify-center mb-5">
              <BookOpen size={17} className="text-[#c9a96e]" />
            </div>
            <h3 className="font-semibold text-base mb-2">Browse by book</h3>
            <p className="text-[#1a1a1a]/55 dark:text-[#f0ebe3]/50 text-sm leading-relaxed">
              Every quote you save is filed under its book. See everything you
              kept from each one, all together.
            </p>
          </div>
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#c9a96e]/15 flex items-center justify-center mb-5">
              <PenLine size={17} className="text-[#c9a96e]" />
            </div>
            <h3 className="font-semibold text-base mb-2">Write a reflection</h3>
            <p className="text-[#1a1a1a]/55 dark:text-[#f0ebe3]/50 text-sm leading-relaxed">
              Add a note to any quote to capture what you were thinking in that
              moment. Come back to it later.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-[#1a1a1a]/10 dark:border-[#f0ebe3]/10" />
      </div>

      {/* Philosophy */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-xl">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug text-[#1a1a1a] dark:text-[#f0ebe3]">
            No tags. No organisation system. No streaks.
          </p>
          <p className="mt-5 text-[#1a1a1a]/55 dark:text-[#f0ebe3]/50 leading-relaxed">
            Just your quotes, always with you. Search when you need something.
            Let the rest surface when you least expect it.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="border-t border-[#1a1a1a]/10 dark:border-[#f0ebe3]/10" />
      </div>

      {/* Footer */}
      <section className="max-w-5xl mx-auto px-6 py-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <GleaningIcon size={22} />
          <span className="font-semibold text-sm">Gleaning</span>
          <span className="text-sm text-[#1a1a1a]/40 dark:text-[#f0ebe3]/35">· Quotes. Keep the best. Nothing else.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-[#1a1a1a]/45 dark:text-[#f0ebe3]/40">
          <Link
            href="/privacy"
            className="hover:text-[#1a1a1a] dark:hover:text-[#f0ebe3] transition-colors"
          >
            Privacy Policy
          </Link>
          <span>© 2026 Gleaning</span>
        </div>
      </section>

    </div>
  );
}
