/**
 * jest.setup.ts
 * Run before each test file. Extends Jest matchers and sets up globals.
 */
import "@testing-library/jest-dom";

// Polyfill structuredClone for Node < 17 / jsdom environments
// idb uses structuredClone internally when storing data
if (typeof globalThis.structuredClone === "undefined") {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}
