/**
 * storage.ts
 * ----------
 * IndexedDB persistence layer — supports multiple plans per device.
 *
 * Each plan has a UUID. The DB stores:
 *   - plans   : { id, plan, savedAt }  keyed by UUID string
 *   - history : { id, planId, plan, savedAt, version }  auto-increment
 *
 * DB_VERSION 2 — upgraded from single-plan (v1) to multi-plan.
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import { AdvanceCarePlan, emptyPlan } from "@/lib/schema";

const DB_NAME    = "advance-care-plan";
const DB_VERSION = 2;
const STORE_PLANS   = "plans";
const STORE_HISTORY = "history";
const MAX_HISTORY   = 5;

// ---------------------------------------------------------------------------
// DB schema types
// ---------------------------------------------------------------------------

interface PlanRecord {
  id: string;
  plan: AdvanceCarePlan;
  savedAt: string;
}

interface HistoryRecord {
  id?: number;
  planId: string;
  plan: AdvanceCarePlan;
  savedAt: string;
  version: number;
}

interface AcpDB extends DBSchema {
  [STORE_PLANS]: { key: string; value: PlanRecord };
  [STORE_HISTORY]: {
    key: number;
    value: HistoryRecord;
    indexes: { "by-planId": string; "by-version": number };
  };
}

// ---------------------------------------------------------------------------
// DB init
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<AcpDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AcpDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available on the server"));
  }
  if (!dbPromise) {
    dbPromise = openDB<AcpDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          // Remove old stores from v1 if they exist
          if (db.objectStoreNames.contains("plan" as any)) {
            db.deleteObjectStore("plan" as any);
          }
          if (db.objectStoreNames.contains(STORE_HISTORY)) {
            db.deleteObjectStore(STORE_HISTORY);
          }
          if (!db.objectStoreNames.contains(STORE_PLANS)) {
            db.createObjectStore(STORE_PLANS, { keyPath: "id" });
          }
          const hs = db.createObjectStore(STORE_HISTORY, {
            keyPath: "id",
            autoIncrement: true,
          });
          hs.createIndex("by-planId", "planId");
          hs.createIndex("by-version", "version");
        }
      },
      blocked() {
        // Another tab has the old DB open — ask user to close other tabs
        console.warn("[storage] DB upgrade blocked by another tab. Please close other tabs and refresh.");
      },
      blocking() {
        // This tab is blocking another tab's upgrade — close our connection
        dbPromise = null;
      },
    }).catch(err => {
      // Reset so the next call can retry
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

// ---------------------------------------------------------------------------
// PIN lock — stored per plan in localStorage so it survives DB resets.
// We store a simple hash — sufficient for local device privacy.
// ---------------------------------------------------------------------------

function pinKey(planId: string): string {
  return `acp-pin-${planId}`;
}

function hashPin(pin: string): string {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = Math.imul(31, h) + pin.charCodeAt(i) | 0;
  }
  return h.toString(36);
}

export function getPinHash(planId: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(pinKey(planId));
}

export function setPinHash(planId: string, pin: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(pinKey(planId), hashPin(pin));
}

export function removePinHash(planId: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(pinKey(planId));
}

export function verifyPin(planId: string, pin: string): boolean {
  const stored = getPinHash(planId);
  if (!stored) return true; // no PIN — always unlocked
  return stored === hashPin(pin);
}

export function hasPinSet(planId: string): boolean {
  return getPinHash(planId) !== null;
}

/**
 * Nuclear option — delete the entire IndexedDB database.
 * Used by the settings page "Clear all data" and to recover from
 * a corrupt or blocked upgrade state.
 */
export async function clearAllData(): Promise<void> {
  dbPromise = null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
    req.onblocked = () => {
      // Force close any lingering connections then retry
      dbPromise = null;
      resolve(); // best-effort
    };
  });
}

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function getPlanDisplayName(plan: AdvanceCarePlan): string {
  const first = plan.personalInfo?.firstNames?.trim();
  const last  = plan.personalInfo?.surname?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return "Unnamed Plan";
}

// ---------------------------------------------------------------------------
// Schema migration
// ---------------------------------------------------------------------------

export function migratePlanShape(plan: any): AdvanceCarePlan {
  if (plan.epa && !Array.isArray(plan.epa?.attorneys)) {
    const old = plan.epa as any;
    const attorney = {
      firstNames:   old.firstNames   ?? "",
      lastName:     old.lastName     ?? "",
      relationship: old.relationship ?? "",
      address:      old.address      ?? "",
      phone:  old.phone ?? old.mobilePhone ?? old.homePhone ?? old.daytimePhone ?? "",
      email:        old.email        ?? "",
      type:         "personalCareAndWelfare" as const,
    };
    const hasData = attorney.firstNames || attorney.lastName;
    plan = { ...plan, epa: { attorneys: hasData ? [attorney] : [] } };
  }
  return plan as AdvanceCarePlan;
}

// ---------------------------------------------------------------------------
// Plan summary type (for the home screen list)
// ---------------------------------------------------------------------------

export interface PlanSummary {
  id: string;
  displayName: string;
  updatedAt?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// List all plans — newest first
// ---------------------------------------------------------------------------

export async function listPlans(): Promise<PlanSummary[]> {
  if (!isStorageAvailable()) return [];
  try {
    const db  = await getDB();
    const all = await db.getAll(STORE_PLANS);
    return all
      .sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1))
      .map(r => ({
        id:          r.id,
        displayName: getPlanDisplayName(r.plan),
        updatedAt:   r.plan.updatedAt,
        createdAt:   r.plan.createdAt,
      }));
  } catch (err) {
    console.error("[storage] listPlans:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Load a plan by ID
// ---------------------------------------------------------------------------

export async function loadPlanById(id: string): Promise<AdvanceCarePlan> {
  if (!isStorageAvailable()) return { ...emptyPlan, id };
  try {
    const db     = await getDB();
    const record = await db.get(STORE_PLANS, id);
    if (!record?.plan) return { ...emptyPlan, id };
    return migratePlanShape({ ...record.plan, id });
  } catch (err) {
    console.error("[storage] loadPlanById:", err);
    return { ...emptyPlan, id };
  }
}

// ---------------------------------------------------------------------------
// Create a new empty plan — returns the new ID
// ---------------------------------------------------------------------------

export async function createPlan(): Promise<string> {
  const id  = generateId();
  const now = new Date().toISOString();
  const plan: AdvanceCarePlan = { ...emptyPlan, id, createdAt: now, updatedAt: now, version: 1 };
  if (isStorageAvailable()) {
    const db = await getDB();
    await db.put(STORE_PLANS, { id, plan, savedAt: now });
  }
  return id;
}

// ---------------------------------------------------------------------------
// Save a plan — bumps version, snapshots history
// ---------------------------------------------------------------------------

export async function savePlanById(id: string, plan: AdvanceCarePlan): Promise<AdvanceCarePlan> {
  if (!isStorageAvailable()) return plan;
  const now     = new Date().toISOString();
  const version = (plan.version ?? 0) + 1;
  const updated = { ...plan, id, updatedAt: now, createdAt: plan.createdAt ?? now, version };
  try {
    const db = await getDB();
    const tx = db.transaction([STORE_PLANS, STORE_HISTORY], "readwrite");
    await tx.objectStore(STORE_PLANS).put({ id, plan: updated, savedAt: now });
    await tx.objectStore(STORE_HISTORY).add({ planId: id, plan: updated, savedAt: now, version });
    await tx.done;
    await trimHistory(id);
    return updated;
  } catch (err) {
    console.error("[storage] savePlanById:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Delete a plan and its history
// ---------------------------------------------------------------------------

export async function deletePlanById(id: string): Promise<void> {
  if (!isStorageAvailable()) return;
  try {
    const db = await getDB();
    let history: HistoryRecord[];
    try {
      history = await db.getAllFromIndex(STORE_HISTORY, "by-planId", id);
    } catch {
      const every = await db.getAll(STORE_HISTORY);
      history = every.filter(r => r.planId === id);
    }
    const tx = db.transaction([STORE_PLANS, STORE_HISTORY], "readwrite");
    await tx.objectStore(STORE_PLANS).delete(id);
    for (const h of history) {
      if (h.id !== undefined) await tx.objectStore(STORE_HISTORY).delete(h.id);
    }
    await tx.done;
  } catch (err) {
    console.error("[storage] deletePlanById:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// History for a specific plan
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  id: number;
  planId: string;
  savedAt: string;
  version: number;
  plan: AdvanceCarePlan;
}

export async function getPlanHistory(planId: string): Promise<HistoryEntry[]> {
  if (!isStorageAvailable()) return [];
  try {
    const db = await getDB();
    // Use index if available; fall back to full scan filtered in-memory
    let all: HistoryRecord[];
    try {
      all = await db.getAllFromIndex(STORE_HISTORY, "by-planId", planId);
    } catch {
      const every = await db.getAll(STORE_HISTORY);
      all = every.filter(r => r.planId === planId);
    }
    return (all as Required<HistoryRecord>[])
      .sort((a, b) => b.version - a.version)
      .map(r => ({ id: r.id, planId: r.planId, savedAt: r.savedAt, version: r.version, plan: r.plan }));
  } catch (err) {
    console.error("[storage] getPlanHistory:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Export plan as JSON
// ---------------------------------------------------------------------------

export async function exportPlanAsJson(id: string): Promise<void> {
  const plan = await loadPlanById(id);
  const name = getPlanDisplayName(plan).replace(/\s+/g, "-").toLowerCase();
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), {
    href:     url,
    download: `advance-care-plan-${name}-${new Date().toISOString().slice(0, 10)}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Import plan from JSON (always creates a new plan record)
// ---------------------------------------------------------------------------

export async function importPlanFromJson(file: File): Promise<AdvanceCarePlan> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const id     = generateId();
        const now    = new Date().toISOString();
        const plan   = migratePlanShape({ ...parsed, id, updatedAt: now, createdAt: parsed.createdAt ?? now });
        if (isStorageAvailable()) {
          const db = await getDB();
          await db.put(STORE_PLANS, { id, plan, savedAt: now });
        }
        resolve(plan);
      } catch {
        reject(new Error("Invalid plan file."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

// ---------------------------------------------------------------------------
// Internal: trim history to MAX_HISTORY per plan
// ---------------------------------------------------------------------------

async function trimHistory(planId: string): Promise<void> {
  try {
    const db = await getDB();
    let all: HistoryRecord[];
    try {
      all = await db.getAllFromIndex(STORE_HISTORY, "by-planId", planId);
    } catch {
      const every = await db.getAll(STORE_HISTORY);
      all = every.filter(r => r.planId === planId);
    }
    if (all.length <= MAX_HISTORY) return;
    const toDelete = (all as Required<HistoryRecord>[])
      .sort((a, b) => a.version - b.version)
      .slice(0, all.length - MAX_HISTORY);
    const tx = db.transaction(STORE_HISTORY, "readwrite");
    await Promise.all(toDelete.map(r => tx.store.delete(r.id)));
    await tx.done;
  } catch (err) {
    console.error("[storage] trimHistory:", err);
  }
}
