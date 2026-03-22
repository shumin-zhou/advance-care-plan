import React from "react";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "My Advance Care Plan",
  description: "Advance Care Planning — My Advance Care Plan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
