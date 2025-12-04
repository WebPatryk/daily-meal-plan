# Playwright Fixtures

Ten katalog zawiera fixtures dla testów E2E Playwright.

## Database Teardown

Plik `db.teardown.ts` implementuje automatyczne czyszczenie bazy danych Supabase po wykonaniu wszystkich testów E2E.

### Jak to działa?

1. **Global Teardown**: W pliku `playwright.config.ts` skonfigurowano `globalTeardown`, który automatycznie uruchamia się po zakończeniu wszystkich testów.

2. **Czyszczenie danych**: Teardown usuwa z bazy danych:
   - Wszystkie posiłki (meals) użytkownika testowego
   - Wszystkie tygodnie (weeks) użytkownika testowego
   - Wszystkie cele (user_goals) użytkownika testowego

3. **Bezpieczeństwo**: Użytkownik testowy NIE jest usuwany z tabeli `auth.users`, dzięki czemu może być ponownie wykorzystany w kolejnych testach.

### Zmienne środowiskowe

Teardown wymaga następujących zmiennych środowiskowych w pliku `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
TEST_EMAIL=lekki@gmail.com





=Lekki123
```

**Uwaga:** Teardown używa pakietu `dotenv` do automatycznego ładowania zmiennych z pliku `.env`. Plik `.env` musi znajdować się w głównym katalogu projektu.

### Uruchamianie

Teardown uruchamia się automatycznie po każdym uruchomieniu testów E2E:

```bash
npm run test:e2e
```

### Debugowanie

Jeśli teardown nie działa poprawnie, sprawdź logi w konsoli. Teardown wyświetla szczegółowe informacje o procesie czyszczenia:

- 🧹 Starting database cleanup...
- 🔍 Found test user: email (ID: uuid)
- ✅ Deleted X meals
- ✅ Deleted X weeks
- ✅ Deleted X user goals
- ✨ Database cleanup completed successfully!

W przypadku błędów, zobaczysz:

- ⚠️ Could not find test user. Skipping cleanup.
- ❌ Error deleting meals: [error message]

### Ręczne uruchomienie teardown

Global teardown uruchamia się automatycznie po testach. Jeśli chcesz uruchomić go ręcznie:

```bash
node e2e/fixtures/db.teardown.ts
```

Lub za pomocą Node.js:

```bash
npx tsx e2e/fixtures/db.teardown.ts
```

### Uwagi

- Teardown używa tego samego użytkownika testowego co testy E2E (`TEST_EMAIL`)
- Teardown loguje się tymczasowo jako użytkownik testowy, aby uzyskać jego ID, a następnie się wylogowuje
- Dzięki RLS (Row Level Security) w Supabase, można bezpiecznie usuwać tylko dane konkretnego użytkownika
