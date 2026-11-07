"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const LANGUAGES = [
  "English",
  "Spanish",
  "Vietnamese",
  "Tagalog",
  "Chinese (Simplified)",
  "Arabic",
] as const;

export type Language = (typeof LANGUAGES)[number];

type LanguageSelectProps = {
  value: Language;
  disabled?: boolean;
  onChange: (language: Language) => void;
};

export function LanguageSelect({ value, disabled, onChange }: LanguageSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      items={LANGUAGES.map((language) => ({ label: language, value: language }))}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger className="w-full sm:w-56" aria-label="Translate explanations">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((language) => (
          <SelectItem key={language} value={language}>
            {language}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
