"use client";

import { LANGUAGES } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface LanguageSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LanguageSelect({
  value,
  onValueChange,
  placeholder = "Language (optional)",
  className,
}: LanguageSelectProps) {
  const label = LANGUAGES.find((l) => l.code === value)?.label;

  return (
    <Select value={value} onValueChange={(v) => onValueChange(v ?? "")}>
      <SelectTrigger className={className ?? "w-full"}>
        <span className={`flex flex-1 text-left text-sm ${!label ? "text-muted-foreground" : ""}`}>
          {label ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
