# API Endpoint Implementation Plan: GET /weeks – List Weeks for Current User

## 1. Przegląd punktu końcowego
Zwraca paginowaną listę tygodni zalogowanego użytkownika. Domyślnie zwraca bieżący oraz przyszłe tygodnie; można filtrować po dacie startowej, historii oraz sortować.

## 2. Szczegóły żądania
- Metoda HTTP: **GET**
- URL: `/api/weeks`
- Nagłówki:
  `Authorization: Bearer <JWT>` (sesja Supabase)
- Query params  
  • **limit** `number` (1-100, default 20)  
  • **offset** `number` (0-∞, default 0)  
  • **start_date** `YYYY-MM-DD` (optional)  
  • **history** `true | false` (optional, default false)  
  • **sort** `start_date:asc | start_date:desc` (optional, default desc)

## 3. Wykorzystywane typy
- `WeekDto` — reprezentacja wiersza tabeli `weeks`
- `WeeksQuery` — parametry zapytania (patrz `src/types.ts`)
- `PaginatedResponse<WeekDto>` — output

## 4. Szczegóły odpowiedzi
```jsonc
// 200 OK
{
  "items": [ /* WeekDto[] */ ],
  "total": 42
}
```
Kody statusu  
200 OK · 400 Bad Request · 401 Unauthorized · 500 Internal Server Error

## 5. Przepływ danych
1. Klient wysyła GET `/api/weeks?limit=20&offset=0` z tokenem.
2. Astro API route (`src/pages/api/weeks/index.ts`)  
   a. Pobiera użytkownika `const { data: { user } } = locals.supabase.auth.getUser()`  
   b. Waliduje parametry (Zod).  
   c. Wywołuje `weeksService.listWeeks(user.id, query)`.
3. `weeksService` (nowy plik `src/lib/weeksService.ts`):  
   - Buduje zapytanie Supabase:  
     `from("weeks").select("*", { count: "exact" })`  
     + filtr `user_id = auth.uid()` (RLS fallback)  
     + `gte` / `lt` dla daty w zależności od `history` / `start_date`  
     + paginacja `.range(offset, offset+limit-1)`  
     + sortowanie `.order("start_date", { ascending })`.
4. Zwraca `{ items, total }` do handlera.
5. Handler zwraca 200 + JSON.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie**: wymagany JWT Supabase; brak ⇒ 401.  
- **Autoryzacja**: RLS (`user_id = auth.uid()`) + dodatkowy filtr w zapytaniu.  
- **Walidacja**: Zod odrzuca nieprawidłowe typy / zakresy.  
- **Rate-limiting**: delegowane do infrastruktury (np. Edge function middleware).  
- **Injection**: Supabase query builder eliminuje SQL-i; nadal sanity-check danych.

## 7. Obsługa błędów
| Scenariusz | Kod | Treść JSON |
|------------|-----|------------|
| Brak JWT / wygasły | 401 | `{ "error": "unauthorized" }` |
| limit > 100 lub < 1 | 400 | `{ "error": "limit must be 1–100" }` |
| Nieprawidłowa data | 400 | `{ "error": "start_date must be YYYY-MM-DD" }` |
| Błąd DB / nieoczekiwany | 500 | `{ "error": "internal_server_error" }` |
Błędy logujemy `utils.logError(e, 'GET /weeks')` oraz `console.error` (lub tabela `error_logs` gdy powstanie).

## 8. Rozważania dotyczące wydajności
- Indeks unikalny `(user_id, start_date)` obsłuży filtr + sort.  
- Limit ≤ 100 zapobiega „deep pagination” DoS.  
- Supabase `count: "exact"` pobiera ilość w jednym zapytaniu.  
- ETag lub `Cache-Control: private, max-age=30` można dodać później.

## 9. Etapy wdrożenia
1. **Schema validation**  
   - Utwórz `src/lib/schemas/weeks.ts` z Zod-schemą `WeeksQuerySchema`.
2. **Service Layer**  
   - `weeksService.listWeeks(userId, query)` (pl. `src/lib/weeksService.ts`).
3. **API Route**  
   - `src/pages/api/weeks/index.ts`  
     ```ts
     import { WeeksQuerySchema } from "@/lib/schemas/weeks";
     import { listWeeks } from "@/lib/weeksService";
     export async function get({ locals, request }) { /* … */ }
     ```
4. **Error util**  
   - Jeśli brak: `src/lib/utils.ts` → `export function logError(err, ctx)`.
5. **Unit tests / integration**  
   - Mock Supabase; test walidacji i serwisu.
6. **Update README & changelog**  
   - Dodaj opis endpointu i przykłady cURL.
7. **Code review -> merge -> deploy**  
   - Observability: monitor 5xx i latency.
