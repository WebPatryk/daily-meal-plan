## Specyfikacja techniczna: Moduł Rejestracji, Logowania i Odzyskiwania Hasła

### Kontekst projektu

Aplikacja: **Daily Meal Plan**  
Tech-stack: Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase (PostgreSQL + Auth)

Wymagania biznesowe: US-001 (rejestracja), US-002 (logowanie) – patrz `prd.md` wiersze 36-52.

> Uwaga: na potrzeby **MVP** zrezygnowano z weryfikacji e-mail oraz resetu hasła, mimo że w oryginalnym US-001 przewidziano e-mail weryfikacyjny. Zmiana została uzgodniona z Product Ownerem i odnotowana w tym dokumencie.

---

# 1. Architektura interfejsu użytkownika

## 1.1 Struktura stron Astro

| Ścieżka          | Layout             | Przeznaczenie                | Dostęp (auth)   |
| ---------------- | ------------------ | ---------------------------- | --------------- |
| `/auth/register` | `AuthLayout.astro` | Formularz rejestracji        | `anon`          |
| `/auth/login`    | `AuthLayout.astro` | Formularz logowania          | `anon`          |
| `/dashboard`     | `AppLayout.astro`  | Strona główna po zalogowaniu | `authenticated` |

_`AuthLayout.astro`_ – minimalistyczny layout (centracja formularza, brak nawigacji).  
_`AppLayout.astro`_ – pełna nawigacja, header + sidebar, wymaga aktywnej sesji.

## 1.2 Komponenty React (client-side)

| Plik               | Rola                                                   | Walidacja       | Akcje                                |
| ------------------ | ------------------------------------------------------ | --------------- | ------------------------------------ |
| `RegisterForm.tsx` | pola : email, password, confirmPassword                | `zod@^3` schema | `supabase.auth.signUp()`             |
| `LoginForm.tsx`    | email, password, „remember me”                         | `zod`           | `supabase.auth.signInWithPassword()` |
| `AuthError.tsx`    | wyświetlanie błędów mapowanych na przyjazne komunikaty | –               | –                                    |

Każdy formularz:

1. Weryfikacja pól lokalnie przy submit – blokada przy niepoprawnych danych.
2. Po wysłaniu – stan _loading_, obsługa sukcesu/porażki.
3. Błędy Supabase mapowane w `mapAuthError(code): string`.

## 1.3 Przepływy i komunikaty

1. Rejestracja
   1.1 Sukces ⇒ redirect `/dashboard` + toast _„Rejestracja zakończona, witaj!”_  
   1.2 Błąd (np. email in use) ⇒ `AuthError` inline.
2. Logowanie
   2.1 Sukces ⇒ redirect `redirectTo` || `/dashboard`  
   2.2 Błąd credential ⇒ komunikat _„Nieprawidłowy e-mail lub hasło”_.

---

# 2. Logika backendowa

## 2.1 Endpointy API (`src/pages/api/auth/*`)

| Metoda | Ścieżka              | Handler       | Opis                                                  |
| ------ | -------------------- | ------------- | ----------------------------------------------------- |
| POST   | `/api/auth/register` | `register.ts` | Proxy do `supabase.auth.signUp()` dla SSR call (edge) |
| POST   | `/api/auth/login`    | `login.ts`    | Proxy do `supabase.auth.signInWithPassword()`         |
| POST   | `/api/auth/logout`   | `logout.ts`   | `supabase.auth.signOut()`                             |

Rationale: trzymamy logikę w API, front wywołuje fetch; pozwala to ustawiać cookies HttpOnly po stronie serwera.

## 2.2 Walidacja

Każdy handler importuje wspólny `schemas.ts` (zod) i waliduje `req.body` → 400 przy błędach.

## 2.3 Obsługa wyjątków

- Najczęstsze kody Supabase mapowane na HTTP 409 (duplication), 401 (bad creds).
- Nieoczekiwane – log `console.error`, zwrot 500 + `error_id` (uuid) dla łatwiejszego trace.

## 2.4 SSR & astro.config.mjs

W `astro.config.mjs` już włączony adapter (np. vercel).  
Endpointy operują na edge-friendly supabase client (`supabaseClient` z `src/db`).  
SSR stron korzystających z `AppLayout.astro` wywołuje `context.locals.supabase.auth.getUser()` w `onRequest` middleware – redirect 302→`/auth/login` jeśli brak sesji.

---

# 3. System autentykacji (Supabase Auth)

1. **Rejestracja** `signUp({ email, password })` – email confirmation wyłączone w ustawieniach Supabase.
2. **Logowanie** `signInWithPassword({ email, password })` – zwraca `session`, zapisywana w cookie.
3. **Wylogowanie** `signOut()` – czyści storage + cookie.
4. **Odzyskiwanie sesji** – na kliencie `supabase.auth.onAuthStateChange` → aktualizacja kontekstu React.

## 3.1 Bezpieczeństwo

- HTTPS-only cookies, `SameSite=Lax`, `Secure`, `HttpOnly`.
- Brak przechowywania haseł w bazie; Supabase zarządza procesem.
- RLS domyślnie na wszystkich tabelach.
- Polityki `authenticated` vs `anon` na przyszłe tabele użytkownika.

## 3.2 Publiczne kontrakty TypeScript

```ts
// src/types.ts (wycinek)
export interface AuthCredentials {
  email: string;
  password: string;
}
```

---

# 4. Kroki wdrożeniowe

1. Utworzyć layout `AuthLayout.astro`.
2. Dodać strony Astro w `/src/pages/auth/*` i formularze React.
3. Dodać `schemas.ts` (zod) & `mapAuthError.ts`.
4. Utworzyć endpointy API.
5. Middleware guard w `src/middleware/index.ts` – redirect do `/auth/login` przy braku sesji.
6. Testy e2e Playwright: rejestracja, logowanie.

---

> Dokument opracował: **AI-Assistant (o3)**  
> Data: 20-11-2025  
> Wersja specyfikacji: 1.0
