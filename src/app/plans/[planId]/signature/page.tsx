"use client";

export const dynamic = "force-dynamic";
import React from "react";

/**
 * Signature & Acknowledgement — /plan/signature
 *
 * - 4 acknowledgement checkboxes (all must be ticked before signing)
 * - User signature via HTML Canvas (mouse + touch)
 * - Auto-populated signature date
 * - Witness fields (name, designation, date)
 * - Legal status banner per PRD v1.2
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { useLanguage, LanguageSwitcher } from "@/context/LanguageContext";
import { SupportTrigger, SupportPanel } from "@/components/SupportPanel";
import { signatureSubmitSchema, Signature } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Acknowledgement statements (from the original form)
// ---------------------------------------------------------------------------



// ---------------------------------------------------------------------------
// Reusable field components
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#57534e", marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>
      {children}
    </label>
  );
}

function TextInput({ id, placeholder, error, type = "text", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input id={id} type={type} placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${error ? "#c0392b" : "#e7e5e4"}`, background: error ? "#fff8f7" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none" }}
        onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
        onBlur={e => e.currentTarget.style.borderColor = error ? "#c0392b" : "#e7e5e4"}
        {...rest}
      />
      {error && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#c0392b", margin: "4px 0 0 2px" }}>{error}</p>}
    </div>
  );
}


// ---------------------------------------------------------------------------
// DatePicker — calendar popover, NZ format (DD/MM/YYYY), stores as ISO
// ---------------------------------------------------------------------------

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function DatePicker({ id, value, onChange, error }: {
  id: string;
  value?: string;   // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  error?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.slice(0,4)) : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.slice(5,7)) - 1 : new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toDisplay(iso?: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function selectDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(iso);
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const selectedDay = value && value.slice(0,7) === `${viewYear}-${String(viewMonth+1).padStart(2,"0")}`
    ? parseInt(value.slice(8,10)) : null;
  const todayStr = new Date().toISOString().slice(0,10);

  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div ref={ref} style={{ position: "relative" as const }}>
      {/* Trigger button */}
      <button
        id={id}
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", boxSizing: "border-box" as const,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 13px", borderRadius: 10,
          border: `1.5px solid ${open ? "#c0392b" : error ? "#c0392b" : "#e7e5e4"}`,
          background: error ? "#fff8f7" : "#fff",
          fontFamily: "system-ui, sans-serif", fontSize: "0.9rem",
          color: value ? "#1c1917" : "#a8a29e", cursor: "pointer", outline: "none",
        }}
      >
        <span>{value ? toDisplay(value) : t("ddmmyyyy")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block", flexShrink: 0, color: "#a8a29e" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </button>

      {error && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#c0392b", margin: "4px 0 0 2px" }}>{error}</p>}

      {/* Calendar popover */}
      {open && (
        <div style={{
          position: "absolute" as const, top: "calc(100% + 6px)", left: 0, zIndex: 100,
          background: "#fff", borderRadius: 14, border: "1.5px solid #e7e5e4",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 14, width: 260,
        }}>
          {/* Month / year navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, color: "#78716c", fontSize: "1rem" }}>‹</button>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#1c1917" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, color: "#78716c", fontSize: "1rem" }}>›</button>
          </div>

          {/* Day-of-week headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center" as const, fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 700, color: "#a8a29e", padding: "2px 0" }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isSelected = day === selectedDay;
              const isoDay = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const isToday = isoDay === todayStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  style={{
                    padding: "5px 0", borderRadius: 8, border: isToday && !isSelected ? "1.5px solid #c0392b" : "1.5px solid transparent",
                    background: isSelected ? "#c0392b" : "transparent",
                    fontFamily: "system-ui, sans-serif", fontSize: "0.8rem",
                    color: isSelected ? "#fff" : isToday ? "#c0392b" : "#1c1917",
                    fontWeight: isSelected || isToday ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f5f5f4", textAlign: "center" as const }}>
            <button
              type="button"
              onClick={() => { const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth()); selectDay(t.getDate()); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#c0392b", fontWeight: 600 }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signature component — Draw mode or Type mode
// ---------------------------------------------------------------------------

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  existingDataUrl?: string;
  label: string;
}

function SignatureCanvas({ onSave, onClear, existingDataUrl, label }: SignatureCanvasProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [hasSignature, setHasSignature] = useState(!!existingDataUrl);
  const [isEmpty, setIsEmpty] = useState(!existingDataUrl);

  // Draw existing signature image on mount (draw mode)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !existingDataUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = existingDataUrl;
    setHasSignature(true);
    setIsEmpty(false);
  }, [existingDataUrl]);

  // Resize canvas (retina-safe)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [mode]);

  // ── Draw mode handlers ──────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    isDrawing.current = true;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    setHasSignature(true);
    onSave(canvas.toDataURL("image/png"));
  };

  // ── Type mode handler ───────────────────────────────────────────────────

  function renderTypedSignature(name: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!name.trim()) {
      setHasSignature(false);
      setIsEmpty(true);
      onClear();
      return;
    }
    // Render name in a cursive-style font
    const fontSize = Math.min(38, Math.floor(w / (name.length * 0.6 + 2)));
    ctx.font = `italic ${fontSize}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = "#1c1917";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, w / 2, h / 2);
    setHasSignature(true);
    setIsEmpty(false);
    onSave(canvas.toDataURL("image/png"));
  }

  // ── Clear ───────────────────────────────────────────────────────────────

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setIsEmpty(true);
    setTypedName("");
    onClear();
  };

  // ── Switch mode ─────────────────────────────────────────────────────────

  function switchMode(next: "draw" | "type") {
    handleClear();
    setMode(next);
  }

  return (
    <div>
      {/* Header row: label | mode toggle | clear */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#57534e", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Draw / Type toggle */}
          <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1.5px solid #e7e5e4" }}>
            {(["draw", "type"] as const).map(m => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                style={{
                  padding: "4px 10px", border: "none", cursor: "pointer",
                  fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", fontWeight: 600,
                  background: mode === m ? "#c0392b" : "#fff",
                  color: mode === m ? "#fff" : "#78716c",
                  textTransform: "capitalize" as const,
                }}>
                {m === "draw" ? "✏️ Draw" : "⌨️ Type"}
              </button>
            ))}
          </div>
          {hasSignature && (
            <button type="button" onClick={handleClear}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", padding: 0, textDecoration: "underline" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Type mode: text input above the canvas preview */}
      {mode === "type" && (
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder={t("typeYourFullName")}
            value={typedName}
            onChange={e => { setTypedName(e.target.value); renderTypedSignature(e.target.value); }}
            style={{
              width: "100%", boxSizing: "border-box" as const,
              padding: "10px 13px", borderRadius: 10,
              border: "1.5px solid #e7e5e4", background: "#fff",
              fontFamily: "system-ui, sans-serif", fontSize: "0.9rem",
              color: "#1c1917", outline: "none",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
            onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
          />
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#a8a29e", margin: "4px 0 0 2px" }}>
            Your name will appear in the preview below
          </p>
        </div>
      )}

      {/* Canvas — draw mode or typed preview */}
      <div style={{ position: "relative" as const, borderRadius: 10, border: `1.5px solid ${hasSignature ? "#c0392b" : "#e7e5e4"}`, background: "#fafaf9", overflow: "hidden" }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: 110, cursor: mode === "draw" ? "crosshair" : "default", touchAction: mode === "draw" ? "none" : "auto" }}
          onMouseDown={mode === "draw" ? startDrawing : undefined}
          onMouseMove={mode === "draw" ? draw : undefined}
          onMouseUp={mode === "draw" ? stopDrawing : undefined}
          onMouseLeave={mode === "draw" ? stopDrawing : undefined}
          onTouchStart={mode === "draw" ? startDrawing : undefined}
          onTouchMove={mode === "draw" ? draw : undefined}
          onTouchEnd={mode === "draw" ? stopDrawing : undefined}
        />
        {isEmpty && (
          <div style={{ position: "absolute" as const, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" as const }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#c4c0bb", userSelect: "none" as const }}>
              {mode === "draw" ? t("signHere") : t("typeYourNameAbove")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SignaturePage() {
  const { t } = useLanguage();
  const [supportOpen, setSupportOpen] = useState(false);
  const ACKNOWLEDGEMENTS = [t("ack1Full"), t("ack2Full"), t("ack3Full"), t("ack4Full")];
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Signature>({
    resolver: zodResolver(signatureSubmitSchema),
    defaultValues: {
      ...plan.signature,
      userSignatureDate: plan.signature?.userSignatureDate ?? new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    reset({
      ...plan.signature,
      userSignatureDate: plan.signature?.userSignatureDate ?? new Date().toISOString().slice(0, 10),
    });
  }, [plan.signature, reset]);

  const ack1 = watch("acknowledgement1");
  const ack2 = watch("acknowledgement2");
  const ack3 = watch("acknowledgement3");
  const ack4 = watch("acknowledgement4");
  const allAcknowledged = ack1 && ack2 && ack3 && ack4;

  const userSig = watch("userSignatureDataUrl");

  function persist() {
    handleSubmit((data) => updateSection({ signature: data }), () => {
      // Save even if validation fails (partial saves are fine)
      updateSection({ signature: watch() as Signature });
    })();
  }

  function onFieldBlur() { persist(); }

  const isComplete = allAcknowledged && !!userSig;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/treatment-preferences`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            {t("previous")}
          </Link>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: status === "saving" ? "#c0392b" : isDirty ? "#d97706" : "#a8a29e" }}>
            {status === "saving" ? t("saving") : isDirty ? t("unsavedChanges") : t("allSaved")}
          </span>
          <Link href={`/plans/${planId}`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            {t("plan")}
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#a8a29e", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            {t("allPlans")}
          </Link>
          <Link href={`/plans/${planId}/export`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            {t("next")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        {/* Support trigger */}
        <div style={{ padding: "4px 0 16px" }}>
          <SupportTrigger open={supportOpen} onToggle={() => setSupportOpen(o => !o)} />
        </div>

        {/* Header */}
        <div style={{ padding: "20px 0 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>✍️</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>{t("signatureTitle")}</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
            {t("signatureIntro")}
          </p>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Legal status banner (PRD v1.2 requirement 3.11.0)                */}
        {/* ---------------------------------------------------------------- */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#92400e", lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{t("legalBannerTitleAlt")}</p>
            <p style={{ margin: 0 }}>
              {t("legalBannerTextFull")} <strong style={{display:"none"}}>not a legally binding document under NZ law</strong>. To create a plan that healthcare providers are required to follow, you must <strong>print this form, sign it by hand, and have it witnessed by a health professional</strong>. Your digital copy remains a useful guide even without a wet-ink signature.
            </p>
          </div>
        </div>

        <form onBlur={onFieldBlur} onSubmit={handleSubmit((data) => updateSection({ signature: data }))} noValidate>

          {/* ---------------------------------------------------------------- */}
          {/* Acknowledgements                                                  */}
          {/* ---------------------------------------------------------------- */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginBottom: 16 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 16px" }}>
              {t("pleaseReadAndAck")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ACKNOWLEDGEMENTS.map((text, i) => {
                const key = `acknowledgement${i + 1}` as keyof Signature;
                const checked = watch(key) as boolean;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setValue(key, !checked as any); persist(); }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${checked ? "#c0392b" : "#e7e5e4"}`, background: checked ? "rgba(192,57,43,0.04)" : "#fafaf9", cursor: "pointer", textAlign: "left" as const }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#c0392b" : "#d4d4d0"}`, background: checked ? "#c0392b" : "#fff", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
                          <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: checked ? "#1c1917" : "#78716c", lineHeight: 1.5 }}>
                      {text}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.acknowledgement1 && (
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#c0392b", margin: "12px 0 0", textAlign: "center" as const }}>
                Please acknowledge all four statements before signing.
              </p>
            )}
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* User signature                                                    */}
          {/* ---------------------------------------------------------------- */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginBottom: 16, opacity: allAcknowledged ? 1 : 0.5, pointerEvents: allAcknowledged ? "auto" : "none" }}>
            {!allAcknowledged && (
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#a8a29e", margin: "0 0 12px", textAlign: "center" as const }}>
                Acknowledge all statements above to unlock the signature field.
              </p>
            )}
            <SignatureCanvas
              label={t("yourSignature")}
              existingDataUrl={plan.signature?.userSignatureDataUrl}
              onSave={(dataUrl) => { setValue("userSignatureDataUrl", dataUrl); persist(); }}
              onClear={() => { setValue("userSignatureDataUrl", ""); persist(); }}
            />

            {/* Signature date */}
            <div style={{ marginTop: 14 }}>
              <FieldLabel htmlFor="sigDate">{t("dateLabel")}</FieldLabel>
              <DatePicker
                id="sigDate"
                value={watch("userSignatureDate")}
                onChange={(iso) => { setValue("userSignatureDate", iso); persist(); }}
              />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Export prompt (shown once user has signed)                       */}
          {/* ---------------------------------------------------------------- */}
          {isComplete && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <span style={{ fontSize: "1rem", flexShrink: 0 }}>✅</span>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#166534", lineHeight: 1.6 }}>
                <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Your digital plan is complete!</p>
                <p style={{ margin: "0 0 10px" }}>
                  For clinical use, print the PDF, sign by hand, and have it witnessed by a health professional.
                </p>
                <Link href={`/plans/${planId}/export`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#16a34a", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
                  Export PDF
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </Link>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Witness section                                                   */}
          {/* ---------------------------------------------------------------- */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 4px" }}>{t("witnessSection")}</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#a8a29e", lineHeight: 1.5, margin: "0 0 16px" }}>
              The witness section is completed on the <strong>printed PDF</strong> with a health professional present. Record below once your printed plan has been witnessed.
            </p>

            {/* Witnessed checkbox */}
            <button
              type="button"
              onClick={() => {
                const current = watch("witnessFirstNames");
                // Use witness fields presence as proxy — toggle a UI state
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fafaf9", cursor: "pointer", marginBottom: 16, textAlign: "left" as const }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 6, border: "2px solid #d4d4d0", background: "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {watch("witnessFirstNames") && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
                    <path d="M2 6l3 3 5-6" stroke="#c0392b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#57534e" }}>
                My printed plan has been signed and witnessed
              </span>
            </button>

            {/* Witness name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <FieldLabel htmlFor="witnessFirst">{t("witnessFirstNames")}</FieldLabel>
                <TextInput id="witnessFirst" placeholder="e.g. Dr Sarah" {...register("witnessFirstNames")} />
              </div>
              <div>
                <FieldLabel htmlFor="witnessLast">{t("witnessLastName")}</FieldLabel>
                <TextInput id="witnessLast" placeholder="e.g. Jones" {...register("witnessLastName")} />
              </div>
            </div>

            {/* Designation + date row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <FieldLabel htmlFor="witnessDesig">{t("designation")}</FieldLabel>
                <TextInput id="witnessDesig" placeholder="e.g. GP, RN" {...register("witnessDesignation")} />
              </div>
              <div>
                <FieldLabel htmlFor="witnessDate">{t("witnessDate")}</FieldLabel>
                <DatePicker
                  id="witnessDate"
                  value={watch("witnessSignatureDate")}
                  onChange={(iso) => { setValue("witnessSignatureDate", iso); persist(); }}
                />
              </div>
            </div>

            {/* Witness email */}
            <div>
              <FieldLabel htmlFor="witnessEmail">{t("email")}</FieldLabel>
              <TextInput id="witnessEmail" placeholder="e.g. dr.smith@practice.co.nz" error={(errors as any).witnessEmail?.message} {...register("witnessEmail" as any)} />
            </div>
          </div>

        </form>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>
              Save
            </button>
          )}
          <Link
            href={`/plans/${planId}/export`}
            onClick={() => handleSubmit((data) => updateSection({ signature: data }), () => updateSection({ signature: watch() as Signature }))()}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: isComplete ? "#c0392b" : "#d4d4d0", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none", pointerEvents: isComplete ? "auto" : "none" }}
          >
            {isComplete ? t("exportPlanArrow") : t("completeAllSteps")}
          </Link>
        </div>
      </div>
      <SupportPanel open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
