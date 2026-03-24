"use client";

export const dynamic = "force-dynamic";

import * as React from "react";
import { useState, useRef } from "react";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { useLanguage } from "@/context/LanguageContext";
import { SupportTrigger, SupportPanel } from "@/components/SupportPanel";
import { CareContact } from "@/lib/schema";

// ---------------------------------------------------------------------------
// Primitives — same pattern as EPA page
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#57534e", marginBottom: 5, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
      {children}{required && <span style={{ color: "#c0392b", marginLeft: 3 }}>*</span>}
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

// ---------------------------------------------------------------------------
// Empty contact factory
// ---------------------------------------------------------------------------

function emptyContact(): CareContact {
  return { firstName: "", lastName: "", relationship: "", phone: "", email: "" };
}

// ---------------------------------------------------------------------------
// Contact card — owns its own touched ref, same as EPA's AttorneyCard
// ---------------------------------------------------------------------------

function ContactCard({ contact, index, showRemove, onChange, onRemove, onBlur }: {
  contact: CareContact;
  index: number;
  showRemove: boolean;
  onChange: (updated: CareContact) => void;
  onRemove: () => void;
  onBlur: () => void;
}) {
  const { t } = useLanguage();
  const touched = useRef<Partial<Record<keyof CareContact, boolean>>>({});

  function set(field: keyof CareContact, value: string) {
    onChange({ ...contact, [field]: value });
  }

  function fieldBlur(field: keyof CareContact) {
    touched.current[field] = true;
    onBlur();
  }

  function requiredError(field: keyof CareContact, label: string): string | undefined {
    if (!touched.current[field]) return undefined;
    return !contact[field] ? `${label} is required` : undefined;
  }

  function emailError(): string | undefined {
    if (!touched.current.email) return undefined;
    if (!contact.email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return "Please enter a valid email address";
    return undefined;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 16 }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#a8a29e", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
          {t("contact")} {index + 1}
        </span>
        {showRemove && (
          <button type="button" onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a29e", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", padding: 0 }}>
            {t("remove")}
          </button>
        )}
      </div>

      {/* Name row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <FieldLabel htmlFor={`firstName-${index}`} required>{t("firstName2")}</FieldLabel>
          <TextInput id={`firstName-${index}`} placeholder={t("firstNamePlaceholder")}
            value={contact.firstName} onChange={v => set("firstName", v)}
            onBlur={() => fieldBlur("firstName")}
            error={requiredError("firstName", t("firstName2"))} />
        </div>
        <div>
          <FieldLabel htmlFor={`lastName-${index}`} required>{t("lastName2")}</FieldLabel>
          <TextInput id={`lastName-${index}`} placeholder={t("lastNamePlaceholder")}
            value={contact.lastName} onChange={v => set("lastName", v)}
            onBlur={() => fieldBlur("lastName")}
            error={requiredError("lastName", t("lastName2"))} />
        </div>
      </div>

      {/* Relationship + phone row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <FieldLabel htmlFor={`relationship-${index}`} required>{t("relationship")}</FieldLabel>
          <TextInput id={`relationship-${index}`} placeholder={t("relationshipPlaceholder2")}
            value={contact.relationship} onChange={v => set("relationship", v)}
            onBlur={() => fieldBlur("relationship")}
            error={requiredError("relationship", t("relationship"))} />
        </div>
        <div>
          <FieldLabel htmlFor={`phone-${index}`} required>{t("phone")}</FieldLabel>
          <TextInput id={`phone-${index}`} placeholder={t("phonePlaceholder2")}
            value={contact.phone} onChange={v => set("phone", v)}
            onBlur={() => fieldBlur("phone")}
            error={requiredError("phone", t("phone"))} />
        </div>
      </div>

      {/* Email */}
      <div>
        <FieldLabel htmlFor={`email-${index}`} required>{t("email")}</FieldLabel>
        <TextInput id={`email-${index}`} type="email" placeholder={t("emailPlaceholder")}
          value={contact.email} onChange={v => set("email", v)}
          onBlur={() => fieldBlur("email")}
          error={emailError()} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CareContactsPage() {
  const { t } = useLanguage();
  const [supportOpen, setSupportOpen] = useState(false);
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();

  const [contacts, setContacts] = useState<CareContact[]>(() => {
    const existing = plan.careContacts?.contacts;
    return existing && existing.length > 0 ? existing : [emptyContact()];
  });

  function persist(updated: CareContact[]) {
    updateSection({ careContacts: { contacts: updated } });
  }

  function handleChange(index: number, updated: CareContact) {
    const next = contacts.map((c, i) => i === index ? updated : c);
    setContacts(next);
    persist(next);
  }

  function handleRemove(index: number) {
    const next = contacts.filter((_, i) => i !== index);
    setContacts(next);
    persist(next);
  }

  function handleAdd() {
    const next = [...contacts, emptyContact()];
    setContacts(next);
    persist(next);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/epa`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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
          <Link href={`/plans/${planId}/will`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            {t("next")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        {/* Support trigger */}
        <div style={{ padding: "4px 0 16px" }}>
          <SupportTrigger open={supportOpen} onToggle={() => setSupportOpen(o => !o)} />
        </div>

        {/* Header */}
        <div style={{ padding: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>👥</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>{t("careContactsTitle")}</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>{t("careContactsSubtitle")}</p>
        </div>

        {/* Contact cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {contacts.map((contact, index) => (
            <ContactCard
              key={index}
              contact={contact}
              index={index}
              showRemove={contacts.length > 1}
              onChange={(updated) => handleChange(index, updated)}
              onRemove={() => handleRemove(index)}
              onBlur={() => persist(contacts)}
            />
          ))}
        </div>

        {/* Add contact button */}
        {contacts.length < 4 && (
          <button type="button" onClick={handleAdd}
            style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, border: "1.5px dashed #d4d4d0", background: "transparent", fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            {t("addAnotherContact")}
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>{t("save")}</button>
          )}
          <Link href={`/plans/${planId}/will`} onClick={() => persist(contacts)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            {t("saveAndContinue")}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>

      <SupportPanel open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
}
