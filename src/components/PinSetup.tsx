"use client";

/**
 * PinSetup.tsx
 * -------------
 * Inline component embedded in the plan settings or plan home page
 * allowing the user to set, change, or remove the plan PIN.
 *
 * Usage:
 *   <PinSetup planId={planId} />
 */

import { useState } from "react";
import { hasPinSet, setPinHash, removePinHash, verifyPin } from "@/lib/storage";
import { useLanguage } from "@/context/LanguageContext";
import PinPad from "@/components/PinPad";

type Step =
  | "idle"          // showing Set/Change/Remove buttons
  | "enter-current" // verify current PIN before changing/removing
  | "enter-new"     // entering new PIN
  | "confirm-new";  // confirming new PIN

export default function PinSetup({ planId }: { planId: string }) {
  const { t } = useLanguage();
  const [pinSet, setPinSet] = useState(() => hasPinSet(planId));
  const [step, setStep] = useState<Step>("idle");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [removing, setRemoving] = useState(false);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setStep("idle");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  // ── Step handlers ──────────────────────────────────────────────────────

  function handleCurrentPin(pin: string) {
    if (!verifyPin(planId, pin)) {
      setError(t("pinError") as string);
      return;
    }
    setError("");
    if (removing) {
      removePinHash(planId);
      setPinSet(false);
      setRemoving(false);
      showSuccess(t("pinRemoved") as string);
    } else {
      setStep("enter-new");
    }
  }

  function handleNewPin(pin: string) {
    setNewPin(pin);
    setStep("confirm-new");
  }

  function handleConfirmPin(pin: string) {
    if (pin !== newPin) {
      setError(t("pinMismatch") as string);
      setStep("enter-new");
      setNewPin("");
      return;
    }
    setPinHash(planId, pin);
    setPinSet(true);
    setNewPin("");
    showSuccess(t("pinSuccess") as string);
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (step === "enter-current") {
    return (
      <PinPad
        title={t("pinCurrentLabel") as string}
        error={error}
        onComplete={handleCurrentPin}
        topSlot={
          <button type="button" onClick={() => { setStep("idle"); setError(""); setRemoving(false); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#a8a29e", marginTop: 8 }}>
            ← {t("pinSkipButton")}
          </button>
        }
      />
    );
  }

  if (step === "enter-new") {
    return (
      <PinPad
        title={t("pinNewLabel") as string}
        error={error}
        onComplete={handleNewPin}
        topSlot={
          <button type="button" onClick={() => { setStep("idle"); setError(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#a8a29e", marginTop: 8 }}>
            ← {t("pinSkipButton")}
          </button>
        }
      />
    );
  }

  if (step === "confirm-new") {
    return (
      <PinPad
        title={t("pinConfirmLabel") as string}
        error={error}
        onComplete={handleConfirmPin}
        topSlot={
          <button type="button" onClick={() => { setStep("enter-new"); setError(""); setNewPin(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "system-ui, sans-serif", fontSize: "0.78rem", color: "#a8a29e", marginTop: 8 }}>
            ← {t("pinSkipButton")}
          </button>
        }
      />
    );
  }

  // ── Idle state — show buttons ───────────────────────────────────────────

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Status badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 20,
          background: pinSet ? "rgba(192,57,43,0.08)" : "#f5f5f4",
          border: `1px solid ${pinSet ? "rgba(192,57,43,0.2)" : "#e7e5e4"}`,
        }}>
          <span style={{ fontSize: "0.85rem" }}>{pinSet ? "🔒" : "🔓"}</span>
          <span style={{
            fontFamily: "system-ui, sans-serif", fontSize: "0.75rem", fontWeight: 600,
            color: pinSet ? "#c0392b" : "#a8a29e",
          }}>
            {pinSet ? t("pinProtected") : t("pinSetTitle")}
          </span>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <p style={{
          fontFamily: "system-ui, sans-serif", fontSize: "0.78rem",
          color: "#16a34a", margin: "0 0 12px", fontWeight: 600,
        }}>
          ✓ {successMsg}
        </p>
      )}

      {/* Forgot note */}
      <p style={{
        fontFamily: "system-ui, sans-serif", fontSize: "0.72rem",
        color: "#a8a29e", margin: "0 0 16px", lineHeight: 1.5,
      }}>
        {t("pinForgotNote")}
      </p>

      {/* Action buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {!pinSet ? (
          <button
            type="button"
            onClick={() => { setStep("enter-new"); setError(""); }}
            style={{
              padding: "12px 20px", borderRadius: 12,
              border: "1.5px solid #c0392b",
              background: "rgba(192,57,43,0.06)",
              fontFamily: "system-ui, sans-serif", fontSize: "0.875rem",
              fontWeight: 600, color: "#c0392b", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            🔒 {t("pinSetButton")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setRemoving(false); setStep("enter-current"); setError(""); }}
              style={{
                padding: "12px 20px", borderRadius: 12,
                border: "1.5px solid #c0392b",
                background: "rgba(192,57,43,0.06)",
                fontFamily: "system-ui, sans-serif", fontSize: "0.875rem",
                fontWeight: 600, color: "#c0392b", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              🔑 {t("pinChangeButton")}
            </button>
            <button
              type="button"
              onClick={() => { setRemoving(true); setStep("enter-current"); setError(""); }}
              style={{
                padding: "12px 20px", borderRadius: 12,
                border: "1.5px solid #e7e5e4",
                background: "#fff",
                fontFamily: "system-ui, sans-serif", fontSize: "0.875rem",
                fontWeight: 600, color: "#78716c", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              🔓 {t("pinRemoveButton")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
