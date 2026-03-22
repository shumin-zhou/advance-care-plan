"use client";

import { usePlan } from "@/context/PlanContext";
import { useLanguage, LanguageSwitcher } from "@/context/LanguageContext";
import PinSetup from "@/components/PinSetup";
import { PLAN_SECTIONS, AdvanceCarePlan } from "@/lib/schema";
import Link from "next/link";

const SECTION_ROUTES: Partial<Record<keyof AdvanceCarePlan, string>> = {
  personalInfo:         "personal-info",
  epa:                  "epa",
  careContacts:         "care-contacts",
  will:                 "will",
  personalWishes:       "personal-wishes",
  endOfLifePreferences: "end-of-life",
  bodyCareFuneral:      "body-care",
  organDonation:        "organ-donation",
  treatmentPreferences: "treatment-preferences",
  signature:            "signature",
};

const SECTION_EMOJI: Partial<Record<keyof AdvanceCarePlan, string>> = {
  personalInfo:         "👤",
  epa:                  "🛡️",
  careContacts:         "👥",
  will:                 "📄",
  personalWishes:       "💛",
  endOfLifePreferences: "🕊️",
  bodyCareFuneral:      "🌿",
  organDonation:        "❤️",
  treatmentPreferences: "🩺",
  signature:            "✍️",
};

function formatDate(iso: string | undefined, t: (k: any) => any): string {
  if (!iso) return t("notYetSaved");
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function ProgressRing({ percentage }: { percentage: number }) {
  const { t } = useLanguage();
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="108" height="108" style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx="54" cy="54" r={r} fill="none" stroke="#e7e5e4" strokeWidth="7" />
        <circle cx="54" cy="54" r={r} fill="none" stroke="#c0392b" strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", fontWeight: 700, color: "#1c1917", lineHeight: 1 }}>{percentage}%</div>
        <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.6rem", color: "#a8a29e", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("done")}</div>
      </div>
    </div>
  );
}

export default function PlanHomePage() {
  const { t } = useLanguage();
  const { planId, plan, status, completionPercentage, isSectionComplete, save, isDirty, exportJson } = usePlan();

  const name = plan.personalInfo?.firstNames
    ? `${plan.personalInfo.firstNames}${plan.personalInfo.surname ? " " + plan.personalInfo.surname : ""}`
    : t("unnamedPlan");

  const formSections = PLAN_SECTIONS.filter(s => s.key in SECTION_ROUTES);
  const completedCount = formSections.filter(s => isSectionComplete(s.key as keyof AdvanceCarePlan)).length;

  const sectionUrl = (key: keyof AdvanceCarePlan) => `/plans/${planId}/${SECTION_ROUTES[key]}`;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px 200px" }}>

        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              {/* Back to all plans */}
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", textDecoration: "none", marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                All plans
              </Link>
              <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: "#1c1917", margin: 0, lineHeight: 1.2 }}>
                {name}
              </h1>
            </div>
            <LanguageSwitcher compact />
          <button onClick={exportJson} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: "1px solid #e7e5e4", background: "#fff", color: "#78716c", fontSize: "0.75rem", fontFamily: "system-ui, sans-serif", cursor: "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ display: "block", flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              {t("backup")}
            </button>
          </div>

          {/* Save status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", color: "#a8a29e" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ display: "block", flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {status === "saving" ? (
              <span style={{ color: "#c0392b" }}>{t("saving")}</span>
            ) : isDirty ? (
              <>
                <span style={{ color: "#d97706" }}>{t("unsavedChanges")}</span>
                <button onClick={save} style={{ marginLeft: "auto", color: "#c0392b", background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", textDecoration: "underline", padding: 0 }}>{t("saveNow")}</button>
              </>
            ) : (
              <span>{t("lastUpdated")} {formatDate(plan.updatedAt, t)}</span>
            )}
          </div>
        </header>

        {/* Progress card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e7e5e4", padding: 20, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ProgressRing percentage={completionPercentage} />
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "#1c1917", margin: "0 0 4px" }}>
                {completionPercentage === 100 ? t("planComplete") : completionPercentage === 0 ? t("letsGetStarted") : t("keepGoing")}
              </h2>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
                {completionPercentage === 100
                  ? t("planCompleteDesc")
                  : t("sectionsCompleted")(completedCount, formSections.length)}
              </p>
              {completionPercentage === 100 && (
                <Link href={`/plans/${planId}/export`} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, padding: "8px 16px", borderRadius: 8, background: "#c0392b", color: "#fff", fontSize: "0.8rem", fontFamily: "system-ui, sans-serif", fontWeight: 600, textDecoration: "none" }}>
                  {t("exportPlanButton")}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#92400e", lineHeight: 1.5 }}>
          <span style={{ flexShrink: 0, lineHeight: 1.5 }}>ℹ️</span>
          <p style={{ margin: 0 }}>
            {t("planDisclaimer")}
          </p>
        </div>

        {/* Sections */}
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#a8a29e", margin: "0 0 10px" }}>{t("sections")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {formSections.map((section) => {
            const key      = section.key as keyof AdvanceCarePlan;
            const complete = isSectionComplete(key);
            return (
              <Link key={key} href={sectionUrl(key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1px solid #e7e5e4", background: complete ? "#fff" : "#fafaf9", textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: complete ? "rgba(192,57,43,0.08)" : "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", lineHeight: 1 }}>
                  {SECTION_EMOJI[key] ?? "•"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: "0.875rem", fontWeight: 500, color: complete ? "#1c1917" : "#78716c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(t("sectionLabels") as any)[key] ?? section.label}
                  </div>
                  <div style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.7rem", marginTop: 2, color: complete ? "#c0392b" : "#a8a29e" }}>
                    {complete ? t("completed") : t("notStarted")}
                  </div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: complete ? "#c0392b" : "transparent", border: complete ? "none" : "2px solid #d4d4d4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {complete && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ display: "block" }}>
                      <path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* PIN lock */}
        <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: "1px solid #e7e5e4", padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" as const, color: "#a8a29e", margin: "0 0 2px" }}>
            {t("pinSetTitle")}
          </p>
          <PinSetup planId={planId} />
        </div>

      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", borderTop: "1px solid #e7e5e4", padding: "12px 16px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          {(() => {
            const next = formSections.find(s => !isSectionComplete(s.key as keyof AdvanceCarePlan));
            const href  = next ? sectionUrl(next.key as keyof AdvanceCarePlan) : `/plans/${planId}/export`;
            const label = next ? `${t("continueButton")(next.label)}` : t("exportPlanButton");
            return (
              <Link href={href} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c0392b", color: "#fff", borderRadius: 12, padding: "13px 20px", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                {label}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
