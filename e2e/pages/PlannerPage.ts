import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
type MealType = "breakfast" | "second_breakfast" | "lunch" | "snack" | "dinner";

/**
 * Page Object Model dla strony plannera
 */
export class PlannerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Nawiguj do strony plannera
   */
  async navigate() {
    await this.goto("/planner");
  }

  /**
   * Sprawdź czy strona plannera jest załadowana
   */
  async isLoaded() {
    return this.page.url().includes("/planner") && (await this.page.waitForLoadState("networkidle"));
  }

  /**
   * Kliknij przycisk dodawania posiłku dla konkretnego dnia i typu posiłku
   */
  async clickAddMealButton(day: DayOfWeek, mealType: MealType) {
    const selector = `[data-test-id="add-meal-btn-${day}-${mealType}"]`;
    await this.click(selector);
  }

  /**
   * Sprawdź czy dialog dodawania posiłku jest widoczny
   */
  async isMealDialogVisible() {
    return await this.isVisible('[data-test-id="meal-dialog"]');
  }

  /**
   * Wypełnij formularz dodawania posiłku
   */
  async fillMealForm(data: {
    name: string;
    kcal: number;
    protein: number;
    ingredients?: string;
    steps?: string;
  }) {
    await this.fill('[data-test-id="meal-name-input"]', data.name);
    await this.fill('[data-test-id="meal-kcal-input"]', data.kcal.toString());
    await this.fill('[data-test-id="meal-protein-input"]', data.protein.toString());

    if (data.ingredients) {
      await this.fill('[data-test-id="meal-ingredients-input"]', data.ingredients);
    }

    if (data.steps) {
      await this.fill('[data-test-id="meal-steps-input"]', data.steps);
    }
  }

  /**
   * Kliknij przycisk submit w formularzu posiłku
   */
  async submitMealForm() {
    await this.click('[data-test-id="meal-submit-btn"]');
  }

  /**
   * Poczekaj aż dialog się zamknie
   */
  async waitForDialogToClose() {
    await this.page.waitForSelector('[data-test-id="meal-dialog"]', { state: "hidden", timeout: 10000 });
  }

  /**
   * Sprawdź czy toast z sukcesem jest widoczny
   */
  async isSuccessToastVisible() {
    // Toast notification z biblioteki Sonner
    return await this.page.locator('[data-sonner-toast]').first().isVisible();
  }

  /**
   * Pobierz treść toast notification
   */
  async getToastMessage() {
    return await this.page.locator('[data-sonner-toast]').first().textContent();
  }
}

