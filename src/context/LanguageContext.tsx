"use client";

/**
 * LanguageContext.tsx
 * -------------------
 * Provides language selection and the t() translation helper to the whole app.
 * Language preference is persisted in localStorage.
 *
 * Usage:
 *   const { t, language, setLanguage } = useLanguage();
 *   <p>{t("appTitle")}</p>
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import translations, { Language, Translations, LANGUAGE_LABELS } from "@/lib/translations";

const STORAGE_KEY = "acp-language";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <K extends keyof Translations>(key: K) => Translations[K];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Load persisted language on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && saved in LANGUAGE_LABELS) {
        setLanguageState(saved);
      }
    } catch {
      // localStorage unavailable — use default
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    <K extends keyof Translations>(key: K): Translations[K] => {
      return (translations[language] as Translations)[key] ?? (translations.en as Translations)[key];
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Language Switcher component — can be dropped into any nav bar
// ---------------------------------------------------------------------------

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {(Object.entries(LANGUAGE_LABELS) as [Language, string][]).map(([lang, label]) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          style={{
            padding: compact ? "3px 8px" : "5px 12px",
            borderRadius: 8,
            border: `1.5px solid ${language === lang ? "#c0392b" : "#e7e5e4"}`,
            background: language === lang ? "rgba(192,57,43,0.07)" : "#fff",
            fontFamily: "system-ui, sans-serif",
            fontSize: compact ? "0.72rem" : "0.8rem",
            fontWeight: language === lang ? 700 : 400,
            color: language === lang ? "#c0392b" : "#78716c",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
