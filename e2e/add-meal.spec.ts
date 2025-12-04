import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { PlannerPage } from "./pages/PlannerPage";

test.describe("Dodawanie posiłku do planu tygodniowego", () => {
  test("dodaje nowy posiłek do śniadania w poniedziałek", async ({ page }) => {
    // Arrange - Logowanie użytkownika
    const loginPage = new LoginPage(page);
    const plannerPage = new PlannerPage(page);

    const testEmail = process.env.TEST_EMAIL || "lekki@gmail.com";
    const testPassword = process.env.TEST_PASSWORD || "Lekki123";

    // Act - Zaloguj się
    await loginPage.navigate();
    await loginPage.login(testEmail, testPassword);

    // Poczekaj na przekierowanie do plannera
    await page.waitForURL(/\/planner/, { timeout: 10000 });
    await plannerPage.isLoaded();

    // Act - Kliknij przycisk dodawania posiłku dla śniadania w poniedziałek
    await plannerPage.clickAddMealButton("monday", "breakfast");

    // Assert - Sprawdź czy dialog jest widoczny
    const isDialogVisible = await plannerPage.isMealDialogVisible();
    expect(isDialogVisible).toBe(true);

    // Act - Wypełnij formularz
    const mealData = {
      name: "Owsianka z owocami",
      kcal: 350,
      protein: 12,
      ingredients: "100g płatków owsianych\n200ml mleka\n1 banan\n1 łyżka miodu",
      steps: "1. Zagotuj mleko\n2. Dodaj płatki owsiane\n3. Gotuj 3-5 minut\n4. Pokrój banana\n5. Dodaj banana i miód",
    };

    await plannerPage.fillMealForm(mealData);

    // Act - Zatwierdź formularz
    await plannerPage.submitMealForm();

    // Assert - Poczekaj na zamknięcie dialogu (oznacza sukces)
    await plannerPage.waitForDialogToClose();

    // Assert - Sprawdź czy wyświetlił się toast z sukcesem
    const isToastVisible = await plannerPage.isSuccessToastVisible();
    expect(isToastVisible).toBe(true);

    // Assert - Sprawdź treść toast notification
    const toastMessage = await plannerPage.getToastMessage();
    expect(toastMessage).toContain("Posiłek został dodany");
    expect(toastMessage).toContain(mealData.name);
    expect(toastMessage).toContain(mealData.kcal.toString());

    // Assert - Sprawdź czy posiłek pojawił się w siatce
    // Po zamknięciu dialogu, komórka powinna zawierać kartę posiłku zamiast przycisku "Dodaj"
    const addButton = page.locator('[data-test-id="add-meal-btn-monday-breakfast"]');
    const isAddButtonVisible = await addButton.isVisible().catch(() => false);
    
    // Przycisk "Dodaj" nie powinien być już widoczny, ponieważ komórka zawiera teraz kartę posiłku
    expect(isAddButtonVisible).toBe(false);

    // Sprawdź czy w komórce pojawił się tekst z nazwą posiłku
    const mealCell = page.locator('[data-day="monday"][data-meal-type="breakfast"]');
    const cellText = await mealCell.textContent();
    expect(cellText).toContain(mealData.name);
  });
});

