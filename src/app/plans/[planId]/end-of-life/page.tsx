"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { endOfLifePreferencesSchema, EndOfLifePreferences, DyingPreferenceItem } from "@/lib/schema";

const DYING_OPTIONS: { value: DyingPreferenceItem; label: string }[] = [
  { value: "keepComfortable",   label: "Keep me comfortable" },
  { value: "removeTubes",       label: "Take out tubes and lines that are not adding to my comfort" },
  { value: "familyPresent",     label: "Let my family and friends be with me" },
  { value: "offerFoodAndDrink", label: "Offer me something to eat and drink" },
  { value: "stopMedications",   label: "Stop medications that do not add to my comfort" },
  { value: "spiritualNeeds",    label: "Attend to my spiritual needs" },
  { value: "other",             label: "Other" },
];

const PLACE_OPTIONS = [
  { value: "atHome",     label: "🏠  At home" },
  { value: "inHospice",  label: "🌿  In Hospice" },
  { value: "inHospital", label: "🏥  In hospital" },
  { value: "other",      label: "✏️  Other" },
];

function ToggleGroup({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${value === opt.value ? "#c0392b" : "#e7e5e4"}`, background: value === opt.value ? "rgba(192,57,43,0.07)" : "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: value === opt.value ? 600 : 400, color: value === opt.value ? "#c0392b" : "#78716c", cursor: "pointer" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TextInput({ id, placeholder, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input id={id} type="text" placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none" }}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
      {...rest}
    />
  );
}

function TextareaInput({ id, placeholder, ref: externalRef, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  function mergedRef(el: HTMLTextAreaElement | null) {
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }
    if (typeof externalRef === "function") externalRef(el);
    else if (externalRef && typeof externalRef === "object")
      (externalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  }
  return (
    <textarea id={id} placeholder={placeholder} rows={2}
      style={{ width: "100%", boxSizing: "border-box" as const, padding: "10px 13px", borderRadius: 10, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", color: "#1c1917", outline: "none", resize: "none" as const, overflow: "hidden", lineHeight: 1.5 }}
      ref={mergedRef}
      onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
      onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
      onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; }}
      {...rest}
    />
  );
}

export default function EndOfLifePage() {
  const { plan, updateSection, status, isDirty, save, planId } = usePlan();
  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<EndOfLifePreferences>({
    resolver: zodResolver(endOfLifePreferencesSchema),
    defaultValues: plan.endOfLifePreferences,
  });

  useEffect(() => {
    reset(plan.endOfLifePreferences);
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLTextAreaElement>("textarea").forEach(el => {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
      });
    });
  }, [plan.endOfLifePreferences, reset]);

  const placeImportant = watch("placeOfDeathImportant");
  const placeChoice = watch("placeOfDeath");
  const dyingPrefs = watch("dyingPreferences") ?? [];

  function onFieldBlur() {
    handleSubmit((data) => updateSection({ endOfLifePreferences: data }))();
  }

  function toggleDyingPref(value: DyingPreferenceItem) {
    const current = dyingPrefs;
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    setValue("dyingPreferences", next);
    onFieldBlur();
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 96px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/personal-wishes`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
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
          <Link href={`/plans/${planId}/body-care`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>

        <div style={{ padding: "20px 0 20px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(192,57,43,0.1)", fontSize: "1.3rem", marginBottom: 14 }}>🕊️</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>End-of-Life Preferences</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>What matters to you when you are dying. Tick everything that applies.</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 24, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#92400e", lineHeight: 1.5 }}>
          <span style={{ flexShrink: 0 }}>🤍</span>
          <p style={{ margin: 0 }}>This section can feel confronting. Take it at your own pace. If you need support, call or text <strong>1737</strong> any time.</p>
        </div>

        <form onSubmit={handleSubmit((data) => updateSection({ endOfLifePreferences: data }))} noValidate>

          {/* Dying preferences checkboxes */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginBottom: 16 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 14px" }}>When I am dying, the following are important to me:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {DYING_OPTIONS.map(opt => {
                const checked = dyingPrefs.includes(opt.value);
                return (
                  <button key={opt.value} type="button" onClick={() => toggleDyingPref(opt.value)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${checked ? "#c0392b" : "#e7e5e4"}`, background: checked ? "rgba(192,57,43,0.05)" : "#fafaf9", cursor: "pointer", textAlign: "left" as const }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked ? "#c0392b" : "#d4d4d0"}`, background: checked ? "#c0392b" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ display: "block" }}><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: checked ? "#1c1917" : "#57534e", lineHeight: 1.4 }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {dyingPrefs.includes("other") && (
              <div style={{ marginTop: 12 }}>
                <TextInput placeholder="Please describe…" {...register("dyingPreferencesOther")} />
              </div>
            )}
          </div>

          {/* Place of death */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 14px" }}>Is the place I die important to me?</p>
            <ToggleGroup
              value={placeImportant}
              onChange={(v) => { setValue("placeOfDeathImportant", v as "yes" | "no"); onFieldBlur(); }}
              options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]}
            />

            {placeImportant === "yes" && (
              <div style={{ marginTop: 18 }}>
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#57534e", margin: "0 0 10px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>When I am dying I would like to be cared for:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PLACE_OPTIONS.map(opt => {
                    const selected = placeChoice === opt.value;
                    return (
                      <button key={opt.value} type="button"
                        onClick={() => { setValue("placeOfDeath", opt.value as any); onFieldBlur(); }}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${selected ? "#c0392b" : "#e7e5e4"}`, background: selected ? "rgba(192,57,43,0.05)" : "#fafaf9", cursor: "pointer", textAlign: "left" as const }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? "#c0392b" : "#d4d4d0"}`, background: selected ? "#c0392b" : "#fff", flexShrink: 0 }} />
                        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: selected ? "#1c1917" : "#57534e" }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {placeChoice === "atHome" && (
                  <div style={{ marginTop: 12 }}>
                    {/* Copy from personal info button */}
                    {plan.personalInfo?.address && (
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setValue("placeOfDeathAtHomeAddress", plan.personalInfo.address ?? "");
                            onFieldBlur();
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#c0392b", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                          </svg>
                          Copy from Personal Info
                        </button>
                      </div>
                    )}
                    <TextareaInput placeholder="Home address…" {...register("placeOfDeathAtHomeAddress")} onBlur={onFieldBlur} />
                  </div>
                )}
                {placeChoice === "other" && (
                  <div style={{ marginTop: 12 }}>
                    <TextareaInput placeholder="Please describe…" {...register("placeOfDeathOther")} onBlur={onFieldBlur} />
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", gap: 10 }}>
          {isDirty && (
            <button onClick={save} style={{ padding: "13px 18px", borderRadius: 12, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, color: "#78716c", cursor: "pointer", flexShrink: 0 }}>Save</button>
          )}
          <Link href={`/plans/${planId}/body-care`} onClick={() => handleSubmit((data) => updateSection({ endOfLifePreferences: data }))()} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
            Save & Continue
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
