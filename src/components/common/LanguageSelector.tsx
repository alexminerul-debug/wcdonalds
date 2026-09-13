import React from "react";
import { useTranslation, Language } from "@/lib/i18n";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { lang, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(lang === "en" ? "ro" : "en");
  };

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded border transition-colors select-none ${
        lang === "ro"
          ? "bg-amber-glow/10 border-amber-glow/60 text-amber-glow hover:bg-amber-glow/20"
          : "bg-void/80 border-smoke/40 text-bone hover:border-amber-glow/60 hover:text-amber-glow"
      } ${className}`}
      title="Switch Language / Schimbă Limba"
      aria-label="Switch Language"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{lang.toUpperCase()}</span>
      <span className="text-[10px] text-smoke opacity-60">|</span>
      <span className="text-[10px] text-fog">{lang === "en" ? "RO" : "EN"}</span>
    </button>
  );
}
