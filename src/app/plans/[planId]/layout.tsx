"use client";

export const dynamic = "force-dynamic";
import React from "react";

import { use, useState, useEffect } from "react";
import { PlanProvider } from "@/context/PlanContext";
import { hasPinSet, loadPlanById } from "@/lib/storage";
import PinLockScreen from "@/components/PinLockScreen";

export default function PlanLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);
  const [locked, setLocked] = useState(false);
  const [planName, setPlanName] = useState<string | undefined>();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const needsPin = hasPinSet(planId);
      if (needsPin) {
        // Load plan name for display on lock screen
        try {
          const plan = await loadPlanById(planId);
          const name = plan.personalInfo?.firstNames
            ? `${plan.personalInfo.firstNames}${plan.personalInfo.surname ? " " + plan.personalInfo.surname : ""}`
            : undefined;
          setPlanName(name);
        } catch {}
        setLocked(true);
      }
      setChecking(false);
    }
    check();
  }, [planId]);

  if (checking) return null;

  if (locked) {
    return (
      <PinLockScreen
        planId={planId}
        planName={planName}
        onUnlock={() => setLocked(false)}
      />
    );
  }

  return (
    <PlanProvider planId={planId}>
      {children}
    </PlanProvider>
  );
}
