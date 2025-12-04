import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Automatyczne czyszczenie po każdym teście
afterEach(() => {
  cleanup();
});

// Mock dla environment variables
vi.stubGlobal("import.meta", {
  env: {
    SUPABASE_URL: "http://localhost:54321",
    SUPABASE_KEY: "test-key",
  },
});

// Mock dla Astro.locals (jeśli potrzebne w testach)
globalThis.Astro = {
  locals: {},
} as any;
