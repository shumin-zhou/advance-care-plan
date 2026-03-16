"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { organDonationSchema, OrganDonation } from "@/lib/schema";

function TextareaInput({ id, placeholder, rows = 4, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea id={id} placeholder={placeholder} rows={rows}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none", resize: "vertical" as const, lineHeight: 1.6 }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
      {...rest}
    />
  );
}

export default function OrganDonationPage() {
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();
  const { register, handleSubmit, reset, watch, setValue } = useForm<OrganDonation>({
    resolver: zodResolver(organDonationSchema),
    defaultValues: plan.organDonation,
  });

  useEffect(() => { reset(plan.organDonation); }, [plan.organDonation, reset]);

  const willingToDonate = watch("willingToDonate");

  function onFieldBlur() {
    handleSubmit((data) => updateSection({ organDonation: data }))();
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/body-care`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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

        <div style={{ padding: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>❤️</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>Organ Donation</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>Your wishes regarding donating organs and/or tissues for transplantation.</p>
        </div>

        <form onBlur={onFieldBlur} onSubmit={handleSubmit((data) => updateSection({ organDonation: data }))} noValidate>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginBottom: 16 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 14px" }}>
              I would like to donate my organs and/or tissues for transplantation:
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }].map(opt => {
                const selected = willingToDonate === opt.value;
                return (
                  <button key={opt.value} type="button"
                    onClick={() => { setValue("willingToDonate", opt.value as "yes" | "no"); onFieldBlur(); }}
                    style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${selected ? "#c0392b" : "#e7e5e4"}`, background: selected ? "rgba(192,57,43,0.07)" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: selected ? 600 : 400, color: selected ? "#c0392b" : "#78716c", cursor: "pointer" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 6px" }}>Other comments</p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", margin: "0 0 12px", lineHeight: 1.4 }}>Any specific wishes about which organs or tissues, or other relevant information.</p>
            <TextareaInput id="comments" placeholder="e.g. I am happy to donate any organs that may help others…" rows={4} {...register("comments")} />
          </div>

          {/* NZ Organ Donation info */}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginTop: 14, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#166534", lineHeight: 1.5 }}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>
            <p style={{ margin: 0 }}>
              In New Zealand, you can also register your decision at <strong>donor.health.nz</strong>. Telling your family your wishes is just as important as registering.
            </p>
          </div>
        </form>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>Save</button>
          )}
          <Link href={`/plans/${planId}/treatment-preferences`} onClick={() => handleSubmit((data) => updateSection({ organDonation: data }))()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
