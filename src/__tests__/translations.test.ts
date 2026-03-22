/**
 * __tests__/translations.test.ts
 *
 * Tests for the translation system — key completeness, correct types,
 * and that no key is undefined in either language.
 */

import translations, { Language, LANGUAGE_LABELS } from "@/lib/translations";

const languages: Language[] = ["en", "zh"];

// ---------------------------------------------------------------------------
// Key completeness — every key present in English must exist in Chinese
// ---------------------------------------------------------------------------

describe("translation key completeness", () => {
  const enKeys = Object.keys(translations.en);
  const zhKeys = Object.keys(translations.zh);

  it("Chinese has all keys that English has", () => {
    const missing = enKeys.filter(k => !zhKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("English has all keys that Chinese has", () => {
    const extra = zhKeys.filter(k => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// No undefined values
// ---------------------------------------------------------------------------

describe("no undefined translation values", () => {
  for (const lang of languages) {
    it(`${lang}: no key resolves to undefined`, () => {
      const t = translations[lang] as Record<string, unknown>;
      const undefinedKeys = Object.entries(t)
        .filter(([, v]) => v === undefined)
        .map(([k]) => k);
      expect(undefinedKeys).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// String keys are non-empty
// ---------------------------------------------------------------------------

describe("string values are non-empty", () => {
  for (const lang of languages) {
    it(`${lang}: all string keys are non-empty`, () => {
      const t = translations[lang] as Record<string, unknown>;
      const emptyKeys = Object.entries(t)
        .filter(([, v]) => typeof v === "string" && v.trim() === "")
        .map(([k]) => k);
      expect(emptyKeys).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Function keys return strings
// ---------------------------------------------------------------------------

describe("function keys return non-empty strings", () => {
  it("en: fieldRequired returns a string with the field name", () => {
    const result = translations.en.fieldRequired("Phone");
    expect(typeof result).toBe("string");
    expect(result).toContain("Phone");
  });

  it("zh: fieldRequired returns a string with the field name", () => {
    const result = translations.zh.fieldRequired("电话");
    expect(typeof result).toBe("string");
    expect(result).toContain("电话");
  });

  it("en: sectionsCompleted returns correct format", () => {
    const result = translations.en.sectionsCompleted(3, 10);
    expect(result).toContain("3");
    expect(result).toContain("10");
  });

  it("zh: sectionsCompleted returns correct format", () => {
    const result = translations.zh.sectionsCompleted(3, 10);
    expect(result).toContain("3");
    expect(result).toContain("10");
  });

  it("en: continueButton includes section name", () => {
    const result = translations.en.continueButton("Personal Information");
    expect(result).toContain("Personal Information");
  });

  it("zh: continueButton includes section name", () => {
    const result = translations.zh.continueButton("个人信息");
    expect(result).toContain("个人信息");
  });
});

// ---------------------------------------------------------------------------
// Date picker arrays
// ---------------------------------------------------------------------------

describe("date picker arrays", () => {
  for (const lang of languages) {
    it(`${lang}: months array has 12 entries`, () => {
      expect(translations[lang].months).toHaveLength(12);
    });

    it(`${lang}: monthsShort array has 12 entries`, () => {
      expect(translations[lang].monthsShort).toHaveLength(12);
    });

    it(`${lang}: days array has 7 entries`, () => {
      expect(translations[lang].days).toHaveLength(7);
    });

    it(`${lang}: all month names are non-empty strings`, () => {
      const empty = translations[lang].months.filter(m => !m || m.trim() === "");
      expect(empty).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Section labels object
// ---------------------------------------------------------------------------

describe("sectionLabels", () => {
  const EXPECTED_SECTIONS = [
    "personalInfo", "epa", "careContacts", "will", "personalWishes",
    "endOfLifePreferences", "bodyCareFuneral", "organDonation",
    "treatmentPreferences", "signature",
  ];

  for (const lang of languages) {
    it(`${lang}: sectionLabels has all 10 sections`, () => {
      const labels = translations[lang].sectionLabels as Record<string, string>;
      const missing = EXPECTED_SECTIONS.filter(k => !labels[k]);
      expect(missing).toEqual([]);
    });

    it(`${lang}: all section labels are non-empty`, () => {
      const labels = translations[lang].sectionLabels as Record<string, string>;
      const empty = Object.entries(labels).filter(([, v]) => !v || v.trim() === "");
      expect(empty).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// LANGUAGE_LABELS
// ---------------------------------------------------------------------------

describe("LANGUAGE_LABELS", () => {
  it("has entry for en", () => {
    expect(LANGUAGE_LABELS.en).toBeDefined();
    expect(LANGUAGE_LABELS.en.length).toBeGreaterThan(0);
  });

  it("has entry for zh", () => {
    expect(LANGUAGE_LABELS.zh).toBeDefined();
    expect(LANGUAGE_LABELS.zh.length).toBeGreaterThan(0);
  });
});
