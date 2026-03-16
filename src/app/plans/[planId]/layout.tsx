"use client";

import { use } from "react";
import { PlanProvider } from "@/context/PlanContext";

export default function PlanLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ planId: string }>;
}) {
  const { planId } = use(params);

  return (
    <PlanProvider planId={planId}>
      {children}
    </PlanProvider>
  );
}
