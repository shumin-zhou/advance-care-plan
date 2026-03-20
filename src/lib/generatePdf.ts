/**
 * generatePdf.ts
 * --------------
 * Client-side PDF generation using pdf-lib.
 * Mirrors the layout of the official 4-page "My Advance Care Plan" form.
 *
 * Usage:
 *   import { generatePdf } from "@/lib/generatePdf";
 *   const bytes = await generatePdf(plan);
 *   // bytes is a Uint8Array — pass to a Blob for download
 */

import {
  PDFDocument,
  PDFPage,
  rgb,
  RGB,
  StandardFonts,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { AdvanceCarePlan } from "@/lib/schema";

// Noto Sans shipped locally via @fontsource — no CDN, works offline
// Import the raw font files as URLs via Next.js static assets
async function fetchFont(path: string): Promise<ArrayBuffer> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load font: ${path}`);
  return res.arrayBuffer();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 45;
const CONTENT_W = A4_W - MARGIN * 2;

// Brand colours from the original form
const RED   = rgb(0.75, 0.22, 0.17);   // #c0392b
const DARK  = rgb(0.11, 0.09, 0.09);   // #1c1917
const MID   = rgb(0.47, 0.44, 0.43);   // #78716c
const LIGHT = rgb(0.91, 0.89, 0.89);   // #e7e5e4
const WHITE = rgb(1, 1, 1);
const CREAM = rgb(0.99, 0.97, 0.95);   // page background tint

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

interface Fonts {
  regular:     Awaited<ReturnType<PDFDocument["embedFont"]>>;
  bold:        Awaited<ReturnType<PDFDocument["embedFont"]>>;
  italic:      Awaited<ReturnType<PDFDocument["embedFont"]>>;
  noLigature:  Awaited<ReturnType<PDFDocument["embedFont"]>>; // Helvetica — no OpenType ligatures
}

interface PageState {
  page: PDFPage;
  y: number; // current Y cursor (top-down; we subtract as we draw)
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export async function generatePdf(plan: AdvanceCarePlan): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const [regularBytes, boldBytes, italicBytes] = await Promise.all([
    fetchFont("/fonts/NotoSans-Regular.ttf"),
    fetchFont("/fonts/NotoSans-Bold.ttf"),
    fetchFont("/fonts/NotoSans-Italic.ttf"),
  ]);

  const fonts: Fonts = {
    regular:    await doc.embedFont(regularBytes),
    bold:       await doc.embedFont(boldBytes),
    italic:     await doc.embedFont(italicBytes),
    noLigature: await doc.embedFont(StandardFonts.Helvetica), // ligature-free fallback
  };

  // ---- Page 1: Cover + Personal Info ----
  const p1 = newPage(doc);
  drawPageHeader(p1, fonts, plan, 1);
  drawCoverContent(p1, fonts, plan);

  // ---- Page 2: EPA, Care Contacts, Will, Personal Wishes ----
  const p2 = newPage(doc);
  drawPageHeader(p2, fonts, plan, 2);
  drawPage2(p2, fonts, plan);

  // ---- Page 3: End-of-Life, Body Care, Organ Donation ----
  const p3 = newPage(doc);
  drawPageHeader(p3, fonts, plan, 3);
  drawPage3(p3, fonts, plan);

  // ---- Page 4: Treatment Preferences + Signature ----
  const p4 = newPage(doc);
  drawPageHeader(p4, fonts, plan, 4);
  await drawPage4(p4, fonts, plan, doc);

  return doc.save();
}

// ---------------------------------------------------------------------------
// Page factory
// ---------------------------------------------------------------------------

function newPage(doc: PDFDocument): PageState {
  const page = doc.addPage([A4_W, A4_H]);
  // Cream background
  page.drawRectangle({ x: 0, y: 0, width: A4_W, height: A4_H, color: CREAM });
  return { page, y: A4_H - MARGIN };
}

// ---------------------------------------------------------------------------
// Shared header (repeats on every page, matches original form)
// ---------------------------------------------------------------------------

function drawPageHeader(ps: PageState, fonts: Fonts, plan: AdvanceCarePlan, pageNum: number) {
  const { page } = ps;

  // Red top bar
  page.drawRectangle({ x: 0, y: A4_H - 28, width: A4_W, height: 28, color: RED });
  page.drawText("MY ADVANCE CARE PLAN", {
    x: MARGIN, y: A4_H - 20,
    size: 10, font: fonts.bold, color: WHITE,
  });
  page.drawText(`Page ${pageNum} of 4`, {
    x: A4_W - MARGIN - 50, y: A4_H - 20,
    size: 8, font: fonts.regular, color: WHITE,
  });

  // Mini identity block (top-right on pages 2-4, top on page 1)
  if (pageNum > 1) {
    const pi = plan.personalInfo;
    const identityY = A4_H - 45;
    const boxX = A4_W - 200 - MARGIN;
    // 5 rows × 12pt spacing + padding = 72pt tall box
    page.drawRectangle({ x: boxX, y: identityY - 64, width: 200, height: 70, color: WHITE, borderColor: LIGHT, borderWidth: 0.5 });
    drawSmallField(page, fonts, boxX + 6, identityY - 8,  "Surname:", pi.surname ?? "");
    drawSmallField(page, fonts, boxX + 6, identityY - 20, "First Name/s:", pi.firstNames ?? "");
    drawSmallField(page, fonts, boxX + 6, identityY - 32, "NHI Number:", pi.nhiNumber ?? "");
    drawSmallField(page, fonts, boxX + 6, identityY - 44, "Date of Birth:", formatDob(pi.dateOfBirth));
    drawSmallField(page, fonts, boxX + 6, identityY - 56, "Phone:", pi.phone ?? "");
    ps.y = A4_H - 125;
  } else {
    ps.y = A4_H - 50;
  }
}

function drawSmallField(page: PDFPage, fonts: Fonts, x: number, y: number, label: string, value: string) {
  page.drawText(label, { x, y, size: 6.5, font: fonts.bold, color: MID });
  page.drawText(value || "—", { x: x + 52, y, size: 6.5, font: fonts.regular, color: DARK });
}

// ---------------------------------------------------------------------------
// Page 1 — Cover + personal info
// ---------------------------------------------------------------------------

function drawCoverContent(ps: PageState, fonts: Fonts, plan: AdvanceCarePlan) {
  const { page } = ps;
  let y = ps.y;

  // Title block
  page.drawText("Advance Care Planning", { x: MARGIN, y, size: 9, font: fonts.regular, color: MID });
  y -= 20;

  page.drawText("MY ADVANCE CARE PLAN", { x: MARGIN, y, size: 20, font: fonts.bold, color: RED });
  y -= 24;

  // Intro paragraph
  const intro = "Use this plan to write down what you want health professionals, friends and family/whānau to know if you could no longer tell them yourself.";
  y = drawWrappedText(page, fonts.regular, intro, MARGIN, y, CONTENT_W, 9, MID) - 10;

  // Red divider
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_W, height: 1.5, color: RED });
  y -= 16;

  // Personal information section heading
  drawSectionHeading(page, fonts, MARGIN, y, "Personal Information");
  y -= 20;

  const pi = plan.personalInfo;
  y = drawTwoColumnFields(page, fonts, y, [
    { label: "First Name(s)", value: pi.firstNames ?? "" },
    { label: "Surname", value: pi.surname ?? "" },
  ]);
  y = drawTwoColumnFields(page, fonts, y, [
    { label: "NHI Number", value: pi.nhiNumber ?? "" },
    { label: "Date of Birth", value: formatDob(pi.dateOfBirth) },
  ]);
  y = drawField(page, fonts, MARGIN, y, "Address", pi.address ?? "", CONTENT_W, true);
  y = drawField(page, fonts, MARGIN, y, "Phone", pi.phone ?? "", CONTENT_W);

  ps.y = y;
}

// ---------------------------------------------------------------------------
// Page 2 — EPA, Care Contacts, Will, Personal Wishes
// ---------------------------------------------------------------------------

function drawPage2(ps: PageState, fonts: Fonts, plan: AdvanceCarePlan) {
  const { page } = ps;
  let y = ps.y;

  // EPA — iterate over attorneys grouped by type
  const attorneys = plan.epa?.attorneys ?? [];
  const epaTypes: Array<{ key: string; label: string }> = [
    { key: "personalCareAndWelfare", label: "Enduring Power of Attorney — Personal Care and Welfare" },
    { key: "property",               label: "Enduring Power of Attorney — Property" },
  ];
  for (const { key, label } of epaTypes) {
    const group = attorneys.filter(a => a.type === key);
    if (group.length === 0) continue;
    drawSectionHeading(page, fonts, MARGIN, y, label);
    y -= 20;
    for (const attorney of group) {
      y = drawTwoColumnFields(page, fonts, y, [
        { label: "First Name(s)", value: attorney.firstNames ?? "" },
        { label: "Last Name",     value: attorney.lastName   ?? "" },
      ]);
      y = drawTwoColumnFields(page, fonts, y, [
        { label: "Relationship", value: attorney.relationship ?? "" },
        { label: "Email",        value: attorney.email        ?? "" },
      ]);
      y = drawField(page, fonts, MARGIN, y, "Address", attorney.address ?? "", CONTENT_W, true);
      y = drawField(page, fonts, MARGIN, y, "Phone", (attorney as any).phone ?? "", CONTENT_W);
      y -= 6;
    }
    y -= 4;
  }
  if (attorneys.length === 0) {
    drawSectionHeading(page, fonts, MARGIN, y, "Enduring Power of Attorney");
    y -= 20;
    y = drawField(page, fonts, MARGIN, y, "", "— No attorneys recorded —", CONTENT_W);
    y -= 4;
  }

  // Care contacts
  drawSectionHeading(page, fonts, MARGIN, y, "People to Include in Care Decisions");
  y -= 20;
  for (const contact of plan.careContacts.contacts.slice(0, 4)) {
    if (!contact.firstName && !contact.lastName) continue;
    y = drawTwoColumnFields(page, fonts, y, [
      { label: "Name", value: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() },
      { label: "Relationship", value: contact.relationship ?? "" },
    ]);
    y = drawTwoColumnFields(page, fonts, y, [
      { label: "Phone", value: contact.phone ?? "" },
      { label: "Email", value: (contact as any).email ?? "" },
    ]);
    y -= 4;
  }
  if (plan.careContacts.contacts.every(c => !c.firstName && !c.lastName)) {
    y = drawField(page, fonts, MARGIN, y, "", "— No contacts recorded —", CONTENT_W);
  }
  y -= 8;

  // Will
  drawSectionHeading(page, fonts, MARGIN, y, "Will");
  y -= 18;
  y = drawField(page, fonts, MARGIN, y, "Made a Will", plan.will.hasMadeWill === "yes" ? "Yes" : plan.will.hasMadeWill === "no" ? "No" : "—", CONTENT_W);
  if (plan.will.hasMadeWill === "yes") {
    y = drawField(page, fonts, MARGIN, y, "Will held by", plan.will.heldBy ?? "", CONTENT_W);
  }
  y -= 8;

  // Personal wishes
  drawSectionHeading(page, fonts, MARGIN, y, "Personal Wishes");
  y -= 18;
  const pw = plan.personalWishes;
  y = drawField(page, fonts, MARGIN, y, "What is important to me", pw.importantToMe ?? "", CONTENT_W, true);
  y = drawField(page, fonts, MARGIN, y, "What makes life meaningful to me", pw.meaningfulToMe ?? "", CONTENT_W, true);
  y = drawField(page, fonts, MARGIN, y, "What I want family and friends to know", pw.familyAndFriendsMessage ?? "", CONTENT_W, true);

  ps.y = y;
}

// ---------------------------------------------------------------------------
// Page 3 — End-of-Life, Body Care, Organ Donation
// ---------------------------------------------------------------------------

function drawPage3(ps: PageState, fonts: Fonts, plan: AdvanceCarePlan) {
  const { page } = ps;
  let y = ps.y;
  const eol = plan.endOfLifePreferences;

  drawSectionHeading(page, fonts, MARGIN, y, "End-of-Life Preferences");
  y -= 18;

  // Dying preferences checkboxes
  page.drawText("When I am dying, the following are important to me:", {
    x: MARGIN, y, size: 8.5, font: fonts.bold, color: DARK,
  });
  y -= 14;

  const PREF_LABELS: Record<string, string> = {
    keepComfortable:   "Keep me comfortable",
    removeTubes:       "Take out tubes and lines that are not adding to my comfort",
    familyPresent:     "Let my family and friends be with me",
    offerFoodAndDrink: "Offer me something to eat and drink",
    stopMedications:   "Stop medications that do not add to my comfort",
    spiritualNeeds:    "Attend to my spiritual needs",
    other:             `Other: ${eol.dyingPreferencesOther ?? ""}`,
  };

  const prefs = eol.dyingPreferences ?? [];
  for (const [key, label] of Object.entries(PREF_LABELS)) {
    const checked = prefs.includes(key as any);
    drawCheckbox(page, fonts, MARGIN, y, label, checked);
    y -= 13;
  }
  y -= 6;

  // Place of death
  page.drawText("The place I die is important to me:", {
    x: MARGIN, y, size: 8.5, font: fonts.bold, color: DARK,
  });
  drawCheckbox(page, fonts, MARGIN + 200, y, "Yes", eol.placeOfDeathImportant === "yes");
  drawCheckbox(page, fonts, MARGIN + 232, y, "No", eol.placeOfDeathImportant === "no");
  y -= 14;

  if (eol.placeOfDeathImportant === "yes") {
    page.drawText("When I am dying I would like to be cared for:", {
      x: MARGIN, y, size: 8.5, font: fonts.bold, color: DARK,
    });
    y -= 14;

    // At home — draw checkbox then address on separate indented lines
    drawCheckbox(page, fonts, MARGIN, y, "At home", eol.placeOfDeath === "atHome");
    y -= 13;
    if (eol.placeOfDeath === "atHome" && eol.placeOfDeathAtHomeAddress) {
      const addrLines = eol.placeOfDeathAtHomeAddress.split("\n").filter(Boolean);
      for (const line of addrLines) {
        // Wrap each line in case it is long
        const wrapped = line.trim();
        const lineWidth = fonts.regular.widthOfTextAtSize(wrapped, 8);
        if (lineWidth <= CONTENT_W - 20) {
          page.drawText(wrapped, { x: MARGIN + 20, y, size: 8, font: fonts.regular, color: DARK });
          y -= 11;
        } else {
          y = drawWrappedText(page, fonts.regular, wrapped, MARGIN + 20, y, CONTENT_W - 20, 8, DARK);
        }
      }
    }

    // Other fixed options
    drawCheckbox(page, fonts, MARGIN, y, "In Hospice",  eol.placeOfDeath === "inHospice");
    y -= 13;
    drawCheckbox(page, fonts, MARGIN, y, "In hospital", eol.placeOfDeath === "inHospital");
    y -= 13;

    // Other (free text)
    drawCheckbox(page, fonts, MARGIN, y, "Other", eol.placeOfDeath === "other");
    y -= 13;
    if (eol.placeOfDeath === "other" && eol.placeOfDeathOther) {
      const otherLines = eol.placeOfDeathOther.split("\n").filter(Boolean);
      for (const line of otherLines) {
        y = drawWrappedText(page, fonts.regular, line.trim(), MARGIN + 20, y, CONTENT_W - 20, 8, DARK);
      }
    }
  }
  y -= 8;

  // Divider
  page.drawRectangle({ x: MARGIN, y, width: CONTENT_W, height: 0.5, color: LIGHT });
  y -= 12;

  // Body care
  drawSectionHeading(page, fonts, MARGIN, y, "Body Care & Funeral Wishes");
  y -= 18;
  page.drawText("I would like to be:", { x: MARGIN, y, size: 8.5, font: fonts.bold, color: DARK });
  drawCheckbox(page, fonts, MARGIN + 100, y, "Buried",   plan.bodyCareFuneral.burialPreference === "buried");
  drawCheckbox(page, fonts, MARGIN + 155, y, "Cremated", plan.bodyCareFuneral.burialPreference === "cremated");
  y -= 16;
  y = drawField(page, fonts, MARGIN, y, "End-of-life ceremony / funeral wishes", plan.bodyCareFuneral.funeralWishes ?? "", CONTENT_W, true);
  y -= 8;

  // Organ donation
  drawSectionHeading(page, fonts, MARGIN, y, "Organ Donation");
  y -= 18;
  page.drawText("I would like to donate my organs and/or tissues:", {
    x: MARGIN, y, size: 8.5, font: fonts.bold, color: DARK,
  });
  drawCheckbox(page, fonts, MARGIN + 230, y, "Yes", plan.organDonation.willingToDonate === "yes");
  drawCheckbox(page, fonts, MARGIN + 262, y, "No",  plan.organDonation.willingToDonate === "no");
  y -= 16;
  y = drawField(page, fonts, MARGIN, y, "Other comments", plan.organDonation.comments ?? "", CONTENT_W, true);

  ps.y = y;
}

// ---------------------------------------------------------------------------
// Page 4 — Treatment Preferences + Signature
// ---------------------------------------------------------------------------

async function drawPage4(ps: PageState, fonts: Fonts, plan: AdvanceCarePlan, doc: PDFDocument) {
  const { page } = ps;
  let y = ps.y;

  // Treatment preferences table
  drawSectionHeading(page, fonts, MARGIN, y, "Specific Treatment and Care Preferences");
  y -= 10;
  page.drawText("Please fill out with the help of your Doctor or Nurse", {
    x: MARGIN, y, size: 7.5, font: fonts.noLigature, color: MID,
  });
  y -= 16;

  // Table header
  const colW = CONTENT_W / 2 - 4;
  page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 16, color: RED });
  page.drawText("I would / would not want:", { x: MARGIN + 6, y: y + 2, size: 8, font: fonts.bold, color: WHITE });
  page.drawText("In these circumstances:", { x: MARGIN + colW + 14, y: y + 2, size: 8, font: fonts.bold, color: WHITE });
  y -= 16;

  const rows = plan.treatmentPreferences.rows.filter(r => r.wouldOrWouldNotWant || r.inTheseCircumstances);
  const displayRows = rows.length > 0 ? rows.slice(0, 8) : [{ wouldOrWouldNotWant: "", inTheseCircumstances: "" }];

  for (let i = 0; i < Math.max(displayRows.length, 6); i++) {
    const row = displayRows[i] ?? {};
    const rowH = 22;
    const bg = i % 2 === 0 ? WHITE : rgb(0.97, 0.96, 0.95);
    page.drawRectangle({ x: MARGIN, y: y - rowH + 4, width: CONTENT_W, height: rowH, color: bg, borderColor: LIGHT, borderWidth: 0.3 });
    page.drawRectangle({ x: MARGIN + colW + 8, y: y - rowH + 4, width: 0.5, height: rowH, color: LIGHT });
    if (row.wouldOrWouldNotWant) {
      drawWrappedText(page, fonts.regular, row.wouldOrWouldNotWant, MARGIN + 4, y - 2, colW - 8, 7.5, DARK);
    }
    if (row.inTheseCircumstances) {
      drawWrappedText(page, fonts.regular, row.inTheseCircumstances, MARGIN + colW + 14, y - 2, colW - 8, 7.5, DARK);
    }
    y -= rowH;
  }
  y -= 14;

  // Signature section
  page.drawRectangle({ x: MARGIN, y: y - 2, width: CONTENT_W, height: 14, color: RED });
  page.drawText("For Signature", { x: MARGIN + 6, y: y + 1, size: 9, font: fonts.bold, color: WHITE });
  y -= 18;

  // Acknowledgements
  const acks = [
    "I understand this is a record of my preferences to guide my healthcare team.",
    "I understand it will only be used when I am unable to make decisions for myself.",
    "I understand that medically futile/inappropriate treatments will not be administered.",
    "I acknowledge this record may be held electronically and shared with health providers.",
  ];
  for (let i = 0; i < acks.length; i++) {
    page.drawText(`${i + 1}.`, { x: MARGIN, y, size: 7.5, font: fonts.bold, color: DARK });
    drawWrappedText(page, fonts.regular, acks[i], MARGIN + 12, y, CONTENT_W - 12, 7.5, DARK);
    y -= 12;
  }
  y -= 8;

  // Signature line — user
  page.drawText("Signed:", { x: MARGIN, y, size: 8, font: fonts.bold, color: DARK });

  // Embed actual signature image if present
  const sigData = plan.signature?.userSignatureDataUrl;
  if (sigData && sigData.startsWith("data:image/png;base64,")) {
    try {
      const base64 = sigData.split(",")[1];
      const sigBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const sigImage = await doc.embedPng(sigBytes);
      const sigDims = sigImage.scale(0.3);
      const sigH = Math.min(sigDims.height, 28);
      const sigW = sigDims.width * (sigH / sigDims.height);
      page.drawImage(sigImage, { x: MARGIN + 45, y: y - sigH + 8, width: sigW, height: sigH });
    } catch {
      // Fallback if embedding fails
      page.drawRectangle({ x: MARGIN + 45, y: y - 10, width: 160, height: 22, color: rgb(0.97, 0.97, 0.97), borderColor: LIGHT, borderWidth: 0.5 });
      page.drawText("[ Signed digitally ]", { x: MARGIN + 50, y: y - 2, size: 6.5, font: fonts.italic, color: MID });
    }
  } else {
    page.drawLine({ start: { x: MARGIN + 45, y }, end: { x: MARGIN + 220, y }, thickness: 0.5, color: DARK });
  }

  page.drawText("Date:", { x: A4_W - MARGIN - 120, y, size: 8, font: fonts.bold, color: DARK });
  page.drawText(formatDob(plan.signature?.userSignatureDate) || plan.signature?.userSignatureDate || "", { x: A4_W - MARGIN - 90, y, size: 8, font: fonts.regular, color: DARK });
  y -= 22;

  // Witness section
  page.drawText("Witness (Health Professional):", { x: MARGIN, y, size: 8.5, font: fonts.bold, color: RED });
  y -= 16;

  page.drawText("Signed:", { x: MARGIN, y, size: 8, font: fonts.bold, color: DARK });
  page.drawLine({ start: { x: MARGIN + 45, y }, end: { x: MARGIN + 220, y }, thickness: 0.5, color: DARK });
  page.drawText("Date:", { x: A4_W - MARGIN - 120, y, size: 8, font: fonts.bold, color: DARK });
  if (plan.signature?.witnessSignatureDate) {
    page.drawText(plan.signature.witnessSignatureDate, { x: A4_W - MARGIN - 90, y, size: 8, font: fonts.regular, color: DARK });
  } else {
    page.drawLine({ start: { x: A4_W - MARGIN - 90, y }, end: { x: A4_W - MARGIN, y }, thickness: 0.5, color: DARK });
  }
  y -= 18;

  y = drawTwoColumnFields(page, fonts, y, [
    { label: "First Name(s)", value: plan.signature?.witnessFirstNames ?? "" },
    { label: "Last Name",     value: plan.signature?.witnessLastName   ?? "" },
  ]);
  y = drawTwoColumnFields(page, fonts, y, [
    { label: "Designation", value: plan.signature?.witnessDesignation ?? "" },
    { label: "Email",       value: (plan.signature as any)?.witnessEmail ?? "" },
  ]);

  ps.y = y;
}

// ---------------------------------------------------------------------------
// Drawing primitives
// ---------------------------------------------------------------------------

function drawSectionHeading(page: PDFPage, fonts: Fonts, x: number, y: number, text: string) {
  page.drawRectangle({ x: x - 2, y: y - 4, width: CONTENT_W + 4, height: 15, color: rgb(0.95, 0.91, 0.90) });
  // Auto-shrink font if text is too wide to fit in the heading band
  let size = 9;
  while (size > 6 && fonts.bold.widthOfTextAtSize(text, size) > CONTENT_W - 4) {
    size -= 0.5;
  }
  page.drawText(text, { x, y, size, font: fonts.noLigature, color: RED });
}

function drawCheckbox(page: PDFPage, fonts: Fonts, x: number, y: number, label: string, checked: boolean) {
  page.drawRectangle({ x, y: y - 2, width: 8, height: 8, borderColor: MID, borderWidth: 0.5, color: checked ? RED : WHITE });
  if (checked) {
    page.drawText("✓", { x: x + 1, y: y - 1, size: 6, font: fonts.bold, color: WHITE });
  }
  page.drawText(label, { x: x + 12, y, size: 7.5, font: fonts.regular, color: DARK });
}

function drawField(
  page: PDFPage,
  fonts: Fonts,
  x: number,
  y: number,
  label: string,
  value: string,
  width: number,
  multiline = false,
): number {
  if (label) {
    page.drawText(label, { x, y, size: 7, font: fonts.bold, color: MID });
    y -= 11;
  }

  if (!value) {
    // Empty — draw dash placeholder on a single line
    page.drawText("—", { x, y, size: 8, font: fonts.regular, color: LIGHT });
    y -= 11;
  } else if (multiline) {
    // Split on newlines first, then word-wrap each line individually.
    // pdf-lib ignores \n so we must handle it ourselves.
    const lines = value.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim() === "") {
        y -= 6; // blank line gap
      } else {
        y = drawWrappedText(page, fonts.regular, line, x, y, width, 8, DARK);
      }
    }
  } else {
    // Single line — truncate safely
    page.drawText(value.replace(/\n/g, " ").slice(0, 120), { x, y, size: 8, font: fonts.regular, color: DARK });
    y -= 11;
  }

  // Underline rule + gap before next field
  page.drawLine({ start: { x, y: y - 2 }, end: { x: x + width, y: y - 2 }, thickness: 0.3, color: LIGHT });
  y -= 10;
  return y;
}

function drawTwoColumnFields(
  page: PDFPage,
  fonts: Fonts,
  y: number,
  fields: { label: string; value: string }[],
): number {
  const colW = CONTENT_W / 2 - 6;
  let maxY = y;
  for (let i = 0; i < fields.length; i++) {
    const x = MARGIN + i * (colW + 12);
    const { label, value } = fields[i];
    page.drawText(label, { x, y, size: 7, font: fonts.bold, color: MID });
    const newY = y - 11;
    page.drawText((value || "—").slice(0, 50), { x, y: newY, size: 8, font: fonts.regular, color: value ? DARK : LIGHT });
    page.drawLine({ start: { x, y: newY - 2 }, end: { x: x + colW, y: newY - 2 }, thickness: 0.3, color: LIGHT });
    maxY = Math.min(maxY, newY - 2);
  }
  return maxY - 8;
}

function drawWrappedText(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  color: RGB,
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, size);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= size + 3;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x, y: currentY, size, font, color });
    currentY -= size + 3;
  }
  return currentY;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function formatDob(iso?: string): string {
  if (!iso) return "";
  try {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return iso;
  }
}
