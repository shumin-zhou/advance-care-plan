import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

const optionalString = z.string().optional();
const requiredString = (field: string) =>
  z.string().min(1, { message: `${field} is required` });

// ---------------------------------------------------------------------------
// 3.2 Personal Information
// ---------------------------------------------------------------------------

export const personalInfoSchema = z.object({
  surname: requiredString("Surname"),
  firstNames: requiredString("First name(s)"),
  nhiNumber: optionalString,
  dateOfBirth: z.string().optional(), // ISO date string "YYYY-MM-DD"
  address: optionalString,
  phone: optionalString,
  mobile: optionalString,
});

export type PersonalInfo = z.infer<typeof personalInfoSchema>;

// ---------------------------------------------------------------------------
// 3.3 Enduring Power of Attorney
// ---------------------------------------------------------------------------

export const EPA_TYPES = ["personalCareAndWelfare", "property"] as const;
export type EPAType = typeof EPA_TYPES[number];

export const EPA_TYPE_LABELS: Record<EPAType, string> = {
  personalCareAndWelfare: "Personal Care and Welfare",
  property: "Property",
};

export const epaPersonSchema = z.object({
  firstNames: optionalString,
  lastName: optionalString,
  relationship: optionalString,
  address: optionalString,
  homePhone: optionalString,
  mobilePhone: optionalString,
  email: optionalString,
  type: z.enum(["personalCareAndWelfare", "property"]).default("personalCareAndWelfare"),
});

export type EPAPerson = z.infer<typeof epaPersonSchema>;

export const epaSchema = z.object({
  attorneys: z.array(epaPersonSchema).default([]),
});

export type EPA = z.infer<typeof epaSchema>;

// ---------------------------------------------------------------------------
// 3.4 People to Include in Care Decisions
// ---------------------------------------------------------------------------

export const careContactSchema = z.object({
  firstName: optionalString,
  lastName: optionalString,
  relationship: optionalString,
  phone: optionalString,
  email: optionalString,
});

export type CareContact = z.infer<typeof careContactSchema>;

export const careContactsSchema = z.object({
  contacts: z.array(careContactSchema).max(4),
});

export type CareContacts = z.infer<typeof careContactsSchema>;

// ---------------------------------------------------------------------------
// 3.5 Will
// ---------------------------------------------------------------------------

export const willSchema = z.object({
  hasMadeWill: z.enum(["yes", "no"]).optional(),
  heldBy: optionalString,
});

export type Will = z.infer<typeof willSchema>;

// ---------------------------------------------------------------------------
// 3.6 Personal Wishes
// ---------------------------------------------------------------------------

export const personalWishesSchema = z.object({
  importantToMe: optionalString,
  meaningfulToMe: optionalString,
  familyAndFriendsMessage: optionalString,
});

export type PersonalWishes = z.infer<typeof personalWishesSchema>;

// ---------------------------------------------------------------------------
// 3.7 End-of-Life Preferences
// ---------------------------------------------------------------------------

export const dyingPreferenceItemSchema = z.enum([
  "keepComfortable",
  "removeTubes",
  "familyPresent",
  "offerFoodAndDrink",
  "stopMedications",
  "spiritualNeeds",
  "other",
]);

export type DyingPreferenceItem = z.infer<typeof dyingPreferenceItemSchema>;

export const placeOfDeathSchema = z.enum([
  "atHome",
  "inHospice",
  "inHospital",
  "other",
]);

export type PlaceOfDeath = z.infer<typeof placeOfDeathSchema>;

export const endOfLifePreferencesSchema = z.object({
  dyingPreferences: z.array(dyingPreferenceItemSchema).optional(),
  dyingPreferencesOther: optionalString,
  placeOfDeathImportant: z.enum(["yes", "no"]).optional(),
  placeOfDeath: placeOfDeathSchema.optional(),
  placeOfDeathAtHomeAddress: optionalString,
  placeOfDeathOther: optionalString,
});

export type EndOfLifePreferences = z.infer<typeof endOfLifePreferencesSchema>;

// ---------------------------------------------------------------------------
// 3.8 Body Care & Funeral Wishes
// ---------------------------------------------------------------------------

export const bodyCareFuneralSchema = z.object({
  burialPreference: z.enum(["buried", "cremated"]).optional(),
  funeralWishes: optionalString,
});

export type BodyCareFuneral = z.infer<typeof bodyCareFuneralSchema>;

// ---------------------------------------------------------------------------
// 3.9 Organ Donation
// ---------------------------------------------------------------------------

export const organDonationSchema = z.object({
  willingToDonate: z.enum(["yes", "no"]).optional(),
  comments: optionalString,
});

export type OrganDonation = z.infer<typeof organDonationSchema>;

// ---------------------------------------------------------------------------
// 3.10 Specific Treatment and Care Preferences
// ---------------------------------------------------------------------------

export const treatmentPreferenceRowSchema = z.object({
  wouldOrWouldNotWant: optionalString,
  inTheseCircumstances: optionalString,
});

export type TreatmentPreferenceRow = z.infer<typeof treatmentPreferenceRowSchema>;

export const treatmentPreferencesSchema = z.object({
  rows: z.array(treatmentPreferenceRowSchema).max(10),
});

export type TreatmentPreferences = z.infer<typeof treatmentPreferencesSchema>;

// ---------------------------------------------------------------------------
// 3.11 Signature & Acknowledgement
// ---------------------------------------------------------------------------

export const signatureSchema = z.object({
  // Stored as base64 data URL from the canvas
  userSignatureDataUrl: optionalString,
  userSignatureDate: optionalString, // ISO date string

  // All 4 acknowledgements must be true before the form can be submitted
  acknowledgement1: z.boolean().default(false),
  acknowledgement2: z.boolean().default(false),
  acknowledgement3: z.boolean().default(false),
  acknowledgement4: z.boolean().default(false),

  // Witness (Health Professional)
  witnessSignatureDataUrl: optionalString,
  witnessSignatureDate: optionalString,
  witnessFirstNames: optionalString,
  witnessLastName: optionalString,
  witnessDesignation: optionalString,
  witnessEmail: optionalString,
});

export type Signature = z.infer<typeof signatureSchema>;

// Refinement: all acknowledgements must be checked to submit
export const signatureSubmitSchema = signatureSchema.refine(
  (data) =>
    data.acknowledgement1 &&
    data.acknowledgement2 &&
    data.acknowledgement3 &&
    data.acknowledgement4,
  {
    message: "All acknowledgements must be accepted before signing",
    path: ["acknowledgement1"],
  }
);

// ---------------------------------------------------------------------------
// Full Plan schema — composes all sections
// ---------------------------------------------------------------------------

export const advanceCarePlanSchema = z.object({
  // Meta
  id: z.string().uuid().optional(),              // undefined until first save
  createdAt: z.string().optional(),              // ISO datetime
  updatedAt: z.string().optional(),              // ISO datetime
  version: z.number().int().nonnegative().default(1),

  // Sections
  personalInfo: personalInfoSchema,
  epa: epaSchema,
  careContacts: careContactsSchema,
  will: willSchema,
  personalWishes: personalWishesSchema,
  endOfLifePreferences: endOfLifePreferencesSchema,
  bodyCareFuneral: bodyCareFuneralSchema,
  organDonation: organDonationSchema,
  treatmentPreferences: treatmentPreferencesSchema,
  signature: signatureSchema,
});

export type AdvanceCarePlan = z.infer<typeof advanceCarePlanSchema>;

// ---------------------------------------------------------------------------
// Default / empty plan — use this to initialise a new form
// ---------------------------------------------------------------------------

export const emptyPlan: AdvanceCarePlan = {
  version: 1,
  personalInfo: {
    surname: "",
    firstNames: "",
  },
  epa: { attorneys: [] },
  careContacts: {
    contacts: [{}, {}, {}, {}],
  },
  will: {},
  personalWishes: {},
  endOfLifePreferences: {
    dyingPreferences: [],
  },
  bodyCareFuneral: {},
  organDonation: {},
  treatmentPreferences: {
    rows: [{}],
  },
  signature: {
    acknowledgement1: false,
    acknowledgement2: false,
    acknowledgement3: false,
    acknowledgement4: false,
  },
};

// ---------------------------------------------------------------------------
// Section completion helpers
// — useful for the progress indicator on the home screen
// ---------------------------------------------------------------------------

export function isSectionComplete(plan: AdvanceCarePlan, section: keyof AdvanceCarePlan): boolean {
  switch (section) {
    case "personalInfo":
      return !!(plan.personalInfo.surname && plan.personalInfo.firstNames);
    case "epa":
      return (plan.epa?.attorneys?.length ?? 0) > 0 && !!(plan.epa.attorneys[0].firstNames || plan.epa.attorneys[0].lastName);
    case "careContacts":
      return plan.careContacts.contacts.some((c) => c.firstName || c.lastName);
    case "will":
      return plan.will.hasMadeWill !== undefined;
    case "personalWishes":
      return !!(
        plan.personalWishes.importantToMe ||
        plan.personalWishes.meaningfulToMe ||
        plan.personalWishes.familyAndFriendsMessage
      );
    case "endOfLifePreferences":
      return !!(
        plan.endOfLifePreferences.dyingPreferences?.length ||
        plan.endOfLifePreferences.placeOfDeathImportant
      );
    case "bodyCareFuneral":
      return plan.bodyCareFuneral.burialPreference !== undefined;
    case "organDonation":
      return plan.organDonation.willingToDonate !== undefined;
    case "treatmentPreferences":
      return plan.treatmentPreferences.rows.some(
        (r) => r.wouldOrWouldNotWant || r.inTheseCircumstances
      );
    case "signature":
      return !!(
        plan.signature.userSignatureDataUrl &&
        plan.signature.acknowledgement1 &&
        plan.signature.acknowledgement2 &&
        plan.signature.acknowledgement3 &&
        plan.signature.acknowledgement4
      );
    default:
      return false;
  }
}

export const PLAN_SECTIONS: { key: keyof AdvanceCarePlan; label: string }[] = [
  { key: "personalInfo",          label: "Personal Information" },
  { key: "epa",                   label: "Power of Attorney" },
  { key: "careContacts",          label: "Care Decision Contacts" },
  { key: "will",                  label: "Will" },
  { key: "personalWishes",        label: "Personal Wishes" },
  { key: "endOfLifePreferences",  label: "End-of-Life Preferences" },
  { key: "bodyCareFuneral",       label: "Body Care & Funeral" },
  { key: "organDonation",         label: "Organ Donation" },
  { key: "treatmentPreferences",  label: "Treatment Preferences" },
  { key: "signature",             label: "Signature" },
];
