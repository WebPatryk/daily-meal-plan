import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { PlannerPage } from "./pages/PlannerPage";

test.describe("Autentykacja użytkownika", () => {
  test("poprawne logowanie przekierowuje na stronę plannera", async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Przejdź do strony logowania
    await loginPage.navigate();

    // Sprawdź czy jesteśmy na stronie logowania
    await expect(page).toHaveURL(/\/login/);

    // Sprawdź czy formularz logowania jest widoczny
    const isFormVisible = await loginPage.isLoginFormVisible();
    expect(isFormVisible).toBe(true);

    // Wypełnij formularz logowania
    // UWAGA: Użyj zmiennych środowiskowych lub zastąp prawdziwymi danymi testowymi
    const testEmail = process.env.TEST_EMAIL || "lekki@gmail.com";
    const testPassword = process.env.TEST_PASSWORD || "Lekki123";

    await loginPage.login(testEmail, testPassword);

    // Poczekaj na nawigację po zalogowaniu
    await page.waitForURL(/\/planner/, { timeout: 10000 });

    // Sprawdź czy zostaliśmy przekierowani na stronę plannera
    await expect(page).toHaveURL(/\/planner/);

    // Sprawdź czy strona plannera została załadowana
    const plannerPage = new PlannerPage(page);
    await plannerPage.isLoaded();
  });

  test("wyświetla błąd przy niepoprawnych danych logowania", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();

    // Użyj niepoprawnych danych
    await loginPage.login("wrong@example.com", "wrongpassword");

    // Poczekaj na komunikat błędu
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Sprawdź czy wyświetla się komunikat błędu
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).toBe(true);

    // Sprawdź czy nadal jesteśmy na stronie logowania
    await expect(page).toHaveURL(/\/login/);
  });
});
