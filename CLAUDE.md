# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Next.js 15 (App Router) web app that digitises the NZ "My Advance Care Plan" form. Users create, edit, and export advance care plans stored locally in IndexedDB. Multiple plans per device are supported. No backend — all data stays on-device.

## Commands

- `npm run dev` — dev server (binds 0.0.0.0 for LAN access)
- `npm run build` — production build
- `npm run lint` — ESLint (next/core-web-vitals)
- `npm test` — run all tests (Jest + jsdom)
- `npm test -- --watch` — watch mode
- `npm test -- path/to/file.test.ts` — run a single test file
- `npm run test:coverage` — run tests with coverage report

Tests live in `src/__tests__/` and match `**/__tests__/**/*.test.{ts,tsx}`. The `@/` path alias maps to `src/`. `fake-indexeddb` is used for storage tests.

## Architecture

**Routing:** Next.js App Router. All plan pages are under `/plans/[planId]/` with 10 section pages (personal-info, epa, care-contacts, will, personal-wishes, end-of-life, body-care, organ-donation, treatment-preferences, signature) plus an export page. The plan selector lives at `/`.

**Data flow:**
- `src/lib/schema.ts` — Zod schemas defining every section of `AdvanceCarePlan`, plus `emptyPlan`, `isSectionComplete()`, and `PLAN_SECTIONS`. This is the single source of truth for the plan data model.
- `src/lib/storage.ts` — IndexedDB layer (via `idb`). Two object stores: `plans` (keyed by UUID) and `history` (auto-increment, indexed by planId). Handles save/load/delete/export/import, version bumping, history trimming (last 5), and schema migration from v1 field names.
- `src/context/PlanContext.tsx` — `PlanProvider` wraps each plan's route subtree. Uses `useReducer` for state. Auto-saves with 1.5s debounce. Exposes `usePlan()` hook with plan data, status, updateSection, save, etc.
- `src/context/LanguageContext.tsx` — `LanguageProvider` at root. English + Chinese translations via `useLanguage()` / `t()` helper. Strings in `src/lib/translations.ts`.

**Layout nesting:** Root layout (`src/app/layout.tsx`) wraps with `LanguageProvider`. Plan layout (`src/app/plans/[planId]/layout.tsx`) unwraps async `params` with `React.use()` (Next.js 15 pattern), checks PIN lock, then wraps children in `PlanProvider`.

**Styling:** Inline styles throughout — no Tailwind or CSS modules. Only `globals.css` for base resets.

**Forms:** React Hook Form + Zod resolvers. Care Contacts and Treatment Preferences pages use 600ms debounced per-field `onBlur` saves (not form-level `onBlur`) to avoid focus loss during tab navigation. `useFieldArray` for dynamic rows.

**PDF generation:** `src/lib/generatePdf.ts` — client-side via `pdf-lib`. Uses Noto Sans from `/public/fonts/` (for Māori macrons) and built-in Helvetica for headings. 4-page layout mirroring the official paper form.

**PIN lock:** Optional per-plan PIN stored as a hash in localStorage (separate from IndexedDB). Components: `PinSetup`, `PinLockScreen`, `PinPad`.

## Key Patterns

- All section pages are `"use client"` components that call `usePlan()` for data and `updateSection()` to write back partial plan patches.
- Hydration guards: components that depend on IndexedDB render nothing until `mounted` state is true to prevent SSR/client mismatch.
- Auto-resizing textareas: height set programmatically on mount and input via `ref` callback; `resize: none` + `overflow: hidden`.
- `params` in layout/page components is a `Promise` — always unwrap with `React.use(params)`.
