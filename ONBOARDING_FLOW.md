# Flow Onboardingu - Cele Żywieniowe

## Przegląd

Po rejestracji nowy użytkownik musi ustawić swoje cele żywieniowe (kalorie i białko) zanim będzie mógł korzystać z plannera. Ten dokument opisuje implementację tego flow.

## Komponenty

### 1. OnboardingModal (`src/components/auth/OnboardingModal.tsx`)

Modal pokazywany po rejestracji lub gdy użytkownik próbuje uzyskać dostęp do plannera bez ustawionych celów.

**Cechy:**

- Nie można zamknąć modalu (brak przycisku X i onOpenChange)
- Wymagane pola: dzienny cel kaloryczny (1-10000 kcal) i dzienny cel białkowy (1-1000g)
- Walidacja formularza
- Automatyczne zapisywanie celów do bazy danych
- Po zapisaniu wywołuje callback `onComplete`

### 2. useOnboarding Hook (`src/lib/hooks/useOnboarding.ts`)

Hook zarządzający stanem onboardingu.

**Funkcje:**

- `checkGoals()` - sprawdza czy użytkownik ma ustawione cele
- `saveGoals(goals)` - zapisuje cele żywieniowe
- `hasGoals` - boolean wskazujący czy użytkownik ma cele (null = loading)
- `isLoading` - stan ładowania podczas zapisywania

## Flow Użytkownika

### Scenariusz 1: Nowa Rejestracja

1. Użytkownik wypełnia formularz rejestracji
2. Po pomyślnej rejestracji pokazuje się `OnboardingModal`
3. Użytkownik musi wprowadzić cele kaloryczne i białkowe
4. Po zapisaniu celów zostaje przekierowany do `/planner`

**Zmodyfikowane pliki:**

- `src/components/auth/RegisterForm.tsx` - dodano pokazywanie modalu po rejestracji
- `src/lib/hooks/useRegister.ts` - dodano możliwość używania callbacku zamiast auto-przekierowania

### Scenariusz 2: Logowanie Użytkownika Bez Celów

1. Użytkownik loguje się
2. Zostaje przekierowany do `/planner`
3. `PlannerPage` sprawdza czy użytkownik ma ustawione cele
4. Jeśli nie ma - pokazuje `OnboardingModal`
5. Po zapisaniu celów strona się odświeża i ładuje planner z nowymi celami

**Zmodyfikowane pliki:**

- `src/components/planner/PlannerPage.tsx` - dodano sprawdzenie celów i pokazywanie modalu

### Scenariusz 3: Zmiana Celów

Użytkownik może w każdej chwili zmienić swoje cele żywieniowe przez:

- Stronę profilu (`/profile`)
- Komponent `ProfilePage` (`src/components/profile/ProfilePage.tsx`)

## API Endpoints

### GET `/api/profile/goals`

Pobiera aktualne cele użytkownika.

**Odpowiedź:**

```json
{
  "kcal_target": 2000,
  "protein_target": 150
}
```

Gdy użytkownik nie ma celów:

```json
{
  "kcal_target": null,
  "protein_target": null
}
```

### PUT `/api/profile/goals`

Zapisuje nowe cele użytkownika.

**Request Body:**

```json
{
  "kcal_target": 2000,
  "protein_target": 150
}
```

**Walidacja:**

- `kcal_target`: 0-10000
- `protein_target`: 0-1000

## Baza Danych

Tabela: `user_goals`

**Struktura:**

- `goal_id` - klucz główny
- `user_id` - UUID użytkownika (FK do auth.users)
- `kcal_target` - cel kaloryczny (1-3000)
- `protein_target` - cel białkowy (1-300)
- `valid_from` - data rozpoczęcia obowiązywania celu
- `valid_to` - data zakończenia obowiązywania (NULL = aktualny cel)
- `created_at` - timestamp utworzenia

**Uwaga:** System wspiera historię zmian celów - tylko jeden rekord ma `valid_to = NULL` (aktualny cel).

## Middleware

Middleware (`src/middleware/index.ts`) nie sprawdza celów - zajmuje się tylko autentykacją użytkownika. Sprawdzenie celów odbywa się na poziomie komponentu `PlannerPage`.

## Testowanie

Aby przetestować flow onboardingu:

1. **Nowa rejestracja:**

   ```bash
   # Uruchom aplikację
   npm run dev

   # Przejdź do /auth/register
   # Zarejestruj nowego użytkownika
   # Powinien pojawić się modal z pytaniem o cele
   ```

2. **Użytkownik bez celów:**

   ```bash
   # W bazie danych ustaw valid_to na datę przeszłą dla wszystkich celów użytkownika
   # Lub usuń wszystkie cele użytkownika
   # Zaloguj się
   # Przejdź do /planner
   # Powinien pojawić się modal
   ```

3. **Zmiana celów:**
   ```bash
   # Zaloguj się jako użytkownik z celami
   # Przejdź do /profile
   # Zmień cele
   # Sprawdź czy nowe cele są zapisane
   ```

## Bezpieczeństwo

- Wszystkie endpointy API wymagają autentykacji (middleware sprawdza sesję)
- Walidacja danych po stronie serwera (Zod schemas)
- RLS (Row Level Security) w Supabase zapewnia że użytkownik może edytować tylko swoje cele
- Cookies z sesją mają ustawione flagi httpOnly i secure

## Przyszłe Usprawnienia

Możliwe rozszerzenia:

- Dodanie większej liczby celów (węglowodany, tłuszcze, mikroskładniki)
- Kalkulator BMR/TDEE do sugerowania celów
- Wykresy pokazujące historię zmian celów
- Powiadomienia gdy użytkownik nie aktualizował celów przez długi czas
