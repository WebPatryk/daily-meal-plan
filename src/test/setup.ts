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

// Mock for Astro.locals (if accessed in tests)
declare global {
  // Extend the global namespace just for tests
  // eslint-disable-next-line no-var
  var Astro: {
    locals: Record<string, unknown>;
  };
}

globalThis.Astro = {
  locals: {},
};
