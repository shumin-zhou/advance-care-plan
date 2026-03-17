"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { bodyCareFuneralSchema, BodyCareFuneral } from "@/lib/schema";

function TextareaInput({ id, placeholder, rows = 4, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea id={id} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none", resize: "none" as const, lineHeight: 1.6, overflow: "hidden" }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
      ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
      onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
      {...rest}
    />
  );
}

export default function BodyCarePage() {
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();
  const { register, handleSubmit, reset, watch, setValue } = useForm<BodyCareFuneral>({
    resolver: zodResolver(bodyCareFuneralSchema),
    defaultValues: plan.bodyCareFuneral,
  });

  useEffect(() => {
    reset(plan.bodyCareFuneral);
    requestAnimationFrame(() => {
      document.querySelectorAll("textarea").forEach((el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
    });
  }, [plan.bodyCareFuneral, reset]);

  const burialPref = watch("burialPreference");

  function onFieldBlur() {
    handleSubmit((data) => updateSection({ bodyCareFuneral: data }))();
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/end-of-life`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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
          <Link href={`/plans/${planId}/organ-donation`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        <div style={{ padding: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>🌿</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>Body Care & Funeral</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>Your wishes for how your body is cared for and how you'd like to be remembered.</p>
        </div>

        <form onBlur={onFieldBlur} onSubmit={handleSubmit((data) => updateSection({ bodyCareFuneral: data }))} noValidate>

          {/* Burial preference */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginBottom: 16 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 14px" }}>I would like to be:</p>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ value: "buried", label: "⚰️  Buried" }, { value: "cremated", label: "🕊️  Cremated" }].map(opt => {
                const selected = burialPref === opt.value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => { setValue("burialPreference", opt.value as "buried" | "cremated"); onFieldBlur(); }}
                    style={{ flex: 1, padding: "13px", borderRadius: 10, border: `1.5px solid ${selected ? "#c0392b" : "#e7e5e4"}`, background: selected ? "rgba(192,57,43,0.07)" : "#fafaf9", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: selected ? 600 : 400, color: selected ? "#c0392b" : "#78716c", cursor: "pointer" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Funeral wishes */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 6px" }}>End-of-life ceremony or funeral wishes</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", margin: "0 0 12px", lineHeight: 1.4 }}>Songs, readings, people you'd like to speak, places, traditions, anything that matters to you.</p>
            <TextareaInput id="funeralWishes" placeholder="e.g. I'd like a small gathering with close family. Please play 'Here Comes the Sun'…" rows={5} {...register("funeralWishes")} />
          </div>
        </form>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>Save</button>
          )}
          <Link href={`/plans/${planId}/organ-donation`} onClick={() => handleSubmit((data) => updateSection({ bodyCareFuneral: data }))()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
