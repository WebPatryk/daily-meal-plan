# Plan testów jakościowych dla Daily Meal Plan

## Cel

- Zapewnienie, że aplikacja spełnia wymagania biznesowe, jest wolna od krytycznych błędów i zachowuje wysoką wydajność oraz dostępność.
- Wczesne wykrycie regresji w przepływach kluczowych (planer posiłków, uwierzytelnianie) w cyklu CI/CD.

## Zakres

- Frontend (Astro 5 + React 19 + TailwindCSS 4 + shadcn/ui).
- Backend (Supabase: PostgreSQL, Auth, Storage, RLS, migracje).
- Middleware (JWT, @supabase/ssr cookies, Astro middleware).
- AI warstwa (OpenRouter – mockowane w testach).
- Infrastruktura CI/CD (GitHub Actions, Docker, DigitalOcean).

_Nie obejmuje_ testów infrastruktury DO poza prostym smoke-testem po wdrożeniu.

## Kluczowe funkcjonalności do przetestowania

- **Uwierzytelnianie i zarządzanie sesją**
  - Rejestracja, logowanie, wylogowanie, reset hasła.
  - Poprawne ustawianie i odświeżanie cookies (`getAll/setAll`).
  - Obsługa RLS: brak dostępu do danych innych użytkowników.
- **Planer tygodniowy**
  - Tworzenie, odczyt, aktualizacja, usuwanie tygodnia.
  - Nawigacja między tygodniami (poprzedni/następny, bieżący).
  - Walidacja unikalności tygodnia w bazie (1 tydzień → 1 użytkownik).
- **Zarządzanie posiłkami**
  - Dodawanie, edycja, usuwanie posiłku w komórce siatki.
  - Przeciąganie/klonowanie posiłku na inne dni/posiłki.
  - Zapisywanie zmian w czasie rzeczywistym (optimistic update + rollback na błąd).
- **Generacja AI posiłków**
  - Wywołanie endpointu `/api/meals/ai-generate` z kontekstem tygodnia.
  - Mock OpenRouter w testach; weryfikacja parsera odpowiedzi.
  - Limit czasu odpowiedzi i wielkości promptu.
- **UI / UX krytyczne ścieżki**
  - Responsywność (mobile ≥ 320 px, desktop ≥ 1280 px).
  - Skróty klawiaturowe (`useGridKeyboardNavigation`).
  - Dostępność: focus trap w modalach (`MealDialog`, `GenerateMealDialog`).
- **Middleware i API**
  - Poprawne przekazywanie nagłówków auth między Astro SSR a API.
  - Błędy 401/403: przekierowanie na `/auth/login`.
  - Seryjne i równoległe wywołania API (throttling, retries, cancelation).
- **Integracja z Supabase Storage**
  - Pobieranie ikon posiłków (`mealIcons.tsx`).
  - Obsługa błędów CORS/CDN.
- **CI/CD smoke**
  - Deployment preview → smoke-test endpointów i stron publicznych.
  - Rollback na fail (exit code ≠ 0).

## Typy testów

1. **Jednostkowe**
   - Logika utili (np. `utils.ts`, `weeksService.ts`).
   - Walidacje z Zod w schematach (`src/lib/schemas`).
2. **Komponentów (rendering)**
   - Komponenty React / Astro z użyciem JSX (`MealCard`, `WeekGrid`).
   - Snapshoty SSR/CSR.
3. **Integracyjne**
   - API ↔ DB (Supabase RLS włączone).
   - Middleware cookie flow (`getAll/setAll`).
   - Migracje SQL – uruchomienie `supabase db reset` w pipeline.
4. **End-to-End (E2E)**
   - Krytyczne ścieżki użytkownika: rejestracja → login → utworzenie tygodnia → dodanie posiłku → generacja AI → wylogowanie.
   - Scenariusze mobilne (viewport 375 px) i desktop.
5. **Wydajnościowe**
   - k6 dla API (`/api/weeks/current`, `/api/meals/ai-generate`).
   - Lighthouse CI dla UI (CLS, LCP, TTI).
   - Testy obciążeniowe DB (100 równoległych użytkowników).
6. **Bezpieczeństwa**
   - OWASP ZAP baseline + active scan przeciw publicznemu preview.
   - Testy RLS: próba odczytu/ zapisu nie-autoryzowanego rekordu.
7. **Dostępności**
   - axe-playwright dla ścieżek publicznych i po zalogowaniu.
   - Ręczna weryfikacja WCAG AA (kontrast, focus order).

## Środowiska

| Środowisko  | Adres                   | Cel                                         |
| ----------- | ----------------------- | ------------------------------------------- |
| **Local**   | `localhost:*`           | Development + testy jednostkowe/komponentów |
| **CI**      | Docker-in-Docker        | Wszystkie testy headless                    |
| **Staging** | `staging.meal-plan.app` | E2E, ZAP, Lighthouse-CI, k6                 |
| **Prod**    | `meal-plan.app`         | Smoke + syntetyczne monitorowanie           |

Dane testowe przechowywane w oddzielnym projekcie Supabase z włączonym RLS.

## Narzędzia i biblioteki

- **Vitest** + **@testing-library/react** + **astro/test** – jednostkowe i komponentów.
- **Playwright** (UI + API) – E2E + axe-playwright + Lighthouse CI plugin.
- **k6** – testy wydajnościowe (skrypty w TypeScript).
- **OWASP ZAP** docker-baseline + zap-cli – bezpieczeństwo.
- **supabase-cli** (`supabase db reset`, `supabase functions test`).
- **msw** (Mock Service Worker) – stub OpenRouter oraz zapytania CDN.
- **nyc/istanbul** – pokrycie ≥ 80 % lines / 70 % branches.

## Metryki akceptacji

- Lighthouse Performance ≥ 90; Accessibility ≥ 95; Best Practices ≥ 90.
- E2E scenariusze przechodzą 100 % (retry = 2).
- Pokrycie testów jednostkowych ≥ 80 % lines.
- RLS: próby naruszenia → HTTP 403.

## Harmonogram

| Sprint       | Aktywności QA                                          |
| ------------ | ------------------------------------------------------ |
| 1 (setup)    | Konfiguracja Vitest, Playwright, CI, supabase-cli seed |
| 2 – 3        | Implementacja testów jednostkowych + komponentów       |
| 4 – 5        | Integracyjne + pierwsze E2E (happy-path)               |
| 6            | Wydajność (k6), bezpieczeństwo (ZAP baseline)          |
| 7            | Pełne E2E, accessibility, Lighthouse CI + thresholdy   |
| Każdy sprint | Regresja smoke (≈ 10 min) w CI na PR                   |

## Ryzyka & mitigacje

- **Nie-deterministyczne odpowiedzi AI** → stosować małe modele + snapshoty JSON, fallback mock.
- **Zmiany schematu DB bez testów migracji** → pipeline uruchamia `supabase db reset` + Vitest integracyjne.
- **Wydłużenie E2E > 10 min** → równoległy shard Playwright + selective tags.
- **RLS false-positive** → test matrix: anon / auth / admin.
