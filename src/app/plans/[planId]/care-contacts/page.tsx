"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { careContactsSchema, CareContacts } from "@/lib/schema";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#57534e", marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>
      {children}
    </label>
  );
}

function TextInput({ id, placeholder, error, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input id={id} type="text" placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${error ? "#c0392b" : "#e7e5e4"}`, background: error ? "#fff8f7" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none" }}
        onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
        onBlur={e => e.currentTarget.style.borderColor = error ? "#c0392b" : "#e7e5e4"}
        {...rest}
      />
      {error && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#c0392b", margin: "4px 0 0 2px" }}>{error}</p>}
    </div>
  );
}

export default function CareContactsPage() {
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CareContacts>({
    resolver: zodResolver(careContactsSchema),
    defaultValues: plan.careContacts,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });

  useEffect(() => { reset(plan.careContacts); }, [plan.careContacts, reset]);

  function onFieldBlur() {
    handleSubmit((data) => updateSection({ careContacts: data }))();
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/epa`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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
        <div style={{ padding: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>👥</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>Care Decision Contacts</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
            People you'd like included in decisions about your care. Up to 4 contacts.
          </p>
        </div>

        <form onBlur={onFieldBlur} onSubmit={handleSubmit((data) => updateSection({ careContacts: data }))} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 16 }}>
                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#a8a29e", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                    Contact {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(index)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a29e", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", padding: 0 }}>
                      Remove
                    </button>
                  )}
                </div>

                {/* Name row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <FieldLabel htmlFor={`contacts.${index}.firstName`}>First name</FieldLabel>
                    <TextInput id={`contacts.${index}.firstName`} placeholder="Jane" {...register(`contacts.${index}.firstName`)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`contacts.${index}.lastName`}>Last name</FieldLabel>
                    <TextInput id={`contacts.${index}.lastName`} placeholder="Smith" {...register(`contacts.${index}.lastName`)} />
                  </div>
                </div>

                {/* Relationship + phone row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <FieldLabel htmlFor={`contacts.${index}.relationship`}>Relationship</FieldLabel>
                    <TextInput id={`contacts.${index}.relationship`} placeholder="e.g. Daughter" {...register(`contacts.${index}.relationship`)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`contacts.${index}.phone`}>Phone</FieldLabel>
                    <TextInput id={`contacts.${index}.phone`} placeholder="021 123 456" {...register(`contacts.${index}.phone`)} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <FieldLabel htmlFor={`contacts.${index}.email`}>Email</FieldLabel>
                  <TextInput id={`contacts.${index}.email`} placeholder="e.g. jane@email.com" {...register(`contacts.${index}.email`)} />
                </div>
              </div>
            ))}
          </div>

          {/* Add contact button */}
          {fields.length < 4 && (
            <button
              type="button"
              onClick={() => append({ firstName: "", lastName: "", relationship: "", phone: "", email: "" })}
              style={{ width: "100%", marginTop: 12, padding: "12px", borderRadius: 12, border: "1.5px dashed #d4d4d0", background: "transparent", fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add another contact
            </button>
          )}
        </form>
      </div>

      {/* Bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>Save</button>
          )}
          <Link href={`/plans/${planId}/will`} onClick={() => handleSubmit((data) => updateSection({ careContacts: data }))()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
