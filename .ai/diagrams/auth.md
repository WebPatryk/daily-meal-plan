# Diagram Architektury Autentykacji - DailyMeal

<authentication_analysis>

## 1. Przepływy autentykacji wymienione w plikach referencyjnych

### Przepływ rejestracji (US-001):

- Użytkownik wypełnia formularz rejestracji (email, password, confirmPassword)
- Walidacja lokalna przez Zod schema w React
- Wysłanie POST do `/api/auth/register`
- Endpoint API wywołuje `supabase.auth.signUp()`
- Supabase Auth zwraca sesję
- Ustawienie HttpOnly cookie
- Przekierowanie do `/dashboard`
- Toast: "Rejestracja zakończona, witaj!"

### Przepływ logowania (US-002):

- Użytkownik wypełnia formularz logowania (email, password)
- Walidacja lokalna przez Zod schema
- Wysłanie POST do `/api/auth/login`
- Endpoint API wywołuje `supabase.auth.signInWithPassword()`
- Supabase Auth zwraca sesję lub błąd
- Przy sukcesie: ustawienie cookie, przekierowanie do `/dashboard`
- Przy błędzie: wyświetlenie komunikatu "Nieprawidłowy e-mail lub hasło"

### Przepływ dostępu do chronionych zasobów:

- Użytkownik próbuje uzyskać dostęp do `/dashboard` lub innej chronionej strony
- Middleware `onRequest` przechwytuje żądanie
- Wywołanie `context.locals.supabase.auth.getUser()` z JWT z cookie
- Jeśli JWT ważny: renderowanie strony
- Jeśli JWT nieważny: redirect 302 do `/auth/login`

### Przepływ wylogowania:

- Użytkownik klika "Wyloguj" w interfejsie
- Wysłanie POST do `/api/auth/logout`
- API wywołuje `supabase.auth.signOut()`
- Czyszczenie cookie sesyjnego
- Redirect do `/auth/login`

### Przepływ odświeżania tokenu:

- Biblioteka `supabase-js` w przeglądarce monitoruje czas wygaśnięcia tokenu
- Przed wygaśnięciem lub po otrzymaniu 401:
- Automatyczne wywołanie `supabase.auth.refreshSession(refresh_token)`
- Supabase Auth zwraca nowy access_token
- Aktualizacja cookie/localStorage
- Wznowienie przerwanych żądań

## 2. Główni aktorzy i ich interakcje

### Przeglądarka (Browser):

- Renderuje komponenty React (RegisterForm.tsx, LoginForm.tsx)
- Wykonuje walidację pól formularza przez Zod
- Wysyła żądania HTTP do Astro API endpoints
- Zarządza stanem sesji przez `supabase.auth.onAuthStateChange`
- Przechowuje tokeny w cookie (HttpOnly) i localStorage

### Middleware (Astro Middleware):

- Przechwytuje wszystkie żądania do chronionych stron
- Weryfikuje ważność JWT przez `supabase.auth.getUser()`
- Przekierowuje nieautoryzowanych użytkowników do `/auth/login`
- Udostępnia `supabase` client przez `context.locals`

### Astro API (Server-side handlers):

- `/api/auth/register`: proxy do `signUp()`
- `/api/auth/login`: proxy do `signInWithPassword()`
- `/api/auth/logout`: proxy do `signOut()`
- Waliduje dane wejściowe przez Zod schemas
- Ustawia HttpOnly, Secure, SameSite=Lax cookies
- Zwraca odpowiednie kody HTTP (201, 200, 401, 409, 500)

### Supabase Auth (Backend service):

- Zarządza procesem autentykacji użytkowników
- Przechowuje zahashowane hasła
- Generuje JWT access tokens (ważność 3600s = 1h)
- Generuje refresh tokens z rotacją
- Weryfikuje tokeny przy każdym żądaniu
- Obsługuje odświeżanie sesji

## 3. Proces weryfikacji i odświeżania tokenów

### Weryfikacja tokenu (każde żądanie do chronionej strony):

```
1. Browser → Middleware: GET /dashboard (+ JWT w cookie)
2. Middleware: Wyciągnięcie JWT z cookie
3. Middleware → Supabase Auth: getUser(jwt)
4. Supabase Auth: Weryfikacja podpisu, sprawdzenie expiry
5a. Jeśli ważny: Supabase Auth → Middleware: {user: {...}}
5b. Jeśli nieważny: Supabase Auth → Middleware: error 401
6a. Middleware → Browser: 200 OK + rendered page
6b. Middleware → Browser: 302 Redirect /auth/login
```

### Odświeżanie tokenu (client-side, automatyczne):

```
1. supabase-js w przeglądarce: Monitorowanie czasu wygaśnięcia
2. Przed wygaśnięciem (lub po 401):
3. Browser → Supabase Auth: refreshSession(refresh_token)
4. Supabase Auth: Weryfikacja refresh_token
5. Supabase Auth: Generowanie nowego access_token i refresh_token
6. Supabase Auth → Browser: {access_token, refresh_token, expires_at}
7. Browser: Aktualizacja cookie i localStorage
8. Browser: Wznowienie przerwanych żądań z nowym tokenem
```

### Mechanizm refresh token rotation:

- Włączone w `supabase/config.toml`: `enable_refresh_token_rotation = true`
- Przy każdym odświeżeniu stary refresh_token staje się nieważny
- Nowy refresh_token jest zwracany razem z nowym access_token
- `refresh_token_reuse_interval = 10s` pozwala na krótkie "okno" reużycia

## 4. Krótki opis każdego kroku autentykacji

### Rejestracja (krok po kroku):

1. Użytkownik otwiera `/auth/register`
2. Wypełnia email, hasło, potwierdzenie hasła
3. React komponent waliduje dane lokalnie (Zod)
4. Wysłanie POST do `/api/auth/register` z `{email, password}`
5. API endpoint waliduje dane po stronie serwera
6. Wywołanie `supabase.auth.signUp({email, password})`
7. Supabase tworzy nowego użytkownika (email verification wyłączone w MVP)
8. Zwrot `{session}` z access_token i refresh_token
9. API ustawia HttpOnly cookie z tokenami
10. Zwrot 201 Created do przeglądarki
11. Browser wykonuje redirect do `/dashboard`
12. Wyświetlenie toast: "Rejestracja zakończona, witaj!"

### Logowanie (krok po kroku):

1. Użytkownik otwiera `/auth/login`
2. Wypełnia email i hasło
3. React komponent waliduje dane lokalnie (Zod)
4. Wysłanie POST do `/api/auth/login` z `{email, password}`
5. API endpoint waliduje dane
6. Wywołanie `supabase.auth.signInWithPassword({email, password})`
7. Supabase weryfikuje credentials
   8a. Sukces: zwrot `{session}`
   8b. Błąd: zwrot error (np. "Invalid credentials")
   9a. API ustawia cookie, zwraca 200 OK
   9b. API zwraca 401 Unauthorized z mapowanym błędem
   10a. Browser wykonuje redirect do `/dashboard` (lub `redirectTo`)
   10b. Browser wyświetla AuthError: "Nieprawidłowy e-mail lub hasło"

### Dostęp do chronionej strony (krok po kroku):

1. Użytkownik klika link do `/dashboard`
2. Browser wysyła GET /dashboard z JWT w cookie
3. Middleware `onRequest` przechwytuje żądanie
4. Middleware wyciąga `supabase` z `context.locals`
5. Wywołanie `supabase.auth.getUser()` (przekazuje JWT automatycznie)
6. Supabase Auth weryfikuje JWT (podpis + expiry)
   7a. JWT ważny: Supabase zwraca `{user}`
   7b. JWT nieważny/wygasły: Supabase zwraca error
   8a. Middleware pozwala na renderowanie strony (200 OK)
   8b. Middleware wykonuje redirect 302 do `/auth/login`

### Wylogowanie (krok po kroku):

1. Użytkownik klika przycisk "Wyloguj"
2. Browser wysyła POST do `/api/auth/logout`
3. API endpoint wywołuje `supabase.auth.signOut()`
4. Supabase unieważnia sesję po stronie serwera
5. API czyści cookie (Set-Cookie z pustą wartością, max-age=0)
6. Zwrot 204 No Content
7. Browser wykonuje redirect do `/auth/login`
8. Użytkownik widzi stronę logowania

### Odświeżanie tokenu (krok po kroku):

1. supabase-js w przeglądarce wykrywa zbliżający się expiry tokenu
   (monitorowanie przez `onAuthStateChange`)
2. Lub: użytkownik wykonuje żądanie, które zwraca 401
3. Biblioteka automatycznie wywołuje `refreshSession()`
4. Browser → Supabase Auth: POST z refresh_token
5. Supabase weryfikuje refresh_token
6. Supabase generuje nowy access_token i nowy refresh_token (rotation)
7. Supabase zwraca `{access_token, refresh_token, expires_at}`
8. supabase-js aktualizuje tokens w cookie i/lub localStorage
9. Event `onAuthStateChange` triggeruje update w React context
10. Przerwane żądania są automatycznie ponawiane z nowym tokenem

</authentication_analysis>

---

<mermaid_diagram>

```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przeglądarka
    participant Middleware as Middleware
    participant API as Astro API
    participant Auth as Supabase Auth

    %% Rejestracja
    Note over Browser,Auth: Przepływ Rejestracji
    Browser->>Browser: Użytkownik wypełnia formularz
    Browser->>Browser: Walidacja Zod (email, password)
    Browser->>API: POST /api/auth/register
    activate API
    API->>API: Walidacja schema (Zod)
    API->>Auth: signUp(email, password)
    activate Auth
    Auth->>Auth: Tworzenie użytkownika
    Auth-->>API: session + access_token
    deactivate Auth
    API->>API: Ustawienie HttpOnly cookie
    API-->>Browser: 201 Created + Set-Cookie
    deactivate API
    Browser->>Browser: Redirect /dashboard
    Browser->>Browser: Toast: Witaj!

    %% Logowanie
    Note over Browser,Auth: Przepływ Logowania
    Browser->>Browser: Użytkownik wypełnia formularz
    Browser->>Browser: Walidacja Zod (email, password)
    Browser->>API: POST /api/auth/login
    activate API
    API->>API: Walidacja schema (Zod)
    API->>Auth: signInWithPassword()
    activate Auth
    alt Poprawne credentials
        Auth->>Auth: Weryfikacja hasła
        Auth-->>API: session + access_token
        deactivate Auth
        API->>API: Ustawienie HttpOnly cookie
        API-->>Browser: 200 OK + Set-Cookie
        deactivate API
        Browser->>Browser: Redirect /dashboard
    else Niepoprawne credentials
        Auth-->>API: error: Invalid credentials
        deactivate Auth
        API-->>Browser: 401 Unauthorized
        deactivate API
        Browser->>Browser: Wyświetl błąd
    end

    %% Dostęp do chronionej strony
    Note over Browser,Auth: Dostęp do Chronionej Strony
    Browser->>Middleware: GET /dashboard (JWT w cookie)
    activate Middleware
    Middleware->>Middleware: Wyciągnięcie JWT z cookie
    Middleware->>Auth: auth.getUser(jwt)
    activate Auth
    Auth->>Auth: Weryfikacja JWT (podpis + expiry)
    alt JWT ważny
        Auth-->>Middleware: user object
        deactivate Auth
        Middleware->>Middleware: Renderowanie strony
        Middleware-->>Browser: 200 OK (HTML)
        deactivate Middleware
    else JWT nieważny lub wygasły
        Auth-->>Middleware: error 401 Unauthorized
        deactivate Auth
        Middleware-->>Browser: 302 Redirect /auth/login
        deactivate Middleware
        Browser->>Browser: Strona logowania
    end

    %% Wylogowanie
    Note over Browser,Auth: Przepływ Wylogowania
    Browser->>API: POST /api/auth/logout
    activate API
    API->>Auth: signOut()
    activate Auth
    Auth->>Auth: Unieważnienie sesji
    Auth-->>API: 204 No Content
    deactivate Auth
    API->>API: Clear-Cookie
    API-->>Browser: 204 + Clear-Cookie
    deactivate API
    Browser->>Browser: Redirect /auth/login

    %% Odświeżanie tokenu
    Note over Browser,Auth: Automatyczne Odświeżanie Tokenu
    Browser->>Browser: Token zbliża się do expiry
    Browser->>Browser: onAuthStateChange trigger
    Browser->>Auth: refreshSession(refresh_token)
    activate Auth
    Auth->>Auth: Weryfikacja refresh_token
    Auth->>Auth: Generowanie nowych tokenów
    Auth-->>Browser: access_token + refresh_token
    deactivate Auth
    Browser->>Browser: Aktualizacja cookie/storage
    Browser->>Browser: Wznowienie żądań

    %% Obsługa 401 podczas żądania
    Note over Browser,Auth: Obsługa 401 w Trakcie Żądania
    Browser->>API: GET /api/resource (wygasły token)
    activate API
    API->>Auth: Weryfikacja tokenu
    activate Auth
    Auth-->>API: 401 Token expired
    deactivate Auth
    API-->>Browser: 401 Unauthorized
    deactivate API
    Browser->>Auth: refreshSession(refresh_token)
    activate Auth
    Auth-->>Browser: nowy access_token
    deactivate Auth
    Browser->>Browser: Aktualizacja tokenu
    Browser->>API: Ponowienie GET /api/resource
    activate API
    API-->>Browser: 200 OK + dane
    deactivate API
```

</mermaid_diagram>

---

## Notatki implementacyjne

### Bezpieczeństwo cookies:

- `HttpOnly`: Zapobiega dostępowi JavaScript do tokenów
- `Secure`: Wymusza HTTPS (produkcja)
- `SameSite=Lax`: Ochrona przed CSRF
- Cookie name: preferowane `sb-access-token` i `sb-refresh-token`

### Czas życia tokenów:

- Access token: 3600s (1 godzina) - zdefiniowane w `supabase/config.toml`
- Refresh token: długoterminowy (domyślnie ~30 dni)
- Refresh token rotation: włączone (`enable_refresh_token_rotation = true`)

### Error handling:

- 400: Błędy walidacji (niepoprawny format danych)
- 401: Unauthorized (niepoprawne credentials, wygasły token)
- 409: Conflict (email już istnieje)
- 500: Internal Server Error (nieoczekiwane błędy, generowany uuid dla trace)

### Mapowanie błędów Supabase:

Funkcja `mapAuthError(code: string): string` w `src/lib/mapAuthError.ts`:

- `user_already_exists` → "Ten adres email jest już zarejestrowany"
- `invalid_credentials` → "Nieprawidłowy e-mail lub hasło"
- `email_not_confirmed` → "Potwierdź swój adres email" (MVP: wyłączone)
- default → "Wystąpił nieoczekiwany błąd. Spróbuj ponownie"

### React Context dla sesji:

Opcjonalny Context `AuthContext` w React może udostępniać:

- `user: User | null`
- `session: Session | null`
- `loading: boolean`
- Aktualizowany przez `supabase.auth.onAuthStateChange((event, session) => {...})`

### Middleware implementation:

```typescript
// src/middleware/index.ts
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // Sprawdzenie czy strona wymaga autentykacji
  const protectedPaths = ["/dashboard", "/planner", "/profile", "/history"];
  const isProtectedPath = protectedPaths.some((path) => context.url.pathname.startsWith(path));

  if (isProtectedPath) {
    const {
      data: { user },
      error,
    } = await context.locals.supabase.auth.getUser();

    if (error || !user) {
      return context.redirect("/auth/login");
    }
  }

  return next();
});
```

---

**Dokument utworzony:** 20 listopada 2025  
**Wersja:** 1.0  
**Autor:** AI Assistant (Claude Sonnet 4.5)
