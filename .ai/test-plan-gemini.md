<analiza_projektu>
**1. Kluczowe komponenty projektu wynikające z analizy kodu:**

- **Frontend (UI/UX):** Aplikacja oparta na Astro (SSR) i React (interaktywność). Kluczowe widoki to strona logowania/rejestracji oraz główny widok planera (`PlannerPage`, `WeekPlannerLayout`). Wykorzystuje Tailwind CSS oraz komponenty UI (Radix/Shadcn) takie jak modale (`Dialog`), slidery, toasty (`Sonner`).
- **Warstwa Logiki Biznesowej:** Zarządzanie stanem tygodnia (`PlannerContext`), logika nawigacji po siatce (`WeekGrid`, `useGridKeyboardNavigation`), obsługa formularzy (React Hook Form + Zod).
- **Backend (API Routes):** Endpointy w Astro (`pages/api/...`) obsługujące CRUD dla posiłków (`/meals`), tygodni (`/weeks`) oraz autoryzację (`/auth`).
- **Integracje Zewnętrzne:**
  - **Supabase:** Baza danych (PostgreSQL), autoryzacja (Auth) oraz storage (zdjęcia).
  - **OpenRouter (AI):** Generowanie posiłków za pomocą LLM (`generation.service.ts`, `openrouter.service.ts`).
- **Middleware:** Ochrona tras i zarządzanie sesją użytkownika w `src/middleware/index.ts`.

**2. Specyfika stosu technologicznego i wpływ na testowanie:**

- **Astro + React:** Wymaga testowania zarówno renderowania po stronie serwera (SSR), jak i hydracji komponentów Reacta. Testy komponentów muszą uwzględniać kontekst przeglądarki.
- **TypeScript & Zod:** Silne typowanie statyczne i walidacja w runtime (schemas) redukują potrzebę trywialnych testów "czy pole jest stringiem", pozwalając skupić się na logice biznesowej i edge-cases.
- **Supabase (Auth & DB):** Konieczność mockowania klienta Supabase w testach jednostkowych. Testy integracyjne będą wymagały dedykowanej instancji testowej lub emulatora Supabase. Należy zweryfikować Row Level Security (RLS).
- **AI (OpenRouter):** Deterministyczne testowanie jest trudne. Należy skupić się na testowaniu kontraktów (schema validation), obsługi błędów i mockowaniu odpowiedzi AI, zamiast testować samą jakość "kreatywną" generowanych treści w każdym przebiegu CI/CD.

**3. Priorytety testowe:**

1.  **Bezpieczeństwo i Autoryzacja:** Middleware, ochrona endpointów API, poprawność RLS (użytkownik widzi tylko swoje dane).
2.  **Core Feature - Planer:** Dodawanie, edycja, usuwanie posiłków, przeliczanie makroskładników (kcal/białko), poprawność dat tygodni.
3.  **Integracja z AI:** Stabilność serwisu generowania, parsowanie JSON z odpowiedzi LLM, obsługa błędów (np. timeout, zł format).
4.  **UX i Dostępność:** Nawigacja klawiaturą w siatce (`useGridKeyboardNavigation`), responsywność, obsługa błędów formularzy.

**4. Obszary ryzyka:**

- **Halucynacje AI / Format danych:** Ryzyko, że LLM zwróci JSON niezgodny ze schematem, co może wyłożyć frontend. Wymagane rygorystyczne testy parsowania w `generation.service.ts`.
- **Synchronizacja stanu:** Możliwe rozbieżności między stanem lokalnym (Context) a bazą danych przy błędach sieciowych (np. optymistyczne UI vs realny błąd zapisu).
- **Limity API (Rate Limiting):** OpenRouter i Supabase mają limity. Należy przetestować zachowanie aplikacji przy przekroczeniu limitów (kod 429).
- **Obsługa plików:** Walidacja i upload zdjęć (rozmiar, typ) w `uploadMealImage`.

</analiza_projektu>

<plan_testów>

# Plan Testów dla Projektu "Daily Meal Plan"

## 1. Wprowadzenie

Celem niniejszego dokumentu jest zdefiniowanie strategii testowania aplikacji "Daily Meal Plan". Projekt jest planerem posiłków wykorzystującym sztuczną inteligencję, zbudowanym w oparciu o Astro, React, Supabase oraz OpenRouter. Głównym celem testów jest zapewnienie niezawodności funkcji planowania, bezpieczeństwa danych użytkowników oraz stabilności integracji z AI.

## 2. Zakres Testów

Testy obejmą następujące obszary:

- **Frontend:** Interfejs użytkownika, walidacja formularzy, zarządzanie stanem (PlannerContext), interakcje (Drag&Drop, modale).
- **Backend (API Routes):** Endpointy REST (`/api/weeks`, `/api/meals`, `/api/auth`), walidacja żądań (Zod), kody błędów.
- **Logika Biznesowa:** Serwisy (`generation.service`, `weeksService`), przeliczanie makroskładników.
- **Integracje:** Komunikacja z Supabase (Auth, DB, Storage) oraz OpenRouter API.
- **Bezpieczeństwo:** Middleware, RLS (Row Level Security), walidacja sesji.

**Wyłączenia:** Testy wydajnościowe samej infrastruktury Supabase oraz testy jakości merytorycznej przepisów generowanych przez AI (skupiamy się na strukturze danych, nie na smaku potraw).

## 3. Typy Testów

### 3.1. Testy Jednostkowe (Unit Tests)

- **Cel:** Weryfikacja izolowanych fragmentów kodu.
- **Zakres:**
  - Parsowanie i walidacja schematów Zod (`src/lib/schemas`).
  - Logika `generation.service.ts` (mockowanie OpenRouter).
  - Hooki Reactowe, w szczególności `useGridKeyboardNavigation`.
  - Funkcje użytkowe (`utils.ts`, `mealIcons.tsx`).
  - Komponenty UI bez skutków ubocznych (np. `MealCard`, `AuthError`).

### 3.2. Testy Integracyjne (Integration Tests)

- **Cel:** Weryfikacja współpracy między modułami.
- **Zakres:**
  - API Routes + Supabase (na bazie testowej/emulatorze).
  - `PlannerContext` + `apiClient` (weryfikacja przepływu danych).
  - Middleware autoryzacji (czy chronione trasy przekierowują do logowania).

### 3.3. Testy End-to-End (E2E)

- **Cel:** Weryfikacja pełnych ścieżek użytkownika w przeglądarce.
- **Zakres:** Krytyczne ścieżki (Rejestracja -> Generowanie Tygodnia -> Dodanie Posiłku -> Wylogowanie).

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Autoryzacja i Zarządzanie Kontem

| ID      | Nazwa Scenariusza             | Kroki                                               | Oczekiwany Rezultat                                                    |
| ------- | ----------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| AUTH-01 | Rejestracja - walidacja hasła | Próba rejestracji hasłem bez cyfry/wielkiej litery. | Wyświetlenie błędu walidacji (zgodnie z `registerSchema`).             |
| AUTH-02 | Logowanie poprawne            | Wpisanie poprawnych danych i submit.                | Przekierowanie do `/planner`, utworzenie sesji.                        |
| AUTH-03 | Ochrona tras (Middleware)     | Wejście na `/planner` bez sesji.                    | Automatyczne przekierowanie do `/auth/login`.                          |
| AUTH-04 | Inicjalizacja tygodnia        | Rejestracja nowego użytkownika.                     | Automatyczne utworzenie bieżącego tygodnia w DB (`api/auth/register`). |

### 4.2. Planer Posiłków (CRUD)

| ID      | Nazwa Scenariusza          | Kroki                                                   | Oczekiwany Rezultat                                          |
| ------- | -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ |
| PLAN-01 | Dodawanie posiłku (Manual) | Kliknięcie w pusty slot, wypełnienie formularza, zapis. | Posiłek pojawia się w siatce, aktualizacja sumy kcal/białka. |
| PLAN-02 | Walidacja makro            | Próba dodania posiłku z ujemnymi kaloriami.             | Blokada zapisu, komunikat błędu.                             |
| PLAN-03 | Edycja posiłku             | Zmiana nazwy i kalorii istniejącego posiłku.            | Dane zaktualizowane w UI i DB, przeliczenie sumy tygodnia.   |
| PLAN-04 | Usuwanie posiłku           | Wybór opcji usuń w modalu edycji.                       | Posiłek znika z siatki, slot staje się pusty.                |
| PLAN-05 | Upload zdjęcia             | Dodanie zdjęcia > 1MB.                                  | Wyświetlenie błędu walidacji rozmiaru pliku.                 |

### 4.3. Generowanie Posiłków AI

| ID    | Nazwa Scenariusza     | Kroki                                                | Oczekiwany Rezultat                                                               |
| ----- | --------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| AI-01 | Generowanie i zapis   | Wypełnienie parametrów, kliknięcie "Generuj", zapis. | API zwraca sformatowany posiłek, posiłek dodany do siatki z flagą `ai_generated`. |
| AI-02 | Obsługa błędu formatu | Mockowanie odpowiedzi AI z błędnym JSON.             | Serwis rzuca `MealGenerationError`, UI wyświetla czytelny komunikat.              |
| AI-03 | Walidacja zakresów    | Generowanie z min kcal > max kcal.                   | Blokada na poziomie formularza (`AiGenerateMealSchema`).                          |

### 4.4. UI i Dostępność

| ID    | Nazwa Scenariusza    | Kroki                               | Oczekiwany Rezultat                                                             |
| ----- | -------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| UI-01 | Nawigacja klawiaturą | Użycie strzałek na siatce tygodnia. | Focus przesuwa się zgodnie z kierunkiem strzałek (`useGridKeyboardNavigation`). |
| UI-02 | Responsywność        | Otwarcie planera na mobile (375px). | Siatka dostosowuje się (scroll lub stack), modal jest czytelny.                 |

## 5. Środowisko Testowe

- **Lokalne:** Node.js v20+, lokalna instancja Supabase (Docker) lub projekt dev w chmurze.
- **Staging:** Odzwierciedlenie produkcji, podłączone do OpenRouter (z limitowanym budżetem testowym).
- **Dane testowe:** Seedowanie bazy danych użytkownikami testowymi i przykładowymi posiłkami przed uruchomieniem testów E2E.

## 6. Narzędzia

- **Testy Jednostkowe/Integracyjne:** `Vitest` (kompatybilny z Vite/Astro) + `React Testing Library`.
- **Testy E2E:** `Playwright` (wspiera testowanie wielu kontekstów przeglądarki).
- **API Testing:** `Bruno` lub skrypty automatyczne w `Vitest`.
- **Statyczna Analiza:** `ESLint`, `Prettier`, `TypeScript` (włączony tryb strict).

## 7. Harmonogram Testów

- **Pre-commit (Husky):** Lintowanie, Type check (`tsc`), Testy jednostkowe kluczowych utilsów.
- **Pull Request:** Pełne testy jednostkowe i integracyjne.
- **Nightly/Deploy:** Pełne testy E2E na środowisku staging.

## 8. Kryteria Akceptacji

- Wszystkie testy jednostkowe i integracyjne muszą przechodzić (100% pass rate).
- Pokrycie kodu (Code Coverage) dla `lib/` i `components/planner` > 80%.
- Brak błędów krytycznych (blokujących logowanie lub dodawanie posiłków) w testach E2E.
- Audyt dostępności (Lighthouse) > 90.

## 9. Role i Odpowiedzialności

- **QA Engineer:** Tworzenie scenariuszy E2E, konfiguracja środowiska testowego, testy manualne/eksploracyjne UI.
- **Developerzy:** Pisanie testów jednostkowych do własnego kodu, utrzymanie zgodności typów TypeScript.
- **DevOps:** Integracja testów w potoku CI/CD.

## 10. Procedury Raportowania Błędów

Zgłoszenia w systemie ticketowym (np. Jira/GitHub Issues) powinny zawierać:

1.  **Tytuł:** Zwięzły opis problemu.
2.  **Środowisko:** Przeglądarka, wersja OS, środowisko (Dev/Prod).
3.  **Kroki do reprodukcji:** Dokładna ścieżka.
4.  **Oczekiwany vs Rzeczywisty rezultat.**
5.  **Logi/Screenshoty:** Zrzuty z konsoli przeglądarki lub logi serwera Astro.
6.  **Priorytet:** Krytyczny/Wysoki/Średni/Niski.

</plan_testów>
