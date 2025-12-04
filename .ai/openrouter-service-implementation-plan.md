# OpenRouter Service – Plan wdrożenia

## 1. Opis usługi

OpenRouter Service (ORS) to warstwa integracyjna odpowiadająca za komunikację pomiędzy aplikacją **Daily-Meal-Plan** a usługą [openrouter.ai](https://openrouter.ai). Zapewnia:

- Ujednolicony interfejs do wysyłania zapytań LLM-owych.
- Obsługę różnych modeli udostępnianych przez OpenRouter (OpenAI, Anthropic itp.).
- Walidację oraz serializację komunikatów (system/user) i schematów `response_format`.
- Mechanizmy bezpieczeństwa (rate-limit, ukrycie kluczy API, sanitizacja promptów).
- Pełną obsługę błędów z automatycznym ponawianiem i fallbackiem.
- Śledzenie kosztów oraz logowanie metryk.

## 2. Opis konstruktora

```ts
// src/lib/openrouter.service.ts
export class OpenRouterService {
  constructor(options: {
    apiKey: string; // OpenRouter API Key (ENV > runtime injection)
    defaultModel?: string; // Domyślny model (np. "openai/gpt-4o" )
    defaultParams?: ModelParams; // Domyślne parametry temperatury, max_tokens itp.
    httpClient?: FetchLike; // opcjonalnie custom fetch (np. node-fetch z proxy)
  });
}
```

Konstruktor przyjmuje konfigurację globalną oraz wstrzykiwany klient HTTP (dla testów). Klucz API **nigdy** nie trafia do bundla frontendowego – jest pobierany z `import.meta.env.OPENROUTER_API_KEY` w warstwie serwera (`/src/pages/api/*` lub `Astro.server`).

## 3. Publiczne metody i pola

| Metoda                         | Zwraca                 | Opis                                                                                            |
| ------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `chat(messages, opts?)`        | `Promise<LLMResponse>` | Wysyła tablicę komunikatów (`SystemMessage \| UserMessage \| AssistantMessage`) i mapuje wynik. |
| `withModel(model)`             | `OpenRouterService`    | Zwraca instancję z nadpisanym modelem (fluenty).                                                |
| `estimateCost(tokens, model?)` | `number`               | Szacuje koszt zapytania wg cennika OpenRouter.                                                  |
| `getRemainingBudget()`         | `number`               | Zwraca limit budżetowy ustawiony na kluczu API (dane z nagłówka `x-remaining-budget`).          |
| `setRateLimit(rps)`            | `void`                 | Konfiguruje wewnętrzny limiter (np. Bottleneck).                                                |

### Typy publiczne (src/types.ts)

```ts
export type Role = "system" | "user" | "assistant";
export interface Message<T extends Role = Role> {
  role: T;
  content: string;
}
export interface ResponseFormatSchema {
  type: "json_schema";
  json_schema: { name: string; strict: true; schema: object };
}
export interface ChatOptions {
  model?: string;
  params?: ModelParams;
  responseFormat?: ResponseFormatSchema;
  signal?: AbortSignal;
}
export interface ModelParams {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  [k: string]: unknown;
}
export interface LLMResponse {
  raw: Response;
  usage: TokenUsage;
  message: Message<"assistant">;
}
```

## 4. Prywatne metody i pola

| Prywatne             | Typ                      | Cel                                                         |
| -------------------- | ------------------------ | ----------------------------------------------------------- |
| `#fetch`             | `FetchLike`              | Niskopoziomowe wywołanie HTTP (z retry).                    |
| `#buildHeaders`      | `() => Headers`          | Tworzy nagłówki `Authorization`, `Content-Type`, `X-Title`. |
| `#serializeMessages` | `(msgs) => APIPayload[]` | Zamienia wewn. strukturę na payload OpenRouter.             |
| `#handleError`       | `(e, ctx) => never`      | Mapuje błędy do custom `OpenRouterError`.                   |
| `#limiter`           | `Bottleneck`             | Śledzi RPS oraz kolejkuje nadmiarowe żądania.               |
| `#logger`            | `pino`/`console`         | Logowanie zapytań, kosztów i czasów odpowiedzi.             |

## 5. Obsługa błędów

| #   | Scenariusz                               | Zachowanie                                                                    |
| --- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | `401/403` – błędny lub wygasły klucz API | Rzuca `AuthError`, triggeruje alert DevOps.                                   |
| 2   | `429` – rate limit                       | Exponential backoff (max 3 prób), potem `RateLimitError`.                     |
| 3   | `5xx` – błąd po stronie OpenRouter       | Retry (jitter). Po przekroczeniu limitu przekazuje `ServiceUnavailableError`. |
| 4   | Przerwane połączenie (`AbortError`)      | Propaguje do wywołującego; klient może ponowić.                               |
| 5   | Źle zdef. `response_format`              | Walidacja Zod przed wywołaniem, rzuca `SchemaValidationError`.                |
| 6   | Timeout lokalny (np. 30 s)               | `TimeoutError`, logujemy do Sentry.                                           |

## 6. Kwestie bezpieczeństwa

- Trzymaj `OPENROUTER_API_KEY` wyłącznie po stronie serwera (`.env`, `astro.config.mjs` → `vite.define`).
- Używaj `httpOnly`, `secure`, `sameSite=lax` dla ewentualnego cache’u tokenów.
- Sanityzuj wejście użytkownika (prompt-injection mitigation: regex blacklist, system_msg guard).
- Loguj nagłówki **bez** klucza Authorization.
- Ustaw globalny budżet w dashboardzie OpenRouter i wymuszaj `x-remaining-budget` > 0.
- Unikaj streamowania bez SSL (HTTP/2 – Astro `output:"server"`).

## 7. Plan wdrożenia krok po kroku

| Krok | Plik/Katalog                    | Akcja                                                        |
| ---- | ------------------------------- | ------------------------------------------------------------ |
| 1    | `.env.example`                  | Dodaj `OPENROUTER_API_KEY=""` i opis.                        |
| 2    | `src/env.d.ts`                  | Poszerz o `OPENROUTER_API_KEY`.                              |
| 3    | `src/lib/openrouter.service.ts` | Implementuj klasę wg. specyfikacji powyżej.                  |
| 4    | `src/types.ts`                  | Dodaj typy `Message`, `ResponseFormatSchema`, `ModelParams`. |
| 5    | `src/pages/api/chat/index.ts`   | Utwórz endpoint proxy:                                       |

- Waliduje body (Zod).
- Tworzy instancję ORS (klucz z ENV).
- Zwraca `LLMResponse.message.content` albo strumień SSE. |
  | 6 | **Unit-tests** (`vitest`) | Mock fetch, sprawdź: buildPayload, retry, error mapping. |
  | 7 | **E2E** (`cypress`) | Scenariusz: prompt → UI → odpowiedź JSON zgodna ze schematem. |
  | 8 | CI/CD (GitHub Actions) | Dodaj secret `OPENROUTER_API_KEY`.
- Workflow `test → build → deploy`. |
  | 9 | Monitoring | Podłącz Sentry + pino-pretty. |
  |10 | Dokumentacja | Utrzymuj ten plik, README oraz `docs/API.md`. |

### Konfiguracja komunikatów i `response_format`

Przykład wywołania z system/user messages i odpowiedzią JSON:

```ts
const ors = new OpenRouterService({ apiKey: env.OPENROUTER_API_KEY });
const response = await ors.chat(
  [
    { role: "system", content: "Jesteś dietetykiem, który układa tygodniowy jadłospis." },
    { role: "user", content: "Stwórz jadłospis 2000 kcal na poniedziałek." },
  ],
  {
    model: "openai/gpt-4o",
    params: { temperature: 0.2, top_p: 0.95 },
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "meal_plan_day",
        strict: true,
        schema: {
          type: "object",
          properties: {
            breakfast: { type: "string" },
            lunch: { type: "string" },
            dinner: { type: "string" },
            calories: { type: "number" },
          },
          required: ["breakfast", "lunch", "dinner", "calories"],
        },
      },
    },
  }
);
console.log(response.message.content); // <- zwrócony JSON zgodny ze schematem
```

---

**Gotowe!** Wdrożenie zgodnie z tym przewodnikiem zapewni bezpieczeństwo, skalowalność i spójny interfejs API do komunikacji z OpenRouter w projekcie **Daily-Meal-Plan**.
