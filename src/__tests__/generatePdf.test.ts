/**
 * __tests__/generatePdf.test.ts
 *
 * Smoke tests for PDF generation.
 * Verifies output is a valid PDF byte array and contains expected content.
 * Does not test visual layout — that requires manual inspection.
 */

import { generatePdf } from "@/lib/generatePdf";
import { emptyPlan, type AdvanceCarePlan } from "@/lib/schema";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Mock fetch to serve font files from disk (no HTTP server in test env)
// ---------------------------------------------------------------------------
function findFontFile(url: string): string | null {
  // 1. Check public/fonts/ (the app's primary font location)
  const publicPath = path.join(process.cwd(), "public", url);
  if (fs.existsSync(publicPath)) return publicPath;

  // 2. Fall back to @fontsource package files
  const fontMap: Record<string, string[]> = {
    "/fonts/NotoSans-Regular.ttf": [
      "noto-sans-latin-400-normal.woff2",
      "noto-sans-all-400-normal.woff2",
    ],
    "/fonts/NotoSans-Bold.ttf": [
      "noto-sans-latin-700-normal.woff2",
      "noto-sans-all-700-normal.woff2",
    ],
    "/fonts/NotoSans-Italic.ttf": [
      "noto-sans-latin-400-italic.woff2",
      "noto-sans-all-400-italic.woff2",
    ],
  };
  const candidates = fontMap[url] ?? [];
  for (const candidate of candidates) {
    const p = path.join(process.cwd(), "node_modules/@fontsource/noto-sans/files", candidate);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

beforeAll(() => {
  global.fetch = jest.fn(async (url: RequestInfo | URL) => {
    const urlStr = url.toString();
    const filePath = findFontFile(urlStr);

    if (!filePath) {
      return new Response(null, { status: 404, statusText: "Not Found" });
    }

    // Copy into a fresh Uint8Array so pdf-lib gets a clean ArrayBuffer
    // (Node Buffer shares an underlying pool; its .buffer is the whole pool)
    const nodeBuffer = fs.readFileSync(filePath);
    const copy = new Uint8Array(nodeBuffer.length);
    copy.set(nodeBuffer);

    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => copy.buffer,
    } as unknown as Response;
  }) as jest.Mock;
});

afterAll(() => {
  jest.restoreAllMocks();
});

// A fully populated plan for testing rich content output
const fullPlan: AdvanceCarePlan = {
  ...emptyPlan,
  id: "test-plan-001",
  version: 3,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-06-01T00:00:00.000Z",
  personalInfo: {
    surname: "Smith",
    firstNames: "Jane Mary",
    nhiNumber: "ZAB1234",
    dateOfBirth: "1955-03-15",
    address: "123 Main Street\nPalmerston North 4410",
    phone: "06 123 4567",
    email: "jane@email.com",
  },
  epa: {
    attorneys: [
      {
        firstNames: "Bob",
        lastName: "Smith",
        relationship: "Spouse",
        address: "123 Main Street",
        phone: "021 999 888",
        email: "bob@email.com",
        type: "personalCareAndWelfare",
      },
      {
        firstNames: "Alice",
        lastName: "Jones",
        relationship: "Daughter",
        phone: "021 777 666",
        email: "alice@email.com",
        type: "property",
      },
    ],
  },
  careContacts: {
    contacts: [
      { firstName: "Tom", lastName: "Smith", relationship: "Son", phone: "021 555 444", email: "tom@email.com" },
      { firstName: "Sarah", lastName: "Brown", relationship: "Friend", phone: "021 333 222", email: "sarah@email.com" },
    ],
  },
  will: { hasMadeWill: "yes", heldBy: "With Smith & Jones Solicitors, Wellington" },
  personalWishes: {
    importantToMe: "Being near my family and garden. Good pain management.",
    meaningfulToMe: "My roses, my cats, and Sunday roasts with the whānau.",
    familyAndFriendsMessage: "Thank you for everything. I love you all dearly.",
  },
  endOfLifePreferences: {
    dyingPreferences: ["keepComfortable", "familyPresent", "spiritualNeeds"],
    placeOfDeathImportant: "yes",
    placeOfDeath: "atHome",
    placeOfDeathAtHomeAddress: "123 Main Street\nPalmerston North 4410",
  },
  bodyCareFuneral: {
    burialPreference: "cremated",
    funeralWishes: "A small family gathering. Please play 'Jerusalem'. No black please.",
  },
  organDonation: {
    willingToDonate: "yes",
    comments: "Any organs that may help others.",
  },
  treatmentPreferences: {
    rows: [
      { wouldOrWouldNotWant: "I would not want CPR", inTheseCircumstances: "If there is no realistic chance of recovery" },
      { wouldOrWouldNotWant: "I would want good pain relief", inTheseCircumstances: "At all times" },
    ],
  },
  signature: {
    acknowledgement1: true,
    acknowledgement2: true,
    acknowledgement3: true,
    acknowledgement4: true,
    userSignatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    userSignatureDate: "2024-06-01",
    witnessFirstNames: "Dr Sarah",
    witnessLastName: "Johnson",
    witnessDesignation: "GP",
    witnessEmail: "dr.johnson@clinic.co.nz",
    witnessSignatureDate: "2024-06-01",
  },
};

// ---------------------------------------------------------------------------
// Basic output validation
// ---------------------------------------------------------------------------

describe("generatePdf", () => {
  let pdfBytes: Uint8Array;

  beforeAll(async () => {
    pdfBytes = await generatePdf(fullPlan);
  }, 30000); // PDF generation can take a few seconds

  it("returns a Uint8Array", () => {
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
  });

  it("output is non-empty", () => {
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  it("starts with the PDF magic bytes (%PDF-)", () => {
    // PDF files start with %PDF-
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("output is larger than 10KB (indicates real content was written)", () => {
    expect(pdfBytes.length).toBeGreaterThan(10_000);
  });
});

// ---------------------------------------------------------------------------
// Handles empty plan without throwing
// ---------------------------------------------------------------------------

describe("generatePdf with empty plan", () => {
  it("generates a PDF even with an empty plan", async () => {
    const bytes = await generatePdf({ ...emptyPlan, id: "empty-test" });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  }, 30000);
});

// ---------------------------------------------------------------------------
// Handles special characters (Māori macrons, Chinese)
// ---------------------------------------------------------------------------

describe("generatePdf with special characters", () => {
  it("generates a PDF with Māori macron characters without throwing", async () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      personalInfo: {
        ...emptyPlan.personalInfo,
        surname: "Tūhoe",
        firstNames: "Māia",
        address: "Rotorua",
      },
    };
    await expect(generatePdf(plan)).resolves.toBeInstanceOf(Uint8Array);
  }, 30000);

  it("generates a PDF with Chinese characters without throwing", async () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      personalInfo: {
        ...emptyPlan.personalInfo,
        surname: "王",
        firstNames: "小明",
        address: "奥克兰",
      },
      personalWishes: {
        importantToMe: "家人和健康",
      },
    };
    await expect(generatePdf(plan)).resolves.toBeInstanceOf(Uint8Array);
  }, 30000);
});

// ---------------------------------------------------------------------------
// Multiple attorneys in PDF
// ---------------------------------------------------------------------------

describe("generatePdf with multiple attorneys", () => {
  it("generates without throwing when there are attorneys of both types", async () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      epa: {
        attorneys: [
          { firstNames: "Alice", lastName: "Smith", email: "a@b.com", type: "personalCareAndWelfare", phone: "021 111" },
          { firstNames: "Bob", lastName: "Jones", email: "b@c.com", type: "property", phone: "021 222" },
        ],
      },
    };
    await expect(generatePdf(plan)).resolves.toBeInstanceOf(Uint8Array);
  }, 30000);
});
