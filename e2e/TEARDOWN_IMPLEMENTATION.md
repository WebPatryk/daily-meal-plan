# Implementacja Database Teardown dla Playwright

## Podsumowanie zmian

Zaimplementowano automatyczne czyszczenie bazy danych Supabase po zakończeniu wszystkich testów E2E, korzystając z mechanizmu **globalTeardown** z Playwright.

## Zmiany w projekcie

### 1. Utworzono nowe pliki

#### `e2e/helpers/supabase.ts`

Plik pomocniczy zawierający funkcje do interakcji z Supabase w testach:

- `createTestSupabaseClient()` - tworzy klienta Supabase dla testów
- `getTestUserId(email)` - pobiera ID użytkownika testowego

#### `e2e/fixtures/db.teardown.ts`

Główny plik teardown, który:

- Uruchamia się automatycznie po wszystkich testach
- Loguje się jako użytkownik testowy
- Czyści wszystkie tabele:
  - `meals` - posiłki użytkownika
  - `weeks` - tygodnie planowania
  - `user_goals` - cele użytkownika
- Zachowuje użytkownika testowego w `auth.users`

#### `e2e/fixtures/README.md`

Dokumentacja fixtures, w tym szczegółowy opis działania teardown.

#### `e2e/helpers/README.md`

Dokumentacja funkcji pomocniczych dla testów E2E.

### 2. Zaktualizowano istniejące pliki

#### `playwright.config.ts`

Dodano globalTeardown do konfiguracji:

```typescript
export default defineConfig({
  // Global teardown - czyszczenie bazy danych po wszystkich testach
  globalTeardown: "./e2e/fixtures/db.teardown.ts",

  // ... reszta konfiguracji

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

#### `TESTING.md`

Dodano sekcję "Database Teardown" z dokumentacją:

- Jak działa teardown
- Wymagane zmienne środowiskowe
- Instrukcje debugowania
- Ręczne uruchamianie

## Wymagane zmienne środowiskowe

Utwórz plik `.env` w katalogu głównym projektu z następującymi zmiennymi:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# E2E Testing Configuration
TEST_EMAIL=lekki@gmail.com
TEST_PASSWORD=Lekki123
```

## Jak używać

### Automatyczne uruchomienie (zalecane)

Teardown uruchamia się automatycznie po każdym uruchomieniu testów E2E:

```bash
npm run test:e2e
```

Proces:

1. Uruchamiają się wszystkie testy E2E
2. Po zakończeniu testów automatycznie uruchamia się teardown
3. Baza danych jest czyszczona
4. Użytkownik testowy pozostaje zachowany

### Ręczne uruchomienie

Możesz uruchomić tylko teardown (bez testów):

```bash
npx tsx e2e/fixtures/db.teardown.ts
```

Lub z Node.js:

```bash
node e2e/fixtures/db.teardown.ts
```

## Przykładowy output

Po uruchomieniu teardown zobaczysz logi podobne do:

```
Running 1 test using 1 worker

🧹 Starting database cleanup...
🔍 Found test user: lekki@gmail.com (ID: 550e8400-e29b-41d4-a716-446655440000)
✅ Deleted 5 meals
✅ Deleted 1 weeks
✅ Deleted 0 user goals
✨ Database cleanup completed successfully!

  ✓  [teardown] › fixtures/db.teardown.ts:16:1 › cleanup database (500ms)

  1 passed (500ms)
```

## Bezpieczeństwo

### Co jest usuwane?

- ✅ Wszystkie posiłki użytkownika testowego
- ✅ Wszystkie tygodnie użytkownika testowego
- ✅ Wszystkie cele użytkownika testowego

### Co jest zachowywane?

- ✅ Użytkownik testowy w `auth.users`
- ✅ Dane innych użytkowników (dzięki filtrowaniu po `user_id`)

### Row Level Security (RLS)

Dzięki RLS w Supabase, teardown może bezpiecznie operować tylko na danych użytkownika testowego:

```typescript
await supabase.from("meals").delete().eq("user_id", userId); // Tylko dane tego użytkownika
```

## Troubleshooting

### Problem: "Missing SUPABASE_URL or SUPABASE_KEY"

**Rozwiązanie:**

1. Upewnij się, że plik `.env` istnieje w **głównym katalogu projektu** (nie w podfolderze)
2. Plik `.env` zawiera prawidłowe zmienne:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
TEST_EMAIL=lekki@gmail.com
TEST_PASSWORD=Lekki123
```

3. Sprawdź czy pakiet `dotenv` jest zainstalowany:

```bash
npm list dotenv
```

Jeśli nie jest zainstalowany:

```bash
npm install --save-dev dotenv
```

### Problem: "Could not find test user"

**Rozwiązanie:**

1. Sprawdź czy użytkownik testowy istnieje w bazie danych
2. Sprawdź czy `TEST_EMAIL` i `TEST_PASSWORD` są poprawne
3. Sprawdź czy użytkownik może się zalogować manualnie

### Problem: Teardown nie uruchamia się

**Rozwiązanie:**

1. Sprawdź konfigurację w `playwright.config.ts` - upewnij się że `globalTeardown` wskazuje na poprawną ścieżkę
2. Sprawdź czy plik `db.teardown.ts` eksportuje domyślną funkcję async
3. Uruchom ręcznie: `npx tsx e2e/fixtures/db.teardown.ts`

### Problem: "Error deleting meals/weeks/goals"

**Rozwiązanie:**

1. Sprawdź uprawnienia użytkownika w Supabase
2. Sprawdź czy RLS policies pozwalają na usuwanie danych
3. Sprawdź logi Supabase Dashboard dla szczegółów błędu

## Rozszerzanie

### Dodawanie czyszczenia innych tabel

Edytuj `e2e/fixtures/db.teardown.ts` i dodaj:

```typescript
// 4. Usuń nową tabelę
const { error: newTableError, count: newTableCount } = await supabase
  .from("new_table")
  .delete({ count: "exact" })
  .eq("user_id", userId);

if (newTableError) {
  console.error("❌ Error deleting new_table:", newTableError);
  throw newTableError;
}
console.log(`✅ Deleted ${newTableCount ?? 0} rows from new_table`);
```

### Dodawanie setup fixtures

Jeśli potrzebujesz seedować dane przed testami, utwórz `e2e/fixtures/db.setup.ts`:

```typescript
import { createTestSupabaseClient, getTestUserId } from "../helpers/supabase";

async function globalSetup() {
  const supabase = createTestSupabaseClient();
  const userId = await getTestUserId(process.env.TEST_EMAIL);

  // Dodaj dane testowe
  await supabase.from("meals").insert({
    user_id: userId,
    // ... inne pola
  });
}

export default globalSetup;
```

Następnie dodaj do `playwright.config.ts`:

```typescript
export default defineConfig({
  globalSetup: "./e2e/fixtures/db.setup.ts",
  globalTeardown: "./e2e/fixtures/db.teardown.ts",
  // ... reszta konfiguracji
});
```

## Referencje

- [Playwright Global Setup and Teardown](https://playwright.dev/docs/test-global-setup-teardown)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## Autorzy

Implementacja zgodna z:

- **Playwright Best Practices** - Global Setup/Teardown pattern
- **Supabase Best Practices** - RLS i bezpieczne operacje na danych
- **Project Guidelines** - zgodność z regułami projektu daily-meal-plan
