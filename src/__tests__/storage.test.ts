/**
 * __tests__/storage.test.ts
 *
 * Tests for the IndexedDB storage layer.
 * Uses fake-indexeddb to run without a real browser.
 */

import "fake-indexeddb/auto";
import {
  createPlan,
  loadPlanById,
  savePlanById,
  listPlans,
  deletePlanById,
  getPlanHistory,
  isStorageAvailable,
  migratePlanShape,
} from "@/lib/storage";
import { emptyPlan } from "@/lib/schema";

// ---------------------------------------------------------------------------
// isStorageAvailable
// ---------------------------------------------------------------------------

describe("isStorageAvailable", () => {
  it("returns true in jsdom environment (indexedDB is present)", () => {
    expect(isStorageAvailable()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// migratePlanShape
// ---------------------------------------------------------------------------

describe("migratePlanShape", () => {
  it("passes through a plan that already has attorneys array", () => {
    const plan = {
      ...emptyPlan,
      epa: { attorneys: [{ firstNames: "John", lastName: "Smith", type: "personalCareAndWelfare" }] },
    };
    const result = migratePlanShape(plan);
    expect(result.epa.attorneys).toHaveLength(1);
    expect(result.epa.attorneys[0].firstNames).toBe("John");
  });

  it("migrates legacy single-object epa to attorneys array", () => {
    const legacyPlan = {
      ...emptyPlan,
      epa: {
        firstNames: "Jane",
        lastName: "Doe",
        mobilePhone: "021 111 222",
        homePhone: "06 333 444",
      } as any,
    };
    const result = migratePlanShape(legacyPlan);
    expect(Array.isArray(result.epa.attorneys)).toBe(true);
    expect(result.epa.attorneys[0].firstNames).toBe("Jane");
    expect(result.epa.attorneys[0].lastName).toBe("Doe");
  });

  it("produces empty attorneys array when legacy epa had no name", () => {
    const legacyPlan = {
      ...emptyPlan,
      epa: { mobilePhone: "021 111 222" } as any,
    };
    const result = migratePlanShape(legacyPlan);
    expect(result.epa.attorneys).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// createPlan / loadPlanById
// ---------------------------------------------------------------------------

describe("createPlan / loadPlanById", () => {
  it("creates a plan and loads it back by ID", async () => {
    const id = await createPlan();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    const loaded = await loadPlanById(id);
    expect(loaded.id).toBe(id);
  });

  it("returns empty plan with correct ID for unknown ID", async () => {
    const loaded = await loadPlanById("non-existent-uuid");
    expect(loaded.id).toBe("non-existent-uuid");
    expect(loaded.personalInfo?.surname).toBe("");
  });

  it("creates unique IDs for each plan", async () => {
    const id1 = await createPlan();
    const id2 = await createPlan();
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// savePlanById
// ---------------------------------------------------------------------------

describe("savePlanById", () => {
  it("saves plan and increments version", async () => {
    const id = await createPlan();
    const plan = await loadPlanById(id);
    const initialVersion = plan.version ?? 1;

    const updated = await savePlanById(id, {
      ...plan,
      personalInfo: { ...plan.personalInfo, surname: "Smith", firstNames: "Jane" },
    });

    expect(updated.version).toBe(initialVersion + 1);
    expect(updated.personalInfo.surname).toBe("Smith");
  });

  it("persists changes so they can be loaded back", async () => {
    const id = await createPlan();
    const plan = await loadPlanById(id);

    await savePlanById(id, {
      ...plan,
      personalInfo: { ...plan.personalInfo, surname: "Jones", firstNames: "Bob" },
    });

    const reloaded = await loadPlanById(id);
    expect(reloaded.personalInfo.surname).toBe("Jones");
    expect(reloaded.personalInfo.firstNames).toBe("Bob");
  });

  it("sets updatedAt timestamp", async () => {
    const id = await createPlan();
    const plan = await loadPlanById(id);
    const before = Date.now();

    const updated = await savePlanById(id, plan);
    const after = Date.now();

    const updatedAt = new Date(updated.updatedAt!).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });
});

// ---------------------------------------------------------------------------
// listPlans
// ---------------------------------------------------------------------------

describe("listPlans", () => {
  it("returns all created plans", async () => {
    // Clear state by using unique IDs; list may have plans from earlier tests
    const before = (await listPlans()).length;
    await createPlan();
    await createPlan();
    const after = await listPlans();
    expect(after.length).toBe(before + 2);
  });

  it("returns display name from personalInfo when available", async () => {
    const id = await createPlan();
    const plan = await loadPlanById(id);
    await savePlanById(id, {
      ...plan,
      personalInfo: { ...plan.personalInfo, firstNames: "Alice", surname: "Wong" },
    });

    const plans = await listPlans();
    const found = plans.find(p => p.id === id);
    expect(found?.displayName).toBe("Alice Wong");
  });

  it("returns 'Unnamed Plan' display name when personalInfo is empty", async () => {
    const id = await createPlan();
    const plans = await listPlans();
    const found = plans.find(p => p.id === id);
    expect(found?.displayName).toBe("Unnamed Plan");
  });

  it("sorts by most recently saved first", async () => {
    const id1 = await createPlan();
    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 10));
    const id2 = await createPlan();

    const plans = await listPlans();
    const idx1 = plans.findIndex(p => p.id === id1);
    const idx2 = plans.findIndex(p => p.id === id2);
    expect(idx2).toBeLessThan(idx1); // id2 is newer, should appear first
  });
});

// ---------------------------------------------------------------------------
// deletePlanById
// ---------------------------------------------------------------------------

describe("deletePlanById", () => {
  it("removes the plan from the list", async () => {
    const id = await createPlan();
    const before = await listPlans();
    expect(before.some(p => p.id === id)).toBe(true);

    await deletePlanById(id);

    const after = await listPlans();
    expect(after.some(p => p.id === id)).toBe(false);
  });

  it("does not throw when deleting a non-existent plan", async () => {
    await expect(deletePlanById("does-not-exist")).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getPlanHistory
// ---------------------------------------------------------------------------

describe("getPlanHistory", () => {
  it("records a history entry on each save", async () => {
    const id = await createPlan();
    const plan = await loadPlanById(id);

    await savePlanById(id, plan);
    await savePlanById(id, plan);
    await savePlanById(id, plan);

    const history = await getPlanHistory(id);
    expect(history.length).toBeGreaterThanOrEqual(3);
  });

  it("returns history sorted newest first", async () => {
    const id = await createPlan();
    const plan = await loadPlanById(id);

    await savePlanById(id, plan);
    await savePlanById(id, plan);

    const history = await getPlanHistory(id);
    for (let i = 0; i < history.length - 1; i++) {
      expect(history[i].version).toBeGreaterThanOrEqual(history[i + 1].version);
    }
  });

  it("only returns history for the specified plan", async () => {
    const id1 = await createPlan();
    const id2 = await createPlan();
    const plan1 = await loadPlanById(id1);
    const plan2 = await loadPlanById(id2);

    await savePlanById(id1, plan1);
    await savePlanById(id2, plan2);

    const history1 = await getPlanHistory(id1);
    expect(history1.every(h => h.planId === id1)).toBe(true);
  });

  it("returns empty array for plan with no saves", async () => {
    const history = await getPlanHistory("plan-with-no-history");
    expect(history).toEqual([]);
  });
});
