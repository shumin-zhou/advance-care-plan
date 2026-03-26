"use client";

import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fdf8f3 0%, #f5ede0 50%, #fdf8f3 100%)",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 20px 64px" }}>

        {/* Back link */}
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontFamily: "system-ui, sans-serif", fontSize: "0.8rem",
          color: "#a8a29e", textDecoration: "none", marginBottom: 32,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "block" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "Georgia, serif", fontSize: "1.8rem",
            fontWeight: 700, color: "#1c1917", margin: "0 0 8px",
          }}>
            Privacy Notice
          </h1>
          <p style={{
            fontFamily: "system-ui, sans-serif", fontSize: "0.82rem",
            color: "#a8a29e", margin: 0,
          }}>
            My Advance Care Plan — Last updated March 2026
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: "Who we are",
            body: `My Advance Care Plan is a tool that helps people in New Zealand record their advance care preferences digitally. It is provided as a personal planning tool and is not a registered health service or clinical provider.`,
          },
          {
            title: "What information this app handles",
            body: `The app may handle the following personal and health information that you choose to enter:

• Your name, date of birth, address, phone number, and email address
• Your NHI (National Health Index) number
• Names and contact details of your Enduring Power of Attorney and care decision contacts
• Your personal wishes, end-of-life preferences, and treatment preferences
• Your signature (captured as an image)

You are never required to complete any field. You choose what to enter.`,
          },
          {
            title: "Where your data is stored",
            body: `All data you enter is stored on your own device using your browser's local storage (IndexedDB). It is not sent to any server, cloud service, or third party.

Your data remains on your device unless you explicitly export it — by downloading a PDF, downloading a backup file, or sharing via your device's share sheet. Once exported, you are responsible for the security of those files.

If you clear your browser data or storage, your plan data will be deleted. We recommend keeping an exported backup in a safe location.`,
          },
          {
            title: "Cookies and tracking",
            body: `This app does not use cookies, analytics, advertising trackers, or any third-party monitoring tools. No data about your usage is collected or transmitted.`,
          },
          {
            title: "Sharing your plan",
            body: `You control when and how your plan is shared. The app provides tools to:

• Download a PDF to share with your healthcare provider or family
• Export a backup file for your own records
• Share via your device's native share sheet (on supported devices)

We do not send your plan to anyone on your behalf.`,
          },
          {
            title: "NZ Privacy Act 2020",
            body: `This app is designed to comply with the New Zealand Privacy Act 2020 and, to the extent applicable, the Health Information Privacy Code 2020 (HIPC).

Because your data is stored locally on your device and not transmitted to any server we operate, we do not hold your personal information in the legal sense — you do. You have full control over it at all times.`,
          },
          {
            title: "Legal standing of your plan",
            body: `A digitally completed advance care plan is a record of your preferences and wishes. It is not a legally binding document under New Zealand law without a hand-written signature witnessed by a health professional.

To give your plan the strongest possible standing, print the PDF, sign it by hand, and have it witnessed by a health professional such as your GP.`,
          },
          {
            title: "Children",
            body: `This app is intended for use by adults (18 years and over) or by a family member assisting an adult. It is not designed for or directed at children.`,
          },
          {
            title: "Changes to this notice",
            body: `We may update this privacy notice from time to time. The date at the top of this page will reflect the most recent revision. Continued use of the app after an update constitutes acceptance of the revised notice.`,
          },

        ].map(section => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <h2 style={{
              fontFamily: "Georgia, serif", fontSize: "1.1rem",
              fontWeight: 700, color: "#1c1917", margin: "0 0 8px",
            }}>
              {section.title}
            </h2>
            <p style={{
              fontFamily: "system-ui, sans-serif", fontSize: "0.875rem",
              color: "#57534e", margin: 0, lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}>
              {section.body}
            </p>
          </div>
        ))}

        {/* Attribution */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontFamily: "Georgia, serif", fontSize: "1.1rem",
            fontWeight: 700, color: "#1c1917", margin: "0 0 8px",
          }}>
            About this app
          </h2>
          <p style={{
            fontFamily: "system-ui, sans-serif", fontSize: "0.875rem",
            color: "#57534e", margin: 0, lineHeight: 1.8,
          }}>
            This app is adapted from the official New Zealand{" "}
            <a href="https://www.myacp.org.nz/" target="_blank" rel="noopener noreferrer"
              style={{ color: "#c0392b", textDecoration: "underline" }}>
              My Advance Care Plan (Tō Tātou Reo)
            </a>
            {" "}form, a programme of Health New Zealand | Te Whatu Ora. It is an independent digital tool and is not officially endorsed by or affiliated with Health New Zealand. The form structure, section content, and terminology are based on the official paper form available at{" "}
            <a href="https://www.myacp.org.nz/" target="_blank" rel="noopener noreferrer"
              style={{ color: "#c0392b", textDecoration: "underline" }}>
              myacp.org.nz
            </a>.
          </p>
        </div>

        {/* Footer rule */}
        <div style={{ borderTop: "1px solid #e7e5e4", paddingTop: 24, marginTop: 12 }}>
          <p style={{
            fontFamily: "system-ui, sans-serif", fontSize: "0.78rem",
            color: "#a8a29e", margin: 0, lineHeight: 1.6,
          }}>
            My Advance Care Plan is not a registered health service. It is a personal planning tool. Always discuss your advance care wishes with your doctor, family, and loved ones.
          </p>
        </div>

      </div>
    </div>
  );
}
