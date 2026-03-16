"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listPlans, createPlan, deletePlanById, importPlanFromJson, PlanSummary } from "@/lib/storage";

function formatDate(iso?: string): string {
  if (!iso) return "Not yet saved";
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function PlanCard({ plan, onDelete }: { plan: PlanSummary; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e7e5e4", overflow: "hidden", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>

      <Link href={`/plans/${plan.id}`} style={{ display: "block", padding: "18px 18px 14px", textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(192,57,43,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
            📋
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 700, color: "#1c1917", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {plan.displayName}
            </p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", margin: 0 }}>
              Last updated {formatDate(plan.updatedAt)}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block", flexShrink: 0, color: "#d4d4d0", marginTop: 2 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>

      {/* Card footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderTop: "1px solid #f5f5f4" }}>
        <Link href={`/plans/${plan.id}/export`} style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#78716c", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export PDF
        </Link>

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#a8a29e", padding: 0 }}>
            Delete
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#c0392b" }}>Delete this plan?</span>
            <button onClick={() => onDelete(plan.id)}
              style={{ background: "#c0392b", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", fontWeight: 700, color: "#fff", padding: "3px 8px", borderRadius: 6 }}>
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ background: "none", border: "1px solid #e7e5e4", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.72rem", color: "#78716c", padding: "3px 8px", borderRadius: 6 }}>
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [plans, setPlans]         = useState<PlanSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => {
    listPlans().then(p => { setPlans(p); setLoading(false); });
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const id = await createPlan();
      router.push(`/plans/${id}/personal-info`);
    } catch {
      setError("Failed to create plan. Please try again.");
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePlanById(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch {
      setError("Failed to delete plan.");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const plan = await importPlanFromJson(file);
      router.push(`/plans/${plan.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to import plan.");
      setImporting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)" }}>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px 48px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#a8a29e", margin: "0 0 4px" }}>
            Our Voice · Tō Tātou Reo
          </p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "#1c1917", margin: 0, lineHeight: 1.2 }}>
            Advance Care Plans
          </h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: "8px 0 0", lineHeight: 1.5 }}>
            Each person's plan is stored separately on this device.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fff8f7", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#c0392b", display: "flex", justifyContent: "space-between" }}>
            {error}
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", padding: 0 }}>✕</button>
          </div>
        )}

        {/* Plan list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#a8a29e" }}>
            Loading plans…
          </div>
        ) : plans.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, border: "1.5px dashed #e7e5e4", padding: "36px 24px", textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📋</div>
            <p style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: 600, color: "#1c1917", margin: "0 0 6px" }}>
              No plans yet
            </p>
            <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.85rem", color: "#78716c", margin: "0 0 20px", lineHeight: 1.5 }}>
              Create a plan for yourself or someone you're helping.
            </p>
            <button onClick={handleCreate} disabled={creating}
              style={{ padding: "11px 24px", borderRadius: 10, background: "#c0392b", border: "none", cursor: creating ? "not-allowed" : "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>
              {creating ? "Creating…" : "+ Create first plan"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Actions */}
        {plans.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleCreate} disabled={creating}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 20px", borderRadius: 12, background: "#c0392b", border: "none", cursor: creating ? "not-allowed" : "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: "block" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              {creating ? "Creating…" : "Create new plan"}
            </button>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px 20px", borderRadius: 12, background: "#fff", border: "1.5px solid #e7e5e4", cursor: importing ? "not-allowed" : "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.9rem", fontWeight: 600, color: "#78716c", boxSizing: "border-box" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              {importing ? "Importing…" : "Import backup (.json)"}
              <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </label>
          </div>
        )}

        {/* Import on empty state */}
        {plans.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <label style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.8rem", color: "#a8a29e", cursor: "pointer", textDecoration: "underline" }}>
              Import from backup file
              <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
            </label>
          </div>
        )}

        {/* Privacy note */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#f5f5f4", borderRadius: 10, padding: "12px 14px", marginTop: 24 }}>
          <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>🔒</span>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", color: "#78716c", margin: 0, lineHeight: 1.5 }}>
            All plans are stored locally on this device. Nothing is sent to any server unless you create an account.
          </p>
        </div>
      </div>
    </div>
  );
}
