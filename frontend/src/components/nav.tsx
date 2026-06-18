"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, BookOpen, List, HelpCircle, MessageSquare } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "./theme-toggle";
import { SearchModal } from "./search-modal";
import { Button } from "@/components/ui/button";
import { GleaningIcon } from "@/components/gleaning-icon";

const links = [
  { href: "/feed", label: "Feed", icon: List },
  { href: "/shelf", label: "Shelf", icon: BookOpen },
];

export function Nav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => setHidden((e as CustomEvent<boolean>).detail);
    window.addEventListener("gleaning:display-mode", handler);
    return () => window.removeEventListener("gleaning:display-mode", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-add-quote"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (hidden) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2">
            <GleaningIcon size={24} />
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 tracking-tight">Gleaning</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === href
                    ? "text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (⌘K)"
              title="Search (⌘K)"
            >
              <Search size={16} />
            </Button>
            <ThemeToggle />
            <div className="ml-2 flex items-center">
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Help"
                    href="/help"
                    labelIcon={<HelpCircle size={16} />}
                  />
                  <UserButton.Link
                    label="Send feedback"
                    href="/feedback"
                    labelIcon={<MessageSquare size={16} />}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </div>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
