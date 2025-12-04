# E2E Test Helpers

Ten katalog zawiera pomocnicze funkcje dla testów E2E Playwright.

## Supabase Helper (`supabase.ts`)

Plik zawiera funkcje pomocnicze do interakcji z bazą danych Supabase podczas testów E2E.

### Funkcje

#### `createTestSupabaseClient()`

Tworzy klienta Supabase do użycia w testach E2E.

**Zmienne środowiskowe:**

- `SUPABASE_URL` - URL projektu Supabase
- `SUPABASE_KEY` - Klucz anon Supabase

**Przykład użycia:**

```typescript
import { createTestSupabaseClient } from "./helpers/supabase";

const supabase = createTestSupabaseClient();

// Wykonaj operacje na bazie danych
const { data, error } = await supabase.from("meals").select("*").eq("user_id", userId);
```

#### `getTestUserId(email: string): Promise<string | null>`

Pobiera ID użytkownika testowego na podstawie jego adresu email.

**Parametry:**

- `email` - adres email użytkownika testowego

**Zwraca:**

- `string` - ID użytkownika (UUID)
- `null` - jeśli nie udało się pobrać ID

**Zmienne środowiskowe:**

- `TEST_PASSWORD` - hasło użytkownika testowego

**Przykład użycia:**

```typescript
import { getTestUserId } from "./helpers/supabase";

const testEmail = "lekki@gmail.com";
const userId = await getTestUserId(testEmail);

if (userId) {
  console.log(`User ID: ${userId}`);
}
```

**Uwaga:** Funkcja loguje się tymczasowo jako użytkownik testowy, aby uzyskać jego ID, a następnie automatycznie się wylogowuje.

### Bezpieczeństwo

- Funkcje te są przeznaczone **wyłącznie** do użytku w testach E2E
- Nie używaj tych funkcji w kodzie produkcyjnym
- Upewnij się, że zmienne środowiskowe z danymi testowymi są przechowywane bezpiecznie (np. w pliku `.env` nie commitowanym do repozytorium)

### Konfiguracja

Dodaj następujące zmienne do pliku `.env` (lub `.env.test`):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
TEST_EMAIL=lekki@gmail.com


TEST_PASSWORD=Lekki123
```

### Rozszerzanie

Możesz dodać więcej pomocniczych funkcji do tego pliku, na przykład:

```typescript
// Funkcja do seedowania danych testowych
export async function seedTestData(userId: string) {
  const supabase = createTestSupabaseClient();
  // Dodaj dane testowe...
}

// Funkcja do czyszczenia konkretnej tabeli
export async function cleanTable(tableName: string, userId: string) {
  const supabase = createTestSupabaseClient();
  await supabase.from(tableName).delete().eq("user_id", userId);
}
```
