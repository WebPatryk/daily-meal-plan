import { test as setup } from "@playwright/test";

/**
 * Setup fixture dla testów wymagających autentykacji
 * Można rozszerzyć o faktyczne logowanie i zapisywanie stanu sesji
 */

// const authFile = "playwright/.auth/user.json";

setup("authenticate", async () => {
  // TODO: Implementacja logowania dla testów E2E
  // Przykład:
  // await page.goto('/auth/login');
  // await page.fill('input[name="email"]', 'test@example.com');
  // await page.fill('input[name="password"]', 'test-password');
  // await page.click('button[type="submit"]');
  // await page.waitForURL('/planner');
  // await page.context().storageState({ path: authFile });
});
