"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { useLanguage } from "@/context/LanguageContext";
import { SupportTrigger, SupportPanel } from "@/components/SupportPanel";
import { PersonalInfo } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Primitives — same as EPA page
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children, required }: {
  htmlFor: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#57534e", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
      {children}
      {required && <span style={{ color: "#c0392b", marginLeft: 3 }}>*</span>}
    </label>
  );
}

function TextInput({ id, placeholder, type = "text", value, onChange, onBlur, error }: {
  id: string; placeholder?: string; type?: string;
  value?: string; onChange?: (v: string) => void; onBlur?: () => void; error?: string;
}) {
  return (
    <div>
      <input
        id={id} type={type} placeholder={placeholder} value={value ?? ""} autoComplete="off"
        onChange={e => onChange?.(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box" as const, padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${error ? "#c0392b" : "#e7e5e4"}`, background: error ? "#fff8f7" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none" }}
        onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
        onBlur={e => { e.currentTarget.style.borderColor = error ? "#c0392b" : "#e7e5e4"; onBlur?.(); }}
      />
      {error && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#c0392b", margin: "4px 0 0 2px" }}>{error}</p>}
    </div>
  );
}

function TextareaInput({ id, placeholder, value, onChange, onBlur }: {
  id: string; placeholder?: string;
  value?: string; onChange?: (v: string) => void; onBlur?: () => void;
}) {
  return (
    <textarea
      id={id} placeholder={placeholder} value={value ?? ""} rows={3}
      onChange={e => onChange?.(e.target.value)}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none", resize: "none" as const, overflow: "hidden" }}
      ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
      onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlur={e => { e.currentTarget.style.borderColor = "#e7e5e4"; onBlur?.(); }}
    />
  );
}

// ---------------------------------------------------------------------------
// DatePicker
// ---------------------------------------------------------------------------

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const THIS_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: THIS_YEAR - 1900 + 1 }, (_, i) => THIS_YEAR - i);

function DatePicker({ id, value, onChange, onBlur, error }: {
  id: string; value?: string;
  onChange: (iso: string) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.slice(0,4)) : THIS_YEAR - 30);
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.slice(5,7)) - 1 : 0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [calPos, setCalPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); onBlur?.(); }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function toDisplay(iso?: string) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function openCalendar() {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCalPos({ top: rect.bottom + 6, left: rect.left });
    }
    setOpen(o => !o);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    onChange(iso);
    setOpen(false);
    onBlur?.();
  }

  const selectedDay = value && value.slice(0,7) === `${viewYear}-${String(viewMonth+1).padStart(2,"0")}`
    ? parseInt(value.slice(8,10)) : null;
  const todayStr = new Date().toISOString().slice(0,10);
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectStyle: React.CSSProperties = { padding: "4px 6px", borderRadius: 8, border: "1.5px solid #e7e5e4", background: "#fafaf9", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#1c1917", cursor: "pointer", outline: "none", appearance: "none" as const };

  return (
    <div ref={ref}>
      <button id={id} ref={triggerRef} type="button" onClick={openCalendar}
        onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}
        style={{ width: "100%", boxSizing: "border-box" as const, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 11px", borderRadius: 8, border: `1.5px solid ${open ? "#c0392b" : error ? "#c0392b" : "#e7e5e4"}`, background: error ? "#fff8f7" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: value ? "#1c1917" : "#a8a29e", cursor: "pointer", outline: "none" }}>
        <span>{value ? toDisplay(value) : t("ddmmyyyy")}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block", flexShrink: 0, color: "#a8a29e" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      </button>
      {error && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#c0392b", margin: "4px 0 0 2px" }}>{error}</p>}

      {open && (
        <div role="dialog" aria-label="Date picker"
          onKeyDown={e => { if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }}
          style={{ position: "fixed" as const, top: calPos.top, left: calPos.left, zIndex: 9999, background: "#fff", borderRadius: 14, border: "1.5px solid #e7e5e4", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 14, width: 272 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#78716c", fontSize: "1.1rem", lineHeight: 1, flexShrink: 0 }}>&#8249;</button>
            <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} style={selectStyle}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} style={selectStyle}>
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "#78716c", fontSize: "1.1rem", lineHeight: 1, flexShrink: 0, marginLeft: "auto" }}>&#8250;</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: "center" as const, fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 700, color: "#a8a29e", padding: "2px 0" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isSelected = day === selectedDay;
              const isoDay = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const isToday = isoDay === todayStr;
              return (
                <button key={i} type="button" onClick={() => selectDay(day)} tabIndex={0}
                  style={{ padding: "5px 0", borderRadius: 8, border: isToday && !isSelected ? "1.5px solid #c0392b" : "1.5px solid transparent", background: isSelected ? "#c0392b" : "transparent", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: isSelected ? "#fff" : isToday ? "#c0392b" : "#1c1917", fontWeight: isSelected || isToday ? 700 : 400, cursor: "pointer", outline: "none" }}>
                  {day}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f5f5f4", textAlign: "center" as const }}>
            <button type="button"
              onClick={() => { const now = new Date(); setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); selectDay(now.getDate()); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#c0392b", fontWeight: 600 }}>
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "28px 0 20px" }}>
      <div style={{ flex: 1, height: 1, background: "#e7e5e4" }} />
      <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#a8a29e", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "#e7e5e4" }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PersonalInfoPage() {
  const { t } = useLanguage();
  const [supportOpen, setSupportOpen] = useState(false);
  const { plan, updateSection, status, isDirty, save, planId, exportJson } = usePlan();

  // Local state — same pattern as EPA page.
  // onChange updates local state only. onBlur persists to context.
  // No validation errors shown until the user clicks Save & Continue.
  const [fields, setFields] = useState<PersonalInfo>(() => ({
    surname: plan.personalInfo?.surname ?? "",
    firstNames: plan.personalInfo?.firstNames ?? "",
    nhiNumber: plan.personalInfo?.nhiNumber ?? "",
    dateOfBirth: plan.personalInfo?.dateOfBirth ?? "",
    address: plan.personalInfo?.address ?? "",
    phone: plan.personalInfo?.phone ?? "",
    email: plan.personalInfo?.email ?? "",
  }));

  // useRef instead of useState: marking a field as touched doesn't need to
  // trigger a re-render on its own. The error becomes visible on the next
  // render caused by setFields (onChange) or persist (onBlur). Using a ref
  // also eliminates the "state update not wrapped in act" warning in tests.
  const touched = useRef<Partial<Record<keyof PersonalInfo, boolean>>>({});

  function set(field: keyof PersonalInfo, value: string) {
    setFields(f => ({ ...f, [field]: value }));
  }

  function persist() {
    updateSection({ personalInfo: fields });
  }

  function fieldBlur(field: keyof PersonalInfo) {
    touched.current[field] = true;
    persist();
  }

  function requiredError(field: keyof PersonalInfo, label: string): string | undefined {
    if (!touched.current[field]) return undefined;
    return !fields[field] ? label + " is required" : undefined;
  }

  function emailError(): string | undefined {
    if (!touched.current.email) return undefined;
    if (!fields.email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return "Please enter a valid email address";
    return undefined;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <div style={{ width: 80 }} />
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
          <button onClick={exportJson} title={t("backup")} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 6, borderRadius: 6, border: "1px solid #e7e5e4", background: "#fff", color: "#78716c", cursor: "pointer", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          </button>
          <Link href={`/plans/${planId}/epa`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            {t("next")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        {/* Support trigger */}
        <div style={{ padding: "4px 0 16px" }}>
          <SupportTrigger open={supportOpen} onToggle={() => setSupportOpen(o => !o)} />
        </div>

        {/* Section header */}
        <div style={{ padding: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>👤</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>{t("personalInfoTitle")}</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>{t("personalInfoSubtitle")}</p>
        </div>

        {/* Fields */}
        <div>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <FieldLabel htmlFor="firstNames" required>{t("firstNames")}</FieldLabel>
              <TextInput id="firstNames" placeholder={t("firstNamesPlaceholder")}
                value={fields.firstNames} onChange={v => set("firstNames", v)}
                onBlur={() => fieldBlur("firstNames")}
                error={requiredError("firstNames", t("firstNames"))} />
            </div>
            <div>
              <FieldLabel htmlFor="surname" required>{t("surname")}</FieldLabel>
              <TextInput id="surname" placeholder={t("surnamePlaceholder")}
                value={fields.surname} onChange={v => set("surname", v)}
                onBlur={() => fieldBlur("surname")}
                error={requiredError("surname", t("surname"))} />
            </div>
          </div>

          {/* NHI + DOB row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <FieldLabel htmlFor="nhiNumber">{t("nhiNumber")}</FieldLabel>
              <TextInput id="nhiNumber" placeholder={t("nhiPlaceholder")}
                value={fields.nhiNumber} onChange={v => set("nhiNumber", v)}
                onBlur={persist} />
            </div>
            <div>
              <FieldLabel htmlFor="dateOfBirth" required>{t("dateOfBirth")}</FieldLabel>
              <DatePicker id="dateOfBirth"
                value={fields.dateOfBirth}
                onChange={v => set("dateOfBirth", v)}
                onBlur={() => fieldBlur("dateOfBirth")}
                error={requiredError("dateOfBirth", t("dateOfBirth"))} />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 20 }}>
            <FieldLabel htmlFor="address" required>{t("address")}</FieldLabel>
            <TextareaInput id="address" placeholder={"123 Example Street\nPalmerston North 4410"}
              value={fields.address} onChange={v => set("address", v)}
              onBlur={() => fieldBlur("address")} />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 20 }}>
            <FieldLabel htmlFor="phone" required>{t("phone")}</FieldLabel>
            <TextInput id="phone" type="tel" placeholder={t("phonePlaceholder")}
              value={fields.phone} onChange={v => set("phone", v)}
              onBlur={() => fieldBlur("phone")}
              error={requiredError("phone", t("phone"))} />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <FieldLabel htmlFor="email" required>{t("email")}</FieldLabel>
            <TextInput id="email" type="email" placeholder={t("emailPlaceholder")}
              value={fields.email} onChange={v => set("email", v)}
              onBlur={() => fieldBlur("email")}
              error={emailError()} />
          </div>

          {/* Privacy note */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f5f5f4", borderRadius: 10, padding: "12px 14px", marginTop: 8 }}>
            <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>🔒</span>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>{t("privacyNoteForm")}</p>
          </div>

        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>
              {t("save")}
            </button>
          )}
          <Link href={`/plans/${planId}/epa`} onClick={persist}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            {t("saveAndContinue")}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>

      <SupportPanel open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
