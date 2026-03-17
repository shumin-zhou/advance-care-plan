"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { treatmentPreferencesSchema, TreatmentPreferences } from "@/lib/schema";

function TextareaInput({ id, placeholder, rows = 3, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea id={id} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none", resize: "none" as const, lineHeight: 1.5, overflow: "hidden" }}
        ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
        onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
      {...rest}
    />
  );
}

export default function TreatmentPreferencesPage() {
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();
  const { register, handleSubmit, reset, control } = useForm<TreatmentPreferences>({
    resolver: zodResolver(treatmentPreferencesSchema),
    defaultValues: plan.treatmentPreferences,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "rows" });

  useEffect(() => {
    reset(plan.treatmentPreferences);
    requestAnimationFrame(() => {
      document.querySelectorAll("textarea").forEach((el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
    });
  }, [plan.treatmentPreferences, reset]);

  function onFieldBlur() {
    handleSubmit((data) => updateSection({ treatmentPreferences: data }))();
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/organ-donation`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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
          <Link href={`/plans/${planId}/signature`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        <div style={{ padding: "20px 0 20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>🩺</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>Treatment Preferences</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>Specific treatments you would or would not want, and the circumstances in which that applies.</p>
        </div>

        {/* Doctor note */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#92400e", lineHeight: 1.5 }}>
          <span style={{ flexShrink: 0 }}>🩺</span>
          <p style={{ margin: 0 }}>
            <strong>Please complete this section with the help of your Doctor or Nurse.</strong> These expressed preferences will be used to guide clinical decisions.
          </p>
        </div>

        {/* Emotional support note */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 10, padding: "12px 14px", marginBottom: 24, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#6b21a8", lineHeight: 1.5 }}>
          <span style={{ flexShrink: 0 }}>🤍</span>
          <p style={{ margin: 0 }}>This section can feel confronting. Take it at your own pace. If you need support, call or text <strong>1737</strong> any time.</p>
        </div>

        <form onBlur={onFieldBlur} onSubmit={handleSubmit((data) => updateSection({ treatmentPreferences: data }))} noValidate>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8, padding: "0 2px" }}>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#a8a29e", margin: 0 }}>I would / would not want</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: "#a8a29e", margin: 0 }}>In these circumstances</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fields.map((field, index) => (
              <div key={field.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e7e5e4", padding: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: fields.length > 1 ? 10 : 0 }}>
                  <TextareaInput
                    id={`rows.${index}.wouldOrWouldNotWant`}
                    placeholder="e.g. I would not want CPR…"
                    rows={3}
                    {...register(`rows.${index}.wouldOrWouldNotWant`)}
                  />
                  <TextareaInput
                    id={`rows.${index}.inTheseCircumstances`}
                    placeholder="e.g. if I have no chance of recovery…"
                    rows={3}
                    {...register(`rows.${index}.inTheseCircumstances`)}
                  />
                </div>
                {fields.length > 1 && (
                  <button type="button" onClick={() => { remove(index); onFieldBlur(); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a29e", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", padding: 0, display: "block" }}>
                    Remove row
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add row button */}
          {fields.length < 10 && (
            <button type="button"
              onClick={() => append({ wouldOrWouldNotWant: "", inTheseCircumstances: "" })}
              style={{ width: "100%", marginTop: 10, padding: "12px", borderRadius: 12, border: "1.5px dashed #d4d4d0", background: "transparent", fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add another row
            </button>
          )}
        </form>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>Save</button>
          )}
          <Link href={`/plans/${planId}/signature`} onClick={() => handleSubmit((data) => updateSection({ treatmentPreferences: data }))()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
