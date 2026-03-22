/**
 * __tests__/schema.test.ts
 *
 * Tests for Zod validation schemas and isSectionComplete helper.
 * No DOM or React required — pure unit tests.
 */

import {
  personalInfoSchema,
  epaPersonSchema,
  careContactSchema,
  careContactsSchema,
  willSchema,
  personalWishesSchema,
  endOfLifePreferencesSchema,
  bodyCareFuneralSchema,
  organDonationSchema,
  treatmentPreferencesSchema,
  signatureSchema,
  isSectionComplete,
  emptyPlan,
  type AdvanceCarePlan,
} from "@/lib/schema";

// ---------------------------------------------------------------------------
// personalInfoSchema
// ---------------------------------------------------------------------------

describe("personalInfoSchema", () => {
  const valid = {
    surname: "Smith",
    firstNames: "Jane",
    dateOfBirth: "1955-03-15",
    address: "123 Main Street\nPalmerston North",
    phone: "021 123 456",
    email: "jane@email.com",
  };

  it("accepts a fully populated valid record", () => {
    expect(personalInfoSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing surname", () => {
    const result = personalInfoSchema.safeParse({ ...valid, surname: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.surname).toBeDefined();
    }
  });

  it("rejects missing firstNames", () => {
    const result = personalInfoSchema.safeParse({ ...valid, firstNames: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing dateOfBirth", () => {
    const result = personalInfoSchema.safeParse({ ...valid, dateOfBirth: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing address", () => {
    const result = personalInfoSchema.safeParse({ ...valid, address: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing phone", () => {
    const result = personalInfoSchema.safeParse({ ...valid, phone: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = personalInfoSchema.safeParse({ ...valid, email: "notanemail" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(/valid email/i);
    }
  });

  it("accepts valid email", () => {
    expect(personalInfoSchema.safeParse({ ...valid, email: "test@example.co.nz" }).success).toBe(true);
  });

  it("allows optional NHI number to be absent", () => {
    const { nhiNumber, ...withoutNhi } = { ...valid, nhiNumber: undefined };
    expect(personalInfoSchema.safeParse(withoutNhi).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// epaPersonSchema
// ---------------------------------------------------------------------------

describe("epaPersonSchema", () => {
  const valid = {
    firstNames: "John",
    lastName: "Smith",
    relationship: "Spouse",
    address: "123 Main Street",
    phone: "021 555 666",
    email: "john@email.com",
    type: "personalCareAndWelfare" as const,
  };

  it("accepts a valid attorney record", () => {
    expect(epaPersonSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts property type", () => {
    expect(epaPersonSchema.safeParse({ ...valid, type: "property" }).success).toBe(true);
  });

  it("rejects missing firstNames", () => {
    expect(epaPersonSchema.safeParse({ ...valid, firstNames: "" }).success).toBe(false);
  });

  it("rejects missing lastName", () => {
    expect(epaPersonSchema.safeParse({ ...valid, lastName: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = epaPersonSchema.safeParse({ ...valid, email: "bad-email" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    expect(epaPersonSchema.safeParse({ ...valid, type: "unknown" }).success).toBe(false);
  });

  it("defaults type to personalCareAndWelfare when omitted", () => {
    const { type, ...withoutType } = valid;
    const result = epaPersonSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("personalCareAndWelfare");
    }
  });
});

// ---------------------------------------------------------------------------
// careContactSchema
// ---------------------------------------------------------------------------

describe("careContactSchema", () => {
  const valid = {
    firstName: "Jane",
    lastName: "Doe",
    relationship: "Daughter",
    phone: "021 111 222",
    email: "jane.doe@email.com",
  };

  it("accepts a valid care contact", () => {
    expect(careContactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects missing firstName", () => {
    expect(careContactSchema.safeParse({ ...valid, firstName: "" }).success).toBe(false);
  });

  it("rejects missing lastName", () => {
    expect(careContactSchema.safeParse({ ...valid, lastName: "" }).success).toBe(false);
  });

  it("rejects missing relationship", () => {
    expect(careContactSchema.safeParse({ ...valid, relationship: "" }).success).toBe(false);
  });

  it("rejects missing phone", () => {
    expect(careContactSchema.safeParse({ ...valid, phone: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(careContactSchema.safeParse({ ...valid, email: "notvalid" }).success).toBe(false);
  });
});

describe("careContactsSchema", () => {
  const contact = {
    firstName: "Jane", lastName: "Doe", relationship: "Daughter",
    phone: "021 111 222", email: "jane@email.com",
  };

  it("rejects more than 4 contacts", () => {
    const result = careContactsSchema.safeParse({
      contacts: [contact, contact, contact, contact, contact],
    });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 4 contacts", () => {
    expect(careContactsSchema.safeParse({
      contacts: [contact, contact, contact, contact],
    }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// willSchema
// ---------------------------------------------------------------------------

describe("willSchema", () => {
  it("accepts yes with location", () => {
    expect(willSchema.safeParse({ hasMadeWill: "yes", heldBy: "With my solicitor" }).success).toBe(true);
  });

  it("accepts no", () => {
    expect(willSchema.safeParse({ hasMadeWill: "no" }).success).toBe(true);
  });

  it("accepts empty object (not yet answered)", () => {
    expect(willSchema.safeParse({}).success).toBe(true);
  });

  it("rejects invalid hasMadeWill value", () => {
    expect(willSchema.safeParse({ hasMadeWill: "maybe" }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSectionComplete
// ---------------------------------------------------------------------------

describe("isSectionComplete", () => {
  it("personalInfo: false when empty", () => {
    expect(isSectionComplete(emptyPlan, "personalInfo")).toBe(false);
  });

  it("personalInfo: true when surname and firstNames filled", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      personalInfo: { ...emptyPlan.personalInfo, surname: "Smith", firstNames: "Jane" },
    };
    expect(isSectionComplete(plan, "personalInfo")).toBe(true);
  });

  it("epa: false when no attorneys", () => {
    expect(isSectionComplete(emptyPlan, "epa")).toBe(false);
  });

  it("epa: true when at least one attorney has a name", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      epa: { attorneys: [{ firstNames: "John", lastName: "Smith", email: "j@s.com", type: "personalCareAndWelfare" }] },
    };
    expect(isSectionComplete(plan, "epa")).toBe(true);
  });

  it("will: false when hasMadeWill is undefined", () => {
    expect(isSectionComplete(emptyPlan, "will")).toBe(false);
  });

  it("will: true when hasMadeWill is set to yes", () => {
    const plan: AdvanceCarePlan = { ...emptyPlan, will: { hasMadeWill: "yes", heldBy: "Solicitor" } };
    expect(isSectionComplete(plan, "will")).toBe(true);
  });

  it("will: true when hasMadeWill is set to no", () => {
    const plan: AdvanceCarePlan = { ...emptyPlan, will: { hasMadeWill: "no" } };
    expect(isSectionComplete(plan, "will")).toBe(true);
  });

  it("personalWishes: false when all empty", () => {
    expect(isSectionComplete(emptyPlan, "personalWishes")).toBe(false);
  });

  it("personalWishes: true when any field is filled", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      personalWishes: { importantToMe: "My family" },
    };
    expect(isSectionComplete(plan, "personalWishes")).toBe(true);
  });

  it("endOfLifePreferences: false when no preferences selected", () => {
    expect(isSectionComplete(emptyPlan, "endOfLifePreferences")).toBe(false);
  });

  it("endOfLifePreferences: true when at least one dying preference selected", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      endOfLifePreferences: { dyingPreferences: ["keepComfortable"] },
    };
    expect(isSectionComplete(plan, "endOfLifePreferences")).toBe(true);
  });

  it("endOfLifePreferences: true when placeOfDeathImportant is set", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      endOfLifePreferences: { dyingPreferences: [], placeOfDeathImportant: "no" },
    };
    expect(isSectionComplete(plan, "endOfLifePreferences")).toBe(true);
  });

  it("bodyCareFuneral: false when burialPreference is undefined", () => {
    expect(isSectionComplete(emptyPlan, "bodyCareFuneral")).toBe(false);
  });

  it("bodyCareFuneral: true when burialPreference is set", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      bodyCareFuneral: { burialPreference: "cremated" },
    };
    expect(isSectionComplete(plan, "bodyCareFuneral")).toBe(true);
  });

  it("organDonation: false when willingToDonate is undefined", () => {
    expect(isSectionComplete(emptyPlan, "organDonation")).toBe(false);
  });

  it("organDonation: true when willingToDonate is set", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      organDonation: { willingToDonate: "yes" },
    };
    expect(isSectionComplete(plan, "organDonation")).toBe(true);
  });

  it("treatmentPreferences: false when all rows empty", () => {
    expect(isSectionComplete(emptyPlan, "treatmentPreferences")).toBe(false);
  });

  it("treatmentPreferences: true when any row has content", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      treatmentPreferences: { rows: [{ wouldOrWouldNotWant: "No CPR", inTheseCircumstances: "" }] },
    };
    expect(isSectionComplete(plan, "treatmentPreferences")).toBe(true);
  });

  it("signature: false when not acknowledged or signed", () => {
    expect(isSectionComplete(emptyPlan, "signature")).toBe(false);
  });

  it("signature: true when all acknowledged and signed", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      signature: {
        acknowledgement1: true,
        acknowledgement2: true,
        acknowledgement3: true,
        acknowledgement4: true,
        userSignatureDataUrl: "data:image/png;base64,abc123",
      },
    };
    expect(isSectionComplete(plan, "signature")).toBe(true);
  });

  it("signature: false when acknowledged but not signed", () => {
    const plan: AdvanceCarePlan = {
      ...emptyPlan,
      signature: {
        acknowledgement1: true,
        acknowledgement2: true,
        acknowledgement3: true,
        acknowledgement4: true,
      },
    };
    expect(isSectionComplete(plan, "signature")).toBe(false);
  });
});
