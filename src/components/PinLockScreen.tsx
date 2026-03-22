"use client";
import React from "react";

/**
 * PinLockScreen.tsx
 * ------------------
 * Full-screen overlay shown when a plan has a PIN set and the user
 * hasn't yet unlocked it this session. Renders over the plan content.
 *
 * Usage (in plan-layout.tsx or plan home):
 *   <PinLockScreen planId={planId} onUnlock={() => setLocked(false)} />
 */

import { useState } from "react";
import Link from "next/link";
import { verifyPin } from "@/lib/storage";
import { useLanguage } from "@/context/LanguageContext";
import PinPad from "@/components/PinPad";

export default function PinLockScreen({
  planId,
  planName,
  onUnlock,
}: {
  planId: string;
  planName?: string;
  onUnlock: () => void;
}) {
  const { t } = useLanguage();
  const [error, setError] = useState("");

  function handlePin(pin: string) {
    if (verifyPin(planId, pin)) {
      setError("");
      onUnlock();
    } else {
      setError(t("pinError") as string);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        {planName && (
          <p style={{
            fontFamily: "system-ui, sans-serif", fontSize: "0.75rem",
            color: "#a8a29e", textAlign: "center", margin: "0 0 4px",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {planName}
          </p>
        )}

        <PinPad
          title={t("pinEnterTitle") as string}
          subtitle={t("pinEnterSubtitle") as string}
          error={error}
          onComplete={handlePin}
          topSlot={
            <p style={{
              fontFamily: "system-ui, sans-serif", fontSize: "0.72rem",
              color: "#a8a29e", margin: "10px 0 0", textAlign: "center",
              lineHeight: 1.5,
            }}>
              {t("pinForgotNote") as string}
            </p>
          }
        />

        {/* Back to all plans */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Link href="/" style={{
            fontFamily: "system-ui, sans-serif", fontSize: "0.78rem",
            color: "#a8a29e", textDecoration: "none",
          }}>
            ← {t("allPlans")}
          </Link>
        </div>
      </div>
    </div>
  );
}
