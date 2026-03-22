"use client";

/**
 * PinPad.tsx
 * -----------
 * Shared numeric PIN pad used by both PinLockScreen and PinSetup.
 * Shows 4 dot indicators and a 3×4 keypad (1-9, backspace, 0, submit).
 */

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const DOT_FILLED = "#c0392b";
const DOT_EMPTY  = "#e7e5e4";
const KEY_BG     = "#fff";
const KEY_ACTIVE = "rgba(192,57,43,0.08)";

function PinDots({ length }: { length: number }) {
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", margin: "20px 0 28px" }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: "50%",
          background: i < length ? DOT_FILLED : DOT_EMPTY,
          transition: "background 0.15s",
          border: `2px solid ${i < length ? DOT_FILLED : "#d4d4d0"}`,
        }} />
      ))}
    </div>
  );
}

interface PinPadProps {
  title: string;
  subtitle?: string;
  error?: string;
  onComplete: (pin: string) => void;
  submitLabel?: string;
  topSlot?: React.ReactNode;
}

export default function PinPad({ title, subtitle, error, onComplete, submitLabel, topSlot }: PinPadProps) {
  const { t } = useLanguage();
  const [pin, setPin] = useState("");
  const [pressed, setPressed] = useState<string | null>(null);

  function press(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        onComplete(next);
        setPin("");
      }, 120);
    }
  }

  function backspace() {
    setPin(p => p.slice(0, -1));
  }

  function flash(key: string) {
    setPressed(key);
    setTimeout(() => setPressed(null), 120);
  }

  const keys: (string | null)[] = [
    "1","2","3",
    "4","5","6",
    "7","8","9",
    null,"0","⌫",
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 24px 24px",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Lock icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: "rgba(192,57,43,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem", marginBottom: 16,
      }}>
        🔒
      </div>

      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px", textAlign: "center" }}>
        {title}
      </h2>

      {subtitle && (
        <p style={{ fontSize: "0.82rem", color: "#78716c", margin: "0 0 4px", textAlign: "center", lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}

      {/* Extra slot (e.g. "Forgot PIN?" link) */}
      {topSlot}

      {/* Error message */}
      {error && (
        <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: "8px 0 0", textAlign: "center", fontWeight: 600 }}>
          {error}
        </p>
      )}

      {/* Dot indicators */}
      <PinDots length={pin.length} />

      {/* Keypad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 12 }}>
        {keys.map((key, i) => {
          if (key === null) return <div key={i} />;
          const isBack = key === "⌫";
          const isActive = pressed === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { flash(key); isBack ? backspace() : press(key); }}
              style={{
                width: 72, height: 72, borderRadius: 20,
                border: "1.5px solid #e7e5e4",
                background: isActive ? KEY_ACTIVE : KEY_BG,
                fontFamily: isBack ? "system-ui, sans-serif" : "Georgia, serif",
                fontSize: isBack ? "1.1rem" : "1.5rem",
                fontWeight: isBack ? 400 : 600,
                color: isBack ? "#a8a29e" : "#1c1917",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.1s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              aria-label={isBack ? "Delete" : key}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
