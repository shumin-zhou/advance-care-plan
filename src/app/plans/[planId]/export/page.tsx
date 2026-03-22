"use client";

/**
 * Export / Share — /plans/[planId]/export
 *
 * - Shows plan completion status
 * - Generates and downloads a PDF using pdf-lib
 * - Prints via browser print dialog
 * - Links back to any incomplete sections
 */

import { useState } from "react";
import Link from "next/link";
import { usePlan } from "@/context/PlanContext";
import { useLanguage, LanguageSwitcher } from "@/context/LanguageContext";
import { PLAN_SECTIONS, AdvanceCarePlan } from "@/lib/schema";
import { generatePdf } from "@/lib/generatePdf";

const SECTION_SLUGS: Partial<Record<keyof AdvanceCarePlan, string>> = {
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

type ExportStatus = "idle" | "generating" | "done" | "error";

export default function ExportPage() {
  const { t } = useLanguage();
  const { plan, completionPercentage, isSectionComplete, exportJson, planId } = usePlan();
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [attachBackup, setAttachBackup] = useState(false);

  const formSections = PLAN_SECTIONS.filter(s => s.key in SECTION_SLUGS);
  const incompleteSections = formSections.filter(
    s => !isSectionComplete(s.key as keyof AdvanceCarePlan)
  );

  const sectionUrl = (key: keyof AdvanceCarePlan) => `/plans/${planId}/${SECTION_SLUGS[key]}`;

  const name = [plan.personalInfo?.firstNames, plan.personalInfo?.surname]
    .filter(Boolean).join(" ") || t("yourPlan");

  async function handleDownloadPdf() {
    setPdfStatus("generating");
    setErrorMsg("");
    try {
      const bytes = await generatePdf(plan);
      const date = new Date().toISOString().slice(0, 10);
      const safeName = plan.personalInfo?.surname ?? "plan";

      // Download PDF
      const pdfBytes = new Uint8Array(bytes);
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfA = document.createElement("a");
      pdfA.href = pdfUrl;
      pdfA.download = `advance-care-plan-${safeName}-${date}.pdf`;
      pdfA.click();
      URL.revokeObjectURL(pdfUrl);

      // Also download backup JSON
      const json = JSON.stringify(plan, null, 2);
      const jsonBlob = new Blob([json], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonA = document.createElement("a");
      jsonA.href = jsonUrl;
      jsonA.download = `advance-care-plan-backup-${safeName}-${date}.json`;
      setTimeout(() => { jsonA.click(); URL.revokeObjectURL(jsonUrl); }, 400);

      setPdfStatus("done");
      setTimeout(() => setPdfStatus("idle"), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(t("pdfGenerateError"));
      setPdfStatus("error");
    }
  }

  async function handlePrint() {
    setPdfStatus("generating");
    try {
      const bytes = await generatePdf(plan);
      const pdfArr = new Uint8Array(bytes);
      const blob = new Blob([pdfArr], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 2000);
      };
      setPdfStatus("idle");
    } catch (err) {
      setErrorMsg(t("printError"));
      setPdfStatus("error");
    }
  }

  async function handleEmail() {
    if (!emailTo.trim()) return;
    setEmailStatus("generating");
    try {
      const bytes = await generatePdf(plan);
      const date = new Date().toISOString().slice(0, 10);
      const safeName = plan.personalInfo?.surname ?? "plan";
      const pdfBytes = new Uint8Array(bytes);
      const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
      const pdfFileName = `advance-care-plan-${safeName}-${date}.pdf`;
      const jsonFileName = `advance-care-plan-backup-${safeName}-${date}.json`;

      // Build file list for share API
      const files: File[] = [new File([pdfBlob], pdfFileName, { type: "application/pdf" })];
      if (attachBackup) {
        const json = JSON.stringify(plan, null, 2);
        const jsonBlob = new Blob([json], { type: "application/json" });
        files.push(new File([jsonBlob], jsonFileName, { type: "application/json" }));
      }

      // Try Web Share API on mobile
      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          title: `Advance Care Plan — ${name}`,
          text: `Please find attached the Advance Care Plan for ${name}.`,
          files,
        });
        setEmailStatus("done");
        setTimeout(() => setEmailStatus("idle"), 3000);
        return;
      }

      // Desktop: download files then open mailto
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfA = document.createElement("a");
      pdfA.href = pdfUrl;
      pdfA.download = pdfFileName;
      pdfA.click();
      URL.revokeObjectURL(pdfUrl);

      if (attachBackup) {
        const json = JSON.stringify(plan, null, 2);
        const jsonBlob = new Blob([json], { type: "application/json" });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonA = document.createElement("a");
        jsonA.href = jsonUrl;
        jsonA.download = jsonFileName;
        setTimeout(() => { jsonA.click(); URL.revokeObjectURL(jsonUrl); }, 400);
      }

      setTimeout(() => {
        const subject = encodeURIComponent(`Advance Care Plan — ${name}`);
        const bodyText = attachBackup
          ? `Please find attached the Advance Care Plan PDF and backup file for ${name}.

Both files have been downloaded to your device. Please attach them to this email before sending.

This plan was created using the My Advance Care Plan app.`
          : `Please find attached the Advance Care Plan for ${name}.

The PDF has been downloaded to your device. Please attach it to this email before sending.

This plan was created using the My Advance Care Plan app.`;
        window.open(`mailto:${encodeURIComponent(emailTo)}?subject=${subject}&body=${encodeURIComponent(bodyText)}`, '_blank');
      }, 600);

      setEmailStatus("done");
      setTimeout(() => setEmailStatus("idle"), 4000);
    } catch (err: any) {
      console.error(err);
      setEmailStatus("error");
    }
  }

  const isGenerating = pdfStatus === "generating";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px 48px" }}>

        {/* Top nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px", position: "sticky", top: 0, zIndex: 10, background: "rgba(253,248,243,0.92)", backdropFilter: "blur(8px)" }}>
          <Link href={`/plans/${planId}/signature`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            {t("previous")}
          </Link>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#1c1917" }}>{t("exportTitle")}</span>
          <Link href={`/plans/${planId}`} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#78716c", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
            {t("plan")}
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#a8a29e", textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            {t("allPlans")}
          </Link>
        </div>

        {/* Header */}
        <div style={{ padding: "20px 0 24px" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>📋</div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: "#1c1917", margin: "0 0 6px" }}>{t("exportTitle")}</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>{t("exportSubtitle")}</p>
        </div>

        {/* Completion summary */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "#1c1917" }}>{name}</span>
            <span style={{
              fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 700,
              color: completionPercentage === 100 ? "#16a34a" : "#d97706",
              background: completionPercentage === 100 ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${completionPercentage === 100 ? "#bbf7d0" : "#fde68a"}`,
              borderRadius: 20, padding: "3px 10px",
            }}>
              {completionPercentage}% complete
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: "#f5f5f4", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", width: `${completionPercentage}%`, borderRadius: 99, background: completionPercentage === 100 ? "#16a34a" : "#c0392b", transition: "width 0.5s ease" }} />
          </div>

          {incompleteSections.length > 0 ? (
            <div>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#78716c", margin: "0 0 8px" }}>
                {incompleteSections.length} section{incompleteSections.length > 1 ? "s" : ""} still incomplete:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                {incompleteSections.map(s => (
                  <Link key={s.key} href={sectionUrl(s.key as keyof AdvanceCarePlan)}
                    style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#c0392b", background: "rgba(192,57,43,0.06)", border: "1px solid rgba(192,57,43,0.2)", borderRadius: 6, padding: "3px 10px", textDecoration: "none" }}>
                    {s.label} →
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ display: "block" }}><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>{t("allSectionsComplete")}</span>
            </div>
          )}
        </div>

        {/* Legal notice */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>⚠️</span>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#92400e", lineHeight: 1.6, margin: 0 }}>
            {t("legalNoticeFull")}
          </p>
        </div>

        {/* Error message */}
        {pdfStatus === "error" && (
          <div style={{ background: "#fff8f7", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#c0392b" }}>
            {errorMsg}
          </div>
        )}

        {/* Export actions */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "15px 20px", borderRadius: 14,
              background: isGenerating ? "#e7e5e4" : "#c0392b", color: "#fff",
              border: "none", cursor: isGenerating ? "not-allowed" : "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: "0.95rem", fontWeight: 700,
              transition: "background 0.15s",
            }}
          >
            {pdfStatus === "generating" ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block", animation: "spin 1s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" /></svg>
                {t("generatingLabel")}
              </>
            ) : pdfStatus === "done" ? (
              <>{t("exportComplete")}</>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                {t("downloadPdfAndBackup")}
              </>
            )}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            disabled={isGenerating}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "13px 20px", borderRadius: 14,
              background: "#fff", color: "#1c1917",
              border: "1.5px solid #e7e5e4", cursor: isGenerating ? "not-allowed" : "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 600,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
            {t("printLabel")}
          </button>

          {/* Email */}
          <button
            onClick={() => setShowEmailPanel(p => !p)}
            disabled={isGenerating}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "13px 20px", borderRadius: showEmailPanel ? "14px 14px 0 0" : 14,
              background: showEmailPanel ? "#f5f5f4" : "#fff", color: "#1c1917",
              border: "1.5px solid #e7e5e4", borderBottom: showEmailPanel ? "none" : "1.5px solid #e7e5e4",
              cursor: isGenerating ? "not-allowed" : "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 600,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            {t("emailPdfLabel")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block", marginLeft: "auto", transform: showEmailPanel ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>

          {/* Email panel */}
          {showEmailPanel && (
            <div style={{ background: "#f5f5f4", border: "1.5px solid #e7e5e4", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "16px" }}>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#78716c", margin: "0 0 12px", lineHeight: 1.5 }}>
                {t("emailPanelNote")}
              </p>
              {/* Attach backup option */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#57534e" }}>
                <input
                  type="checkbox"
                  checked={attachBackup}
                  onChange={e => setAttachBackup(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#c0392b", cursor: "pointer" }}
                />
                {t("attachBackupJson")}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleEmail(); }}
                  style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #e7e5e4", background: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem", color: "#1c1917", outline: "none" }}
                  onFocus={e => e.currentTarget.style.borderColor = "#c0392b"}
                  onBlur={e => e.currentTarget.style.borderColor = "#e7e5e4"}
                />
                <button
                  onClick={handleEmail}
                  disabled={!emailTo.trim() || emailStatus === "generating"}
                  style={{
                    padding: "9px 16px", borderRadius: 8, border: "none",
                    background: !emailTo.trim() || emailStatus === "generating" ? "#e7e5e4" : "#c0392b",
                    color: "#fff", fontFamily: "system-ui, sans-serif", fontSize: "0.875rem",
                    fontWeight: 600, cursor: !emailTo.trim() || emailStatus === "generating" ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }}
                >
                  {emailStatus === "generating" ? "…" : emailStatus === "done" ? t("emailSentLabel") : t("send")}
                </button>
              </div>
              {emailStatus === "error" && (
                <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#c0392b", margin: "8px 0 0" }}>
                  {t("emailErrorNote")}
                </p>
              )}
              {emailStatus === "done" && (
                <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: "1px solid #bbf7d0" }}>
                  <div style={{ background: "#dcfce7", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>✅</span>
                    <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", fontWeight: 700, color: "#15803d", margin: 0 }}>
                      {t("emailDoneBanner")}
                    </p>
                  </div>
                  <div style={{ background: "#f0fdf4", padding: "10px 14px" }}>
                    <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#166534", margin: 0, lineHeight: 1.6 }}>
                      {t("emailDoneDetail")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Backup JSON */}
          <button
            onClick={exportJson}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "13px 20px", borderRadius: 14,
              background: "#fff", color: "#78716c",
              border: "1.5px solid #e7e5e4", cursor: "pointer",
              fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 600,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            {t("saveBackupLabel")}
          </button>
        </div>

        {/* What to do next */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", padding: 18, marginTop: 20 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", fontWeight: 600, color: "#1c1917", margin: "0 0 14px" }}>{t("whatToDoNext")}</p>
          {[
            { n: "1", text: t("step1") },
            { n: "2", text: t("step2") },
            { n: "3", text: t("step3") },
            { n: "4", text: t("step4") },
            { n: "5", text: t("step5") },
            { n: "5b", text: t("step5b") },
            { n: "6", text: t("step6") },
          ].map(step => (
            <div key={step.n} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(192,57,43,0.1)", color: "#c0392b", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {step.n}
              </div>
              <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#57534e", margin: 0, lineHeight: 1.5 }}>{step.text}</p>
            </div>
          ))}
        </div>

        {/* Support */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fdf4ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
          <span style={{ fontSize: "1rem", flexShrink: 0 }}>🤍</span>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#6b21a8", lineHeight: 1.6, margin: 0 }}>
            {t("supportNoteFull")}
          </p>
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
