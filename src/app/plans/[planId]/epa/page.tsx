"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { EPAPerson, EPA_TYPE_LABELS, EPAType } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#57534e", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
      {children}
    </label>
  );
}

function TextInput({ id, placeholder, type = "text", value, onChange, onBlur }: {
  id: string; placeholder?: string; type?: string;
  value?: string; onChange?: (v: string) => void; onBlur?: () => void;
}) {
  return (
    <input
      id={id} type={type} placeholder={placeholder} value={value ?? ""} autoComplete="off"
      onChange={e => onChange?.(e.target.value)}
      onBlur={onBlur}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none" }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlurCapture={e => e.currentTarget.style.borderColor = "#e7e5e4"}
    />
  );
}

function TextareaInput({ id, placeholder, value, onChange, onBlur }: {
  id: string; placeholder?: string;
  value?: string; onChange?: (v: string) => void; onBlur?: () => void;
}) {
  return (
    <textarea
      id={id} placeholder={placeholder} value={value ?? ""} rows={2}
      onChange={e => onChange?.(e.target.value)}
      onBlur={onBlur}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "9px 11px", borderRadius: 8, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none", resize: "vertical" as const }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlurCapture={e => e.currentTarget.style.borderColor = "#e7e5e4"}
    />
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyAttorney(type: EPAType): EPAPerson {
  return { firstNames: "", lastName: "", relationship: "", address: "", homePhone: "", mobilePhone: "", email: "", type };
}

// ---------------------------------------------------------------------------
// Attorney card
// ---------------------------------------------------------------------------

function AttorneyCard({ attorney, globalIndex, showRemove, onChange, onRemove, onBlur }: {
  attorney: EPAPerson;
  globalIndex: number;
  showRemove: boolean;
  onChange: (updated: EPAPerson) => void;
  onRemove: () => void;
  onBlur: () => void;
}) {
  function set(field: keyof EPAPerson, value: string) {
    onChange({ ...attorney, [field]: value });
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4", overflow: "hidden", marginBottom: 10 }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "rgba(192,57,43,0.04)", borderBottom: "1px solid #f0ece8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.68rem", fontWeight: 700, color: "#c0392b", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
            {EPA_TYPE_LABELS[attorney.type as EPAType] ?? attorney.type}
          </span>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.68rem", color: "#a8a29e" }}>#{globalIndex + 1}</span>
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", padding: 0 }}>
            Remove
          </button>
        )}
      </div>

      <div style={{ padding: 14 }}>
        {/* EPA Type dropdown */}
        <div style={{ marginBottom: 12 }}>
          <FieldLabel htmlFor={`type-${globalIndex}`}>EPA Type</FieldLabel>
          <div style={{ position: "relative" as const }}>
            <select
              id={`type-${globalIndex}`}
              value={attorney.type}
              onChange={e => { set("type", e.target.value); onBlur(); }}
              style={{ width: "100%", padding: "9px 32px 9px 11px", borderRadius: 8, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none", appearance: "none" as const, cursor: "pointer" }}
            >
              <option value="personalCareAndWelfare">Personal Care and Welfare</option>
              <option value="property">Property</option>
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ position: "absolute" as const, right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const, color: "#a8a29e" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* Name row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <FieldLabel htmlFor={`first-${globalIndex}`}>First name(s)</FieldLabel>
            <TextInput id={`first-${globalIndex}`} placeholder="e.g. John"
              value={attorney.firstNames} onChange={v => set("firstNames", v)} onBlur={onBlur} />
          </div>
          <div>
            <FieldLabel htmlFor={`last-${globalIndex}`}>Last name</FieldLabel>
            <TextInput id={`last-${globalIndex}`} placeholder="e.g. Smith"
              value={attorney.lastName} onChange={v => set("lastName", v)} onBlur={onBlur} />
          </div>
        </div>

        {/* Relationship */}
        <div style={{ marginBottom: 12 }}>
          <FieldLabel htmlFor={`rel-${globalIndex}`}>Relationship</FieldLabel>
          <TextInput id={`rel-${globalIndex}`} placeholder="e.g. Spouse, Son, Daughter"
            value={attorney.relationship} onChange={v => set("relationship", v)} onBlur={onBlur} />
        </div>

        {/* Address */}
        <div style={{ marginBottom: 12 }}>
          <FieldLabel htmlFor={`addr-${globalIndex}`}>Address</FieldLabel>
          <TextareaInput id={`addr-${globalIndex}`} placeholder={"123 Example Street\nPalmerston North 4410"}
            value={attorney.address} onChange={v => set("address", v)} onBlur={onBlur} />
        </div>

        {/* Phone row — Mobile first, then Home Phone */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <FieldLabel htmlFor={`mobile-${globalIndex}`}>Mobile</FieldLabel>
            <TextInput id={`mobile-${globalIndex}`} type="tel" placeholder="021 123 456"
              value={attorney.mobilePhone} onChange={v => set("mobilePhone", v)} onBlur={onBlur} />
          </div>
          <div>
            <FieldLabel htmlFor={`home-${globalIndex}`}>Home Phone</FieldLabel>
            <TextInput id={`home-${globalIndex}`} type="tel" placeholder="06 123 4567"
              value={attorney.homePhone} onChange={v => set("homePhone", v)} onBlur={onBlur} />
          </div>
        </div>

        {/* Email */}
        <div>
          <FieldLabel htmlFor={`email-${globalIndex}`}>Email</FieldLabel>
          <TextInput id={`email-${globalIndex}`} type="email" placeholder="e.g. john@email.com"
            value={attorney.email} onChange={v => set("email", v)} onBlur={onBlur} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type section — heading + cards + add button
// ---------------------------------------------------------------------------

function EPATypeSection({ type, attorneys, allAttorneys, onUpdate, onBlur }: {
  type: EPAType;
  attorneys: { attorney: EPAPerson; globalIndex: number }[];
  allAttorneys: EPAPerson[];
  onUpdate: (updated: EPAPerson[]) => void;
  onBlur: () => void;
}) {
  function handleChange(globalIndex: number, updated: EPAPerson) {
    onUpdate(allAttorneys.map((a, i) => i === globalIndex ? updated : a));
  }

  function handleRemove(globalIndex: number) {
    onUpdate(allAttorneys.filter((_, i) => i !== globalIndex));
  }

  function handleAdd() {
    onUpdate([...allAttorneys, emptyAttorney(type)]);
  }

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section heading */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 20, borderRadius: 2, background: "#c0392b" }} />
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, color: "#1c1917", margin: 0 }}>
            {EPA_TYPE_LABELS[type]}
          </h2>
        </div>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#a8a29e" }}>
          {attorneys.length} {attorneys.length === 1 ? "person" : "people"}
        </span>
      </div>

      {/* Cards */}
      {attorneys.length === 0 && (
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#a8a29e", margin: "0 0 10px", fontStyle: "italic" }}>
          No {EPA_TYPE_LABELS[type].toLowerCase()} attorney added yet.
        </p>
      )}
      {attorneys.map(({ attorney, globalIndex }) => (
        <AttorneyCard
          key={globalIndex}
          attorney={attorney}
          globalIndex={globalIndex}
          showRemove={attorneys.length > 1}
          onChange={(updated) => handleChange(globalIndex, updated)}
          onRemove={() => handleRemove(globalIndex)}
          onBlur={onBlur}
        />
      ))}

      {/* Add button */}
      <button type="button" onClick={handleAdd}
        style={{ width: "100%", padding: "11px", borderRadius: 10, border: "1.5px dashed #d4d4d0", background: "transparent", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", color: "#78716c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Add {EPA_TYPE_LABELS[type]} attorney
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EPAPage() {
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();

  const [attorneys, setAttorneys] = useState<EPAPerson[]>(() => {
    // Guard against old plan shape where epa was a single object, not { attorneys: [] }
    const raw = plan.epa as any;
    if (Array.isArray(raw?.attorneys)) return raw.attorneys;
    return [];
  });

  function persist(updated: EPAPerson[]) {
    updateSection({ epa: { attorneys: updated } });
  }

  function handleUpdate(updated: EPAPerson[]) {
    setAttorneys(updated);
    persist(updated);
  }

  const byType = (type: EPAType) =>
    attorneys.map((a, i) => ({ attorney: a, globalIndex: i })).filter(({ attorney }) => attorney.type === type);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px 96px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/personal-info`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Previous
          </Link>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: status === "saving" ? "#c0392b" : isDirty ? "#d97706" : "#a8a29e" }}>
            {status === "saving" ? "Saving…" : isDirty ? "Unsaved changes" : "All saved"}
          </span>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            Home
          </Link>
        </div>

        {/* Header */}
        <div style={{ padding: "20px 0 20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>🛡️</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>Power of Attorney</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
            Record the people nominated to act on your behalf.
          </p>
        </div>

        {/* Info banner */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 24, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#92400e", lineHeight: 1.6 }}>
          <span style={{ flexShrink: 0 }}>ℹ️</span>
          <p style={{ margin: 0 }}>
            An EPA must be formally appointed under the <strong>Protection of Personal and Property Rights Act 1988</strong>.
            A <strong>Personal Care and Welfare</strong> attorney makes decisions about your health and daily life.
            A <strong>Property</strong> attorney manages your finances and assets.
          </p>
        </div>

        {/* Empty state */}
        {attorneys.length === 0 && (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px dashed #e7e5e4", padding: "28px 20px", textAlign: "center" as const, marginBottom: 24 }}>
            <div style={{ fontSize: "2rem", marginBottom: 10 }}>🛡️</div>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: "0 0 16px", lineHeight: 1.5 }}>
              No attorneys added yet.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" as const }}>
              <button type="button" onClick={() => handleUpdate([emptyAttorney("personalCareAndWelfare")])}
                style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #c0392b", background: "rgba(192,57,43,0.06)", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#c0392b", cursor: "pointer" }}>
                + Personal Care &amp; Welfare
              </button>
              <button type="button" onClick={() => handleUpdate([emptyAttorney("property")])}
                style={{ padding: "9px 16px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.82rem", fontWeight: 600, color: "#78716c", cursor: "pointer" }}>
                + Property
              </button>
            </div>
          </div>
        )}

        {/* Sections — only show once at least one attorney exists */}
        {attorneys.length > 0 && (
          <>
            <EPATypeSection
              type="personalCareAndWelfare"
              attorneys={byType("personalCareAndWelfare")}
              allAttorneys={attorneys}
              onUpdate={handleUpdate}
              onBlur={() => persist(attorneys)}
            />
            <EPATypeSection
              type="property"
              attorneys={byType("property")}
              allAttorneys={attorneys}
              onUpdate={handleUpdate}
              onBlur={() => persist(attorneys)}
            />

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f5f5f4", borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
              <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>📱</span>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
                On supported mobile browsers (iOS Safari, Android Chrome) you'll be able to import directly from your contacts. Coming soon.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 540, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>
              Save
            </button>
          )}
          <Link href={`/plans/${planId}/care-contacts`} onClick={() => persist(attorneys)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
