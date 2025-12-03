import type { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model dla strony logowania
 */
export class LoginPage extends BasePage {
  // Selektory
  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly submitButton = 'button[type="submit"]';
  private readonly errorMessage = '[role="alert"]';
  private readonly registerLink = 'a[href="/auth/register"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Nawiguj do strony logowania
   */
  async navigate() {
    await this.goto("/auth/login");
  }

  /**
   * Wypełnij formularz logowania
   */
  async fillLoginForm(email: string, password: string) {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
  }

  /**
   * Kliknij przycisk submit
   */
  async submitForm() {
    await this.click(this.submitButton);
  }

  /**
   * Zaloguj się
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.submitForm();
  }

  /**
   * Sprawdź czy wyświetla się komunikat błędu
   */
  async hasErrorMessage() {
    return await this.isVisible(this.errorMessage);
  }

  /**
   * Pobierz tekst komunikatu błędu
   */
  async getErrorMessage() {
    return await this.page.textContent(this.errorMessage);
  }

  /**
   * Kliknij link do rejestracji
   */
  async clickRegisterLink() {
    await this.click(this.registerLink);
  }

  /**
   * Sprawdź czy formularz logowania jest widoczny
   */
  async isLoginFormVisible() {
    return (
      (await this.isVisible(this.emailInput)) &&
      (await this.isVisible(this.passwordInput)) &&
      (await this.isVisible(this.submitButton))
    );
  }
}
