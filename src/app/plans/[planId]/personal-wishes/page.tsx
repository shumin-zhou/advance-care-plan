"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { useLanguage, LanguageSwitcher } from "@/context/LanguageContext";
import { personalWishesSchema, PersonalWishes } from "@/lib/schema";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} style={{ display: "block", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#57534e", marginBottom: 6, letterSpacing: "0.02em", textTransform: "uppercase" as const }}>
      {children}
    </label>
  );
}

function TextareaInput({ id, placeholder, error, rows = 5, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  const { t } = useLanguage();
  return (
    <div>
      <textarea id={id} placeholder={placeholder} rows={rows}
        style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: `1.5px solid ${error ? "#c0392b" : "#e7e5e4"}`, background: error ? "#fff8f7" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none", resize: "none" as const, lineHeight: 1.6, overflow: "hidden" }}
        ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
        onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
        onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
        onBlur={e => e.currentTarget.style.borderColor = error ? "#c0392b" : "#e7e5e4"}
        {...rest}
      />
      {error && <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#c0392b", margin: "4px 0 0 2px" }}>{error}</p>}
    </div>
  );
}

export default function PersonalWishesPage() {
  const { t } = useLanguage();
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PersonalWishes>({
    resolver: zodResolver(personalWishesSchema),
    defaultValues: plan.personalWishes,
  });

  useEffect(() => {
    reset(plan.personalWishes);
    requestAnimationFrame(() => {
      document.querySelectorAll("textarea").forEach((el) => {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
    });
  }, [plan.personalWishes, reset]);

  function onFieldBlur() {
    handleSubmit((data) => updateSection({ personalWishes: data }))();
  }

  const wishFields = [
    { id: "importantToMe", name: "importantToMe" as const, label: t("importantToMe"), placeholder: t("importantToMePlaceholder"), hint: t("importantToMeHint2") },
    { id: "meaningfulToMe", name: "meaningfulToMe" as const, label: t("meaningfulToMe"), placeholder: t("meaningfulToMePlaceholder2"), hint: t("meaningfulToMeHint2") },
    { id: "familyAndFriendsMessage", name: "familyAndFriendsMessage" as const, label: t("rememberThings"), placeholder: t("rememberThingsPlaceholder2"), hint: t("rememberThingsHint2") },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/will`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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
          <Link href={`/plans/${planId}/end-of-life`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            {t("next")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        <div style={{ padding: "20px 0 28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>💛</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>{t("personalWishesTitle")}</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
            Share what matters to you so those caring for you can honour your values. Take your time — there are no right answers.
          </p>
        </div>

        {/* Emotional support note */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 24, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#92400e", lineHeight: 1.5 }}>
          <span style={{ flexShrink: 0, fontSize: "0.85rem" }}>🤍</span>
          <p style={{ margin: 0 }}>This section can bring up strong feelings. Take it at your own pace — your progress saves automatically. If you need support, call or text <strong>1737</strong> any time.</p>
        </div>

        <form onBlur={onFieldBlur} onSubmit={handleSubmit((data) => updateSection({ personalWishes: data }))} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {wishFields.map((field) => (
              <div key={field.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18 }}>
                <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", margin: "0 0 10px", lineHeight: 1.4 }}>{field.hint}</p>
                <TextareaInput
                  id={field.id}
                  placeholder={field.placeholder}
                  rows={5}
                  error={(errors as any)[field.name]?.message}
                  {...register(field.name)}
                />
              </div>
            ))}
          </div>
        </form>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>{t("save")}</button>
          )}
          <Link href={`/plans/${planId}/end-of-life`} onClick={() => handleSubmit((data) => updateSection({ personalWishes: data }))()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
