import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Środowisko testowe dla komponentów React
    environment: "jsdom",

    // Pliki setup wykonywane przed testami
    setupFiles: ["./src/test/setup.ts"],

    // Globalne wzorce dla plików testowych
    include: ["**/*.{test,spec}.{ts,tsx}"],

    // Wykluczenie folderów z testami e2e
    exclude: ["node_modules", "dist", ".astro", "e2e/**", "**/*.e2e.{test,spec}.{ts,tsx}"],

    // Konfiguracja coverage
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.d.ts", "**/*.config.*", "**/mockData/**", "dist/"],
    },

    // Globalne zmienne testowe
    globals: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
