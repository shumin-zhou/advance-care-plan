"use client";

/**
 * PlanContext.tsx
 * ---------------
 * React context for a single Advance Care Plan identified by planId.
 *
 * Wrap each plan's route subtree with:
 *   <PlanProvider planId={params.planId}>
 *     {children}
 *   </PlanProvider>
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  ReactNode,
} from "react";

import {
  AdvanceCarePlan,
  emptyPlan,
  PLAN_SECTIONS,
  isSectionComplete,
} from "@/lib/schema";

import {
  loadPlanById,
  savePlanById,
  deletePlanById,
  getPlanHistory,
  exportPlanAsJson,
  importPlanFromJson,
  HistoryEntry,
} from "@/lib/storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlanStatus = "idle" | "loading" | "saving" | "error";

interface PlanState {
  plan: AdvanceCarePlan;
  status: PlanStatus;
  errorMessage: string | null;
  history: HistoryEntry[];
  isDirty: boolean;
}

type PlanAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; plan: AdvanceCarePlan; history: HistoryEntry[] }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "UPDATE_SECTION"; patch: Partial<AdvanceCarePlan> }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; plan: AdvanceCarePlan; history: HistoryEntry[] }
  | { type: "SAVE_ERROR"; message: string }
  | { type: "DELETE_SUCCESS" }
  | { type: "CLEAR_ERROR" };

function reducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case "LOAD_START":    return { ...state, status: "loading", errorMessage: null };
    case "LOAD_SUCCESS":  return { ...state, status: "idle", plan: action.plan, history: action.history, isDirty: false };
    case "LOAD_ERROR":    return { ...state, status: "error", errorMessage: action.message };
    case "UPDATE_SECTION":return { ...state, plan: { ...state.plan, ...action.patch }, isDirty: true };
    case "SAVE_START":    return { ...state, status: "saving", errorMessage: null };
    case "SAVE_SUCCESS":  return { ...state, status: "idle", plan: action.plan, history: action.history, isDirty: false };
    case "SAVE_ERROR":    return { ...state, status: "error", errorMessage: action.message };
    case "DELETE_SUCCESS":return { ...state, status: "idle", plan: emptyPlan, history: [], isDirty: false };
    case "CLEAR_ERROR":   return { ...state, status: "idle", errorMessage: null };
    default: return state;
  }
}

const initialState: PlanState = {
  plan: emptyPlan, status: "idle", errorMessage: null, history: [], isDirty: false,
};

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface PlanContextValue {
  planId: string;
  plan: AdvanceCarePlan;
  status: PlanStatus;
  errorMessage: string | null;
  history: HistoryEntry[];
  isDirty: boolean;
  completionPercentage: number;
  isSectionComplete: (section: keyof AdvanceCarePlan) => boolean;
  updateSection: (patch: Partial<AdvanceCarePlan>) => void;
  save: () => Promise<void>;
  deletePlan: () => Promise<void>;
  exportJson: () => Promise<void>;
  importJson: (file: File) => Promise<void>;
  clearError: () => void;
}

const PlanContext = createContext<PlanContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PlanProviderProps {
  planId: string;
  children: ReactNode;
  autoSaveDelay?: number;
}

export function PlanProvider({ planId, children, autoSaveDelay = 1500 }: PlanProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [mounted, setMounted] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref to current plan for use in callbacks without stale closures
  const planRef = useRef<AdvanceCarePlan>(state.plan);
  planRef.current = state.plan;

  // ── Load on mount / planId change ──────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    async function init() {
      dispatch({ type: "LOAD_START" });
      try {
        const [plan, history] = await Promise.all([
          loadPlanById(planId),
          getPlanHistory(planId),
        ]);
        dispatch({ type: "LOAD_SUCCESS", plan, history });
      } catch {
        dispatch({ type: "LOAD_ERROR", message: "Failed to load plan. Please refresh." });
      }
    }
    init();
  }, [planId]);

  // ── Auto-save on change ─────────────────────────────────────────────────
  useEffect(() => {
    if (!state.isDirty || autoSaveDelay === 0) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => save(), autoSaveDelay);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.plan, state.isDirty]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const updateSection = useCallback((patch: Partial<AdvanceCarePlan>) => {
    dispatch({ type: "UPDATE_SECTION", patch });
  }, []);

  const save = useCallback(async () => {
    dispatch({ type: "SAVE_START" });
    try {
      const updated = await savePlanById(planId, planRef.current);
      const history = await getPlanHistory(planId);
      dispatch({ type: "SAVE_SUCCESS", plan: updated, history });
    } catch {
      dispatch({ type: "SAVE_ERROR", message: "Failed to save. Please try again." });
    }
  }, [planId]);

  const deletePlan = useCallback(async () => {
    try {
      await deletePlanById(planId);
      dispatch({ type: "DELETE_SUCCESS" });
    } catch {
      dispatch({ type: "SAVE_ERROR", message: "Failed to delete plan." });
    }
  }, [planId]);

  const exportJson = useCallback(async () => {
    await exportPlanAsJson(planId);
  }, [planId]);

  const importJson = useCallback(async (file: File) => {
    dispatch({ type: "SAVE_START" });
    try {
      const imported = await importPlanFromJson(file);
      const history  = await getPlanHistory(imported.id!);
      dispatch({ type: "SAVE_SUCCESS", plan: imported, history });
    } catch (err: any) {
      dispatch({ type: "SAVE_ERROR", message: err?.message ?? "Failed to import." });
    }
  }, []);

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);

  // ── Derived ─────────────────────────────────────────────────────────────

  const sectionKeys = PLAN_SECTIONS
    .map(s => s.key)
    .filter((k): k is keyof AdvanceCarePlan =>
      !["id", "version", "createdAt", "updatedAt"].includes(k)
    );

  const completedCount        = sectionKeys.filter(k => isSectionComplete(state.plan, k)).length;
  const completionPercentage  = Math.round((completedCount / sectionKeys.length) * 100);
  const isSectionCompleteFn   = useCallback(
    (s: keyof AdvanceCarePlan) => isSectionComplete(state.plan, s),
    [state.plan]
  );

  const value: PlanContextValue = {
    planId,
    plan: state.plan,
    status: state.status,
    errorMessage: state.errorMessage,
    history: state.history,
    isDirty: state.isDirty,
    completionPercentage,
    isSectionComplete: isSectionCompleteFn,
    updateSection,
    save,
    deletePlan,
    exportJson,
    importJson,
    clearError,
  };

  // Don't render children until mounted — avoids server/client hydration mismatch
  // since IndexedDB is only available in the browser
  if (!mounted) return null;

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan must be used inside <PlanProvider>");
  return ctx;
}
