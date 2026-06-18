"use client";

import { useTranslation } from "react-i18next";
import { setWebLanguage, type WebLanguage } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGS: { value: WebLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
];

export function LangToggle() {
  const { i18n } = useTranslation();
  const current = i18n.language as WebLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label="Switch language">
        <span className="text-xs font-medium leading-none">
          {current === "zh" ? "中" : current === "ja" ? "日" : "EN"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.value}
            onClick={() => setWebLanguage(l.value)}
            className={current === l.value ? "font-semibold" : ""}
          >
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
