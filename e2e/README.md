# Testy E2E - Playwright

Ten folder zawiera testy end-to-end (E2E) dla aplikacji Daily Meal Plan.

## Struktura

```
e2e/
├── pages/              # Page Object Model
│   ├── BasePage.ts    # Klasa bazowa dla wszystkich stron
│   ├── LoginPage.ts   # Strona logowania
│   └── PlannerPage.ts # Strona plannera
├── fixtures/          # Fixtures dla testów
│   └── auth.setup.ts  # Setup autentykacji
└── auth.spec.ts       # Testy autentykacji
```

## Uruchamianie testów

### Uruchom wszystkie testy E2E

```bash
npm run test:e2e
```

### Uruchom testy w trybie UI

```bash
npm run test:e2e:ui
```

### Uruchom testy w trybie debug

```bash
npm run test:e2e:debug
```

### Zobacz raport z testów

```bash
npm run test:e2e:report
```

## Zmienne środowiskowe

Dla testów autentykacji możesz ustawić następujące zmienne środowiskowe:

```env
TEST_EMAIL=test@example.com
TEST_PASSWORD=test-password
```

Jeśli nie zostaną ustawione, testy użyją domyślnych wartości.

## Przed uruchomieniem testów

1. Upewnij się, że aplikacja jest uruchomiona na porcie 3000:

   ```bash
   npm run dev
   ```

   Serwer powinien być dostępny pod adresem `http://localhost:3000`

2. Upewnij się, że masz konto testowe w bazie danych Supabase.

## Testy

### auth.spec.ts

Test sprawdza proces logowania:

1. **Poprawne logowanie** - Weryfikuje czy po podaniu poprawnych danych użytkownik jest przekierowywany na stronę `/planner`
2. **Niepoprawne logowanie** - Weryfikuje czy przy błędnych danych wyświetla się komunikat błędu
