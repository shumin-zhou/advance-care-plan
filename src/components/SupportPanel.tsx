"use client";

/**
 * SupportPanel.tsx
 * -----------------
 * Persistent "Need support?" link shown in the top nav of every section page.
 * Clicking it opens an in-app slide-up panel with NZ crisis helpline numbers.
 *
 * Usage:
 *   import { SupportTrigger, SupportPanel } from "@/components/SupportPanel";
 *
 *   // In the top nav:
 *   <SupportTrigger open={supportOpen} onToggle={() => setSupportOpen(o => !o)} />
 *
 *   // Just before </div> of the page wrapper:
 *   <SupportPanel open={supportOpen} onClose={() => setSupportOpen(false)} />
 */

import { useLanguage } from "@/context/LanguageContext";

interface SupportLine {
  name: string;
  number: string;
  detail: string;
}

// ---------------------------------------------------------------------------
// Trigger button — sits in the top nav bar
// ---------------------------------------------------------------------------

export function SupportTrigger({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="support-panel"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        padding: "10px 16px",
        borderRadius: 12,
        border: `1.5px solid ${open ? "#c0392b" : "#fde68a"}`,
        background: open ? "rgba(192,57,43,0.06)" : "#fffbeb",
        cursor: "pointer",
        fontFamily: "system-ui, sans-serif",
        fontSize: "0.82rem",
        fontWeight: 600,
        color: open ? "#c0392b" : "#92400e",
      }}
    >
      {/* Pulse dot */}
      <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{
          display: "block", width: 8, height: 8, borderRadius: "50%",
          background: open ? "#c0392b" : "#d97706",
          boxShadow: open ? "0 0 0 3px rgba(192,57,43,0.2)" : "0 0 0 3px rgba(217,119,6,0.2)",
        }} />
      </span>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
        style={{ display: "block", flexShrink: 0 }}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {t("needSupport")}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Panel — slide-up overlay with helpline numbers
// ---------------------------------------------------------------------------

export function SupportPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();

  if (!open) return null;

  const supportLines = t("supportLines") as unknown as SupportLine[];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 40,
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div
        id="support-panel"
        role="dialog"
        aria-label={t("supportPanelTitle") as string}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          padding: "0 0 env(safe-area-inset-bottom, 0)",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e7e5e4" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 20px 16px",
          borderBottom: "1px solid #f5f5f4",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(192,57,43,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.1rem", flexShrink: 0,
            }}>
              🤍
            </div>
            <div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>
                {t("supportPanelTitle")}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#a8a29e", padding: 4, borderRadius: 8,
              fontFamily: "system-ui, sans-serif", fontSize: "0.8rem",
            }}
          >
            {t("supportPanelClose")}
          </button>
        </div>

        {/* Intro */}
        <div style={{ padding: "16px 20px 12px" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#57534e", margin: "0 0 8px", lineHeight: 1.6 }}>
            {t("supportPanelIntro")}
          </p>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#a8a29e", margin: 0, lineHeight: 1.5 }}>
            {t("supportPanelSaved")}
          </p>
        </div>

        {/* Helplines */}
        <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          {supportLines.map((line, i) => (
            <a
              key={i}
              href={`tel:${line.number.replace(/\s/g, "")}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 14,
                background: "#fdf8f3",
                border: "1px solid #e7e5e4",
                textDecoration: "none",
              }}
            >
              {/* Phone icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(192,57,43,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" style={{ display: "block" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontFamily: "Georgia, serif", fontSize: "0.9rem", fontWeight: 700, color: "#1c1917" }}>
                    {line.name}
                  </span>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#c0392b" }}>
                    {line.number}
                  </span>
                </div>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#78716c", margin: "2px 0 0", lineHeight: 1.4 }}>
                  {line.detail}
                </p>
              </div>

              {/* Tap to call indicator */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4d4d0" strokeWidth="2" style={{ display: "block", flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
