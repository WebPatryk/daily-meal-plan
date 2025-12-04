import { defineConfig, devices } from "@playwright/test";

/**
 * Konfiguracja Playwright dla testów E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Global teardown - czyszczenie bazy danych po wszystkich testach
  globalTeardown: "./e2e/fixtures/db.teardown.ts",

  // Katalog z testami E2E
  testDir: "./e2e",

  // Maksymalny czas na jeden test
  timeout: 30 * 1000,

  // Oczekiwanie na assercje
  expect: {
    timeout: 5000,
  },

  // Uruchamiaj testy równolegle
  fullyParallel: true,

  // Zatrzymaj na pierwszym błędzie w CI
  forbidOnly: !!process.env.CI,

  // Liczba powtórzeń w przypadku niepowodzenia
  retries: process.env.CI ? 2 : 0,

  // Liczba workerów
  workers: process.env.CI ? 1 : undefined,

  // Reporter - lista formatów raportów
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  // Współdzielone ustawienia dla wszystkich projektów
  use: {
    // URL bazowy dla testów
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Zbieraj ślady po niepowodzeniach
    trace: "on-first-retry",

    // Screenshot tylko przy niepowodzeniu
    screenshot: "only-on-failure",

    // Video tylko przy niepowodzeniu
    video: "retain-on-failure",
  },

  // Konfiguracja projektów - tylko Chromium zgodnie z wymaganiami
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Uruchom serwer deweloperski przed testami
  // Serwer musi być uruchomiony ręcznie: npm run dev
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
