import type { Page } from "@playwright/test";

/**
 * Klasa bazowa dla Page Object Model
 * Zawiera wspólne metody dla wszystkich stron
 */
export class BasePage {
  constructor(public page: Page) {}

  /**
   * Nawiguj do określonej ścieżki
   */
  async goto(path: string) {
    await this.page.goto(path, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
  }

  /**
   * Pobierz tytuł strony
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Sprawdź czy element jest widoczny
   */
  async isVisible(selector: string) {
    return await this.page.isVisible(selector);
  }

  /**
   * Kliknij element
   */
  async click(selector: string) {
    await this.page.click(selector);
  }

  /**
   * Wypełnij pole tekstowe
   */
  async fill(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  /**
   * Poczekaj na nawigację
   */
  async waitForNavigation() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Zrób screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
