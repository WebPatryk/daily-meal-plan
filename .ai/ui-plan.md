# Architektura UI dla DailyMeal

## 1. Przegląd struktury UI

Aplikacja DailyMeal opiera się na stałym layoucie „shell” zapewniającym spójne doświadczenie na wszystkich urządzeniach. Layout zawiera pasek nawigacyjny (desktop: boczny lub górny, mobile: Sheet-menu) oraz obszar treści renderujący aktualny widok. Wszystkie trasy chronione są przez `ProtectedRoute`, a sesja Supabase zarządzana w `AuthProvider`.

Kluczowe filary UI:

1. **Dashboard** – szybki przegląd postępów i skrót do najważniejszych akcji.
2. **Planer Tygodnia** – adaptacyjna, dostępnościowa siatka posiłków bieżącego tygodnia.
3. **Historia** – paginowana lista zakończonych tygodni (tylko odczyt).
4. **Profil** – zarządzanie celami makro, motywem i kontem.
5. **Onboarding** – modal/strona inicjująca ustawienie celów przy pierwszym logowaniu.

## 2. Lista widoków

### 2.1 Dashboard

- **Ścieżka**: `/`
- **Cel**: Szybkie statystyki tygodnia i skróty do kluczowych działań.
- **Informacje**:
  - Bieżące makra vs cel (kcal, białko)
  - Liczba zaplanowanych posiłków / dni
  - Skrót do „Dodaj posiłek” i „Generuj AI” (dla bieżącego dnia)
- **Komponenty**: Card, ProgressBar, Button, Tabs (switch dzień/tydzień).
- **UX & A11y**: Kontrast odpowiedni do motywu; klawiatura; aria-live dla zmian.
- **Bezpieczeństwo**: Dane pobierane z `/weeks/{id}` i `/weeks/{id}/meals` – zweryfikowane tokenem.

### 2.2 Planer Tygodnia

- **Ścieżka**: `/planner`
- **Cel**: Edytowalna siatka 5×7 dla bieżącego tygodnia.
- **Informacje**:
  - Komórki posiłków z nazwą, makrami, miniaturą
  - Oznaczenie przekroczeń celu kcal (bg-red-50)
- **Komponenty**: AccessibleGrid (`role="grid"`), MealCard (role="button"), MealDialog (manual/AI), Tabs (mobile carousel).
- **UX & A11y**: Fokus roti, klawisze strzałek poruszają po gridzie; Tooltip przy makrach; Dialog trap-focus.
- **Bezpieczeństwo**: Operacje CRUD przez `/weeks/{id}/meals` z walidacją; upload zdjęcia ≤1 MB.

### 2.3 Historia

- **Ścieżka**: `/history`
- **Cel**: Przegląd zakończonych tygodni.
- **Informacje**:
  - Lista kart tygodni (start_date, podsumowanie makr)
- **Komponenty**: CardList, Pagination, Button (view details).
- **UX & A11y**: Lazy-loading list z aria-busy; Paginate `limit/offset`.
- **Bezpieczeństwo**: Tylko odczyt, GET `/weeks?history=true`.

### 2.4 Profil

- **Ścieżka**: `/profile`
- **Cel**: Ustawienia makro-celów, motywu i konta.
- **Informacje**:
  - Formularz `kcal_target`, `protein_target`
  - Przełącznik trybu ciemnego
  - Akcje: Wyloguj, Usuń konto
- **Komponenty**: Form (z YUP/Zod), Switch, Button, Card.
- **UX & A11y**: Walidacja inline; aria-describedby dla błędów.
- **Bezpieczeństwo**: PATCH `/user-goals/{id}` lub POST `/user-goals`; Refresh token przy akcjach konta.

### 2.5 Onboarding (Modal)

- **Ścieżka**: renderowany globalnie, aktywowany gdy 404 z `/user-goals/current`.
- **Cel**: Pierwsze ustawienie celów makro.
- **Informacje**: Formularz celów z walidacją.
- **Komponenty**: Dialog, Form, Button.
- **UX & A11y**: Trap-focus; wyraźna progresja; zamknięcie tylko po sukcesie.
- **Bezpieczeństwo**: POST `/user-goals` (nowy rekord).

### 2.6 Strony uwierzytelniania (Supabase Auth UI)

- **Ścieżki**: `/login`, `/signup`, `/reset-password`
- **Cel**: Zarządzanie sesją użytkownika.
- **Informacje**: Pola e-mail, hasło, walidacja.
- **Komponenty**: Form, Button, Alert.
- **UX & A11y**: Autocomplete, aria-invalid.

## 3. Mapa podróży użytkownika

1. **Nowy użytkownik**:
   1. Odwiedza `/signup` → wypełnia formularz.
   2. Po weryfikacji e-mail loguje się → redirect `/`.
   3. `AuthProvider` odpytuje `/user-goals/current` → 404 → wyświetla Onboarding.
   4. Ustawia cele → POST `/user-goals` → zamknięcie modala.
   5. Ląduje na Dashboard → widzi pusty tydzień.
   6. Przechodzi do **Planera Tygodnia** → klika komórkę → `MealDialog` (manual/AI).
   7. Dodaje posiłki; grid się aktualizuje.
   8. Po zakończeniu tygodnia (automatycznie) widok pojawia się w **Historii**.

2. **Powracający użytkownik**:
   1. `/login` → sukces → `/`.
   2. Dashboard prezentuje progres.
   3. Korzysta z Menu, aby zmienić tygodniowe cele w **Profilu**.

## 4. Układ i struktura nawigacji

- **Desktop ≥md**:
  - Pasek boczny z logo, linkami (Dashboard, Planer, Historia, Profil), licznik makr.
- **Mobile <md**:
  - Przyciski w dolnym Sheet-menu (`Sheet` z Shadcn) lub hamburger.
- **Routing**: React Router (file-based w Astro) z `ProtectedRoute`.
- **Kontexty**:
  - `AuthContext` (sesja Supabase)
  - `ActiveWeekContext` (weekId, setter)

## 5. Kluczowe komponenty

| Komponent        | Cel                                   | Gdzie używany             |
| ---------------- | ------------------------------------- | ------------------------- |
| `AuthProvider`   | Zarządzanie sesją, odświeżanie tokenu | Global wrapper            |
| `ProtectedRoute` | Blokada tras dla nieauth.             | Wszystkie trasy app       |
| `ShellLayout`    | Layout z nawigacją                    | Global                    |
| `AccessibleGrid` | Semantyczna siatka posiłków           | Planer Tygodnia           |
| `MealCard`       | Widok pojedynczego posiłku w gridzie  | Planer Tygodnia, Historia |
| `MealDialog`     | Dodawanie/edycja/generowanie AI       | Planer Tygodnia           |
| `FileUpload`     | Upload zdjęcia z walidacją            | MealDialog                |
| `ProgressBar`    | Wykres makr vs cel                    | Dashboard, Planner        |
| `fetchWithAuth`  | Wrapper na `fetch` z 401 retry        | lib                       |
| `Pagination`     | Paginacja list                        | Historia                  |
| `ThemeSwitch`    | Przełącznik trybu ciemnego            | Profil, Navbar            |
| `LocaleProvider` | Dostarcza teksty PL                   | Global                    |

---

Dokument stanowi kompletny plan architektury UI, mapując wymagania PRD i punkty końcowe API na konkretne widoki i komponenty, z uwzględnieniem UX, dostępności i bezpieczeństwa.
