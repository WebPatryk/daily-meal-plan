# Instrukcja testowania E2E

## Wymagania wstępne

Przed uruchomieniem testów E2E upewnij się, że:

1. **Skonfigurowano zmienne środowiskowe**

   Skopiuj plik `.env.example` do `.env` i uzupełnij go swoimi danymi:

   ```bash
   cp .env.example .env
   ```

   Wymagane zmienne:
   - `SUPABASE_URL` - URL Twojego projektu Supabase
   - `SUPABASE_KEY` - Klucz anon/public z Supabase
   - `OPENROUTER_API_KEY` - Klucz API OpenRouter (opcjonalny dla testów auth)

2. **Zainstalowano zależności**

   ```bash
   npm install
   ```

3. **Uruchomiono lokalną bazę danych Supabase (opcjonalnie)**

   ```bash
   npx supabase start
   ```

## Uruchamianie testów E2E

### Opcja 1: Z automatycznym uruchomieniem serwera (zalecana)

Odkomentuj sekcję `webServer` w `playwright.config.ts`:

```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:4321',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
},
```

Następnie uruchom testy:

```bash
npm run test:e2e
```

### Opcja 2: Z ręcznym uruchomieniem serwera

1. W pierwszym terminalu uruchom serwer deweloperski:

   ```bash
   npm run dev
   ```

2. W drugim terminalu uruchom testy:

   ```bash
   npx playwright test
   ```

## Inne polecenia testowe

- **Testy w trybie UI**: `npm run test:e2e:ui` lub `npx playwright test --ui`
- **Testy w trybie debug**: `npm run test:e2e:debug` lub `npx playwright test --debug`
- **Raport z testów**: `npm run test:e2e:report` lub `npx playwright show-report`

## Rozwiązywanie problemów

### Błąd: ERR_CONNECTION_REFUSED

**Problem**: Serwer nie jest uruchomiony.

**Rozwiązanie**:

1. Sprawdź czy plik `.env` istnieje i zawiera poprawne dane
2. Uruchom serwer ręcznie: `npm run dev`
3. Upewnij się, że port 4321 jest wolny

### Błąd: Timed out waiting from config.webServer

**Problem**: Serwer nie może się uruchomić w ciągu 120 sekund.

**Rozwiązanie**:

1. Sprawdź logi serwera i popraw ewentualne błędy
2. Upewnij się, że masz skonfigurowane wszystkie wymagane zmienne środowiskowe
3. Użyj opcji 2 (ręczne uruchomienie serwera)

### Błąd: MiddlewareCantBeLoaded

**Problem**: Brak pliku `src/db/supabase.client.ts` lub niepoprawna konfiguracja.

**Rozwiązanie**:

1. Upewnij się, że folder `src/db` istnieje
2. Sprawdź czy pliki `supabase.client.ts` i `database.types.ts` są w folderze `src/db`
3. Uruchom migracje: `npx supabase db reset`

## Struktura testów

```
e2e/
├── auth.spec.ts          # Testy autoryzacji
├── fixtures/
│   └── auth.setup.ts     # Fixture dla testów z logowaniem
└── pages/
    ├── BasePage.ts       # Bazowa klasa Page Object
    └── LoginPage.ts      # Page Object dla strony logowania
```

## Pisanie nowych testów

Testy powinny używać Page Object Model:

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test("my test", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login("user@example.com", "password");

  await expect(page).toHaveURL(/.*\/planner/);
});
```

