# Dokumentacja Testowania

Ten dokument opisuje konfigurację i użycie testów w projekcie Daily Meal Plan.

## ⚠️ Wymagania przed uruchomieniem testów E2E

**WAŻNE!** Przed pierwszym uruchomieniem testów E2E:

1. **Utwórz plik `.env`** (jeśli nie istnieje):

   ```bash
   # Możesz skopiować z przykładu (jeśli istnieje)
   cp .env.example .env
   ```

2. **Wypełnij zmienne środowiskowe** w pliku `.env`:
   - `SUPABASE_URL` - URL Twojego projektu Supabase
   - `SUPABASE_KEY` - Klucz anon/public z Supabase
   - `OPENROUTER_API_KEY` - Klucz API OpenRouter (opcjonalny dla testów auth)

3. **Uruchom serwer deweloperski** w osobnym terminalu:

   ```bash
   npm run dev
   ```

4. Dopiero **teraz uruchom testy E2E**:
   ```bash
   npx playwright test
   ```

Szczegółowe instrukcje znajdziesz w pliku `README_TESTING.md`

---

## Spis treści

- [Przegląd](#przegląd)
- [Testy jednostkowe (Vitest)](#testy-jednostkowe-vitest)
- [Testy E2E (Playwright)](#testy-e2e-playwright)
- [Uruchamianie testów](#uruchamianie-testów)
- [Struktura katalogów](#struktura-katalogów)
- [Best Practices](#best-practices)

## Przegląd

Projekt wykorzystuje dwa narzędzia do testowania:

- **Vitest** - do testów jednostkowych i integracyjnych komponentów React i funkcji pomocniczych
- **Playwright** - do testów end-to-end (E2E) całej aplikacji w przeglądarce

## Testy jednostkowe (Vitest)

### Konfiguracja

Konfiguracja Vitest znajduje się w pliku `vitest.config.ts`. Wykorzystuje:

- **jsdom** jako środowisko testowe dla komponentów React
- **React Testing Library** do testowania komponentów
- **Setup file** w `src/test/setup.ts` dla globalnej konfiguracji

### Pisanie testów

Testy jednostkowe powinny być umieszczone obok testowanego pliku z rozszerzeniem `.test.ts` lub `.test.tsx`:

```
src/
  components/
    Button.tsx
    Button.test.tsx      # Test dla Button
  lib/
    utils.ts
    utils.test.ts        # Test dla utils
```

#### Przykład testu funkcji

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });
});
```

#### Przykład testu komponentu React

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Mockowanie

#### Mockowanie modułów

```typescript
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
```

#### Mockowanie fetch API

```typescript
global.fetch = vi.fn();

(global.fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: "test" }),
});
```

## Testy E2E (Playwright)

### Konfiguracja

Konfiguracja Playwright znajduje się w pliku `playwright.config.ts`. Zgodnie z wymaganiami projektu, używamy tylko przeglądarki **Chromium**.

### Struktura testów E2E

```
e2e/
  fixtures/          # Setup i teardown fixtures
    auth.setup.ts    # Setup dla autentykacji
    db.teardown.ts   # Czyszczenie bazy danych po testach
  helpers/          # Funkcje pomocnicze dla testów
    supabase.ts     # Helper do interakcji z Supabase
  pages/            # Page Object Models
    BasePage.ts     # Klasa bazowa dla wszystkich stron
    LoginPage.ts    # POM dla strony logowania
  auth.spec.ts      # Testy autentykacji
```

### Database Teardown

Projekt wykorzystuje automatyczne czyszczenie bazy danych po zakończeniu wszystkich testów E2E.

#### Jak to działa?

Playwright używa **globalTeardown** - funkcji, która automatycznie uruchamia się po zakończeniu wszystkich testów. Teardown:

1. Loguje się jako użytkownik testowy
2. Pobiera jego ID z bazy danych
3. Usuwa wszystkie dane testowe:
   - Posiłki (meals)
   - Tygodnie (weeks)
   - Cele użytkownika (user_goals)
4. Zachowuje konto użytkownika do ponownego użycia

#### Konfiguracja zmiennych środowiskowych

Aby teardown działał poprawnie, utwórz plik `.env` w katalogu głównym projektu:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
TEST_EMAIL=lekki@gmail.com
TEST_PASSWORD=Lekki123
```

**Ważne:** Teardown automatycznie ładuje zmienne z pliku `.env` używając pakietu `dotenv`.

#### Ręczne uruchomienie teardown

```bash
# Uruchom tylko proces czyszczenia bazy danych (ręcznie)
npx tsx e2e/fixtures/db.teardown.ts
```

#### Debugowanie teardown

Teardown wyświetla szczegółowe logi w konsoli:

```
🧹 Starting database cleanup...
🔍 Found test user: lekki@gmail.com (ID: uuid)
✅ Deleted 5 meals
✅ Deleted 1 weeks
✅ Deleted 0 user goals
✨ Database cleanup completed successfully!
```

Więcej informacji znajdziesz w `e2e/fixtures/README.md`.

### Page Object Model

Wszystkie testy E2E powinny wykorzystywać wzorzec Page Object Model dla lepszej utrzymywalności:

```typescript
import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  private readonly emailInput = 'input[name="email"]';
  private readonly submitButton = 'button[type="submit"]';

  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.goto("/auth/login");
  }

  async login(email: string, password: string) {
    await this.fill(this.emailInput, email);
    await this.click(this.submitButton);
  }
}
```

### Pisanie testów E2E

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication", () => {
  test("should display login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    await expect(page).toHaveTitle(/10x Astro Starter/);
  });
});
```

## Uruchamianie testów

### Testy jednostkowe (Vitest)

```bash
# Uruchom wszystkie testy
npm run test

# Tryb watch - automatyczne uruchamianie po zmianach
npm run test:watch

# UI mode - wizualny interfejs
npm run test:ui

# Coverage - raport pokrycia kodu
npm run test:coverage
```

### Testy E2E (Playwright)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# UI mode - interaktywny interfejs
npm run test:e2e:ui

# Debug mode - krok po kroku
npm run test:e2e:debug

# Pokaż raport z ostatniego uruchomienia
npm run test:e2e:report
```

## Struktura katalogów

```
daily-meal-plan/
├── src/
│   ├── test/
│   │   └── setup.ts              # Setup dla Vitest
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx       # Test jednostkowy
│   └── lib/
│       ├── utils.ts
│       └── utils.test.ts         # Test jednostkowy
├── e2e/
│   ├── fixtures/
│   │   ├── auth.setup.ts         # Setup dla autentykacji
│   │   ├── db.teardown.ts        # Teardown - czyszczenie bazy
│   │   └── README.md             # Dokumentacja fixtures
│   ├── helpers/
│   │   ├── supabase.ts           # Helper dla Supabase
│   │   └── README.md             # Dokumentacja helpers
│   ├── pages/
│   │   ├── BasePage.ts           # Klasa bazowa POM
│   │   └── LoginPage.ts          # POM dla strony logowania
│   └── auth.spec.ts              # Testy E2E autentykacji
├── vitest.config.ts              # Konfiguracja Vitest
├── playwright.config.ts          # Konfiguracja Playwright
└── TESTING.md                    # Ta dokumentacja
```

## Best Practices

### Testy jednostkowe

1. **AAA Pattern** - Arrange, Act, Assert

   ```typescript
   it("should do something", () => {
     // Arrange - przygotuj dane
     const input = "test";

     // Act - wykonaj akcję
     const result = doSomething(input);

     // Assert - sprawdź wynik
     expect(result).toBe("expected");
   });
   ```

2. **Opisowe nazwy testów** - nazwa powinna opisywać co test sprawdza

   ```typescript
   // ✅ Dobra nazwa
   it("should display error message when login fails", () => {});

   // ❌ Zła nazwa
   it("test login", () => {});
   ```

3. **Izolacja testów** - każdy test powinien być niezależny

   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });
   ```

4. **Mockuj zależności zewnętrzne** - API, localStorage, itp.
   ```typescript
   vi.mock("@supabase/supabase-js");
   ```

### Testy E2E

1. **Page Object Model** - enkapsuluj logikę interakcji ze stroną
2. **Stabilne selektory** - używaj `data-testid`, `role`, lub `aria-label`
3. **Czekaj na elementy** - nie używaj `setTimeout`, używaj `waitFor`
4. **Testy niezależne** - każdy test powinien działać osobno
5. **Visual regression** - używaj `toHaveScreenshot()` dla ważnych widoków

## Debugowanie

### Vitest

```bash
# Uruchom konkretny test
npm run test -- -t "nazwa testu"

# UI mode dla interaktywnego debugowania
npm run test:ui
```

### Playwright

```bash
# Debug mode - krok po kroku
npm run test:e2e:debug

# Uruchom konkretny plik
npm run test:e2e -- auth.spec.ts

# Headed mode - z widoczną przeglądarką
npm run test:e2e -- --headed
```

## CI/CD

Testy są automatycznie uruchamiane w pipeline CI/CD:

- Testy jednostkowe uruchamiane przy każdym push
- Testy E2E uruchamiane przed deploymentem
- Coverage report generowany dla pull requestów

## Wsparcie

W razie problemów z testami:

1. Sprawdź logi z `console.log()` lub `page.screenshot()`
2. Użyj debug mode
3. Sprawdź dokumentację:
   - [Vitest](https://vitest.dev/)
   - [Playwright](https://playwright.dev/)
   - [Testing Library](https://testing-library.com/)
