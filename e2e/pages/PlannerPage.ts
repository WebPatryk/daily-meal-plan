import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

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
    // Możesz dostosować selektor do rzeczywistej struktury strony
    return this.page.url().includes("/planner") && (await this.page.waitForLoadState("networkidle"));
  }
}
