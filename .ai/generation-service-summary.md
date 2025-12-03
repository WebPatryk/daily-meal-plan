# AI Meal Generation Service - Podsumowanie Implementacji

## 📋 Przegląd

Zaimplementowano dedykowany serwis `generation.service.ts` do generowania posiłków przy użyciu AI (OpenRouter + GPT-4o-mini).

## 🏗️ Architektura

### 1. **generation.service.ts** (Nowy plik)
**Lokalizacja:** `src/lib/generation.service.ts`

**Odpowiedzialności:**
- Zarządzanie generowaniem posiłków AI
- Walidacja parametrów wejściowych
- Budowanie promptów w języku polskim
- Parsowanie i walidacja odpowiedzi AI
- Sprawdzanie zgodności z wymaganiami żywieniowymi

**Kluczowe klasy i funkcje:**
```typescript
// Główny serwis
export class MealGenerationService {
  async generateMeal(params: MealGenerationParams): Promise<GeneratedMeal>
}

// Factory function
export function createMealGenerationService(): MealGenerationService

// Typy
export interface MealGenerationParams
export interface GeneratedMeal
export class MealGenerationError extends Error
```

**Funkcjonalności:**
- ✅ Walidacja zakresów kalorii (1-3000 kcal)
- ✅ Walidacja zakresów białka (1-300g)
- ✅ Weryfikacja długości opisu (1-500 znaków)
- ✅ Structured output z JSON Schema
- ✅ Tolerancja ±10% dla wartości odżywczych
- ✅ Prompty w języku polskim
- ✅ Szczegółowe komunikaty błędów

### 2. **ai-generate.ts** (Zaktualizowany endpoint)
**Lokalizacja:** `src/pages/api/meals/ai-generate.ts`

**Zmiany:**
- ❌ Usunięto bezpośrednie wywołania OpenRouter
- ✅ Dodano użycie `MealGenerationService`
- ✅ Dodano obsługę `MealGenerationError`
- ✅ Uproszczono logikę do ~50 linii kodu

**Przed:**
```typescript
const openRouter = createOpenRouterService();
const prompt = `Generate a meal...`;
const response = await openRouter.chat([...], {...});
const aiMeal = JSON.parse(response.message.content);
```

**Po:**
```typescript
const generationService = createMealGenerationService();
const aiMeal = await generationService.generateMeal({
  kcal_range, protein_range, description,
  day_of_week, meal_type
});
```

## 📊 Flow Użytkownika

### 1. **Użytkownik klika "Generuj AI"**
   - Otwiera się `GenerateMealDialog`
   - Wybiera parametry: kalorie, białko, opis, dzień, typ posiłku

### 2. **Klik "Generuj"**
   ```
   GenerateMealDialog.handleGenerate()
   → apiClient.generateMealWithAI({ save: false })
   → POST /api/meals/ai-generate
   → MealGenerationService.generateMeal()
   → OpenRouterService.chat() [GPT-4o-mini]
   → Zwraca GeneratedMeal (preview)
   ```

### 3. **Podgląd wygenerowanego posiłku**
   - Wyświetla `MealCard` z:
     - Nazwą posiłku
     - Wartościami odżywczymi (kcal, białko)
     - Listą składników
     - Krokami przygotowania

### 4. **Klik "Zapisz"**
   ```
   GenerateMealDialog.handleSaveGenerated()
   → WeekPlannerLayout.handleSaveGeneratedMeal()
   → PlannerContext.addMeal()
   → apiClient.createMeal()
   → POST /api/weeks/{week_id}/meals
   → Zapisuje w bazie danych
   → Odświeża UI (nowy kafelek w gridzie)
   ```

## 🔐 Konfiguracja

### Zmienne środowiskowe
```env
OPENROUTER_API_KEY=sk-or-v1-xxx...
```

**Lokalizacje:**
- `.env` (główny plik, git-ignored)
- `.env.example` (szablon)
- `src/env.d.ts` (TypeScript types)

### Model AI
- **Model:** `openai/gpt-4o-mini`
- **Temperatura:** 0.8 (kreatywność)
- **Max tokens:** 1500
- **Response format:** JSON Schema (strict mode)

## 🧪 Testowanie

### Test 1: Podstawowe generowanie
1. Uruchom aplikację: `npm run dev`
2. Zaloguj się do aplikacji
3. Przejdź do planera tygodniowego
4. Kliknij **"Generuj AI"**
5. Wypełnij formularz:
   - Kalorie: 400-600 kcal
   - Białko: 25-40g
   - Opis: "Zdrowe śniadanie z owocami"
   - Dzień: Poniedziałek
   - Typ: Śniadanie
6. Kliknij **"Generuj"**
7. ✅ Sprawdź czy AI wygenerowało posiłek
8. Kliknij **"Zapisz"**
9. ✅ Sprawdź czy posiłek pojawił się w odpowiednim kafelku

### Test 2: Walidacja zakresów
1. Ustaw kalorie: 2900-3000 kcal
2. Ustaw białko: 250-300g
3. Opisz: "Duży posiłek dla sportowca"
4. ✅ Sprawdź czy działa poprawnie z ekstremalnymi wartościami

### Test 3: Obsługa błędów
1. Wyłącz internet (lub użyj nieprawidłowego klucza API)
2. Spróbuj wygenerować posiłek
3. ✅ Sprawdź czy wyświetla się odpowiedni komunikat błędu

### Test 4: Różne typy posiłków
Wygeneruj:
- Śniadanie (~400 kcal)
- Drugie śniadanie (~200 kcal)
- Obiad (~700 kcal)
- Podwieczorek (~250 kcal)
- Kolacja (~500 kcal)

✅ Sprawdź czy AI dostosowuje się do kontekstu

### Test 5: Różne opisy
Przetestuj z:
- "Wegańskie"
- "Bez laktozy"
- "Wysokobiałkowe"
- "Niskokaloryczne"
- "Dla dzieci"

✅ Sprawdź czy AI uwzględnia preferencje

## 📁 Struktura plików

```
src/
├── lib/
│   ├── openrouter.service.ts      # Komunikacja z OpenRouter API
│   ├── openrouter.types.ts        # Typy dla OpenRouter
│   ├── generation.service.ts      # 🆕 Serwis generowania AI
│   ├── apiClient.ts               # Klient API frontendowy
│   └── schemas/
│       └── meals.ts               # Zod schemas
├── pages/
│   └── api/
│       └── meals/
│           └── ai-generate.ts     # 🔄 Zaktualizowany endpoint
├── components/
│   └── planner/
│       ├── GenerateMealDialog.tsx # Modal generowania
│       ├── WeekPlannerLayout.tsx  # Główny layout
│       └── PlannerContext.tsx     # State management
└── types.ts                       # Shared types
```

## 🎯 Kluczowe zmiany

### Dodane pliki
- ✅ `src/lib/generation.service.ts` (404 linie)

### Zmodyfikowane pliki
- ✅ `src/pages/api/meals/ai-generate.ts` (uproszczony)

### Bez zmian (już działały)
- ✅ `src/components/planner/GenerateMealDialog.tsx`
- ✅ `src/components/planner/WeekPlannerLayout.tsx`
- ✅ `src/lib/apiClient.ts`
- ✅ `src/env.d.ts`

## 💡 Najlepsze praktyki

### 1. Separation of Concerns
- **OpenRouterService**: Niskopoziomowa komunikacja z API
- **MealGenerationService**: Logika biznesowa generowania posiłków
- **API Endpoint**: Autoryzacja, walidacja, orchestration
- **UI Components**: Interakcja z użytkownikiem

### 2. Error Handling
```typescript
try {
  const meal = await service.generateMeal(params);
} catch (error) {
  if (error instanceof MealGenerationError) {
    // Obsłuż błąd walidacji lub generowania
  }
  // Inne błędy
}
```

### 3. Type Safety
- Wszystkie typy są ściśle określone
- Brak `any` w kluczowych miejscach
- JSON Schema z `strict: true`

### 4. Testability
- Dependency injection (`constructor(openRouter?)`)
- Factory functions dla łatwego mockowania
- Separated concerns umożliwiają unit testy

## 🚀 Dalszy rozwój

### Możliwe ulepszenia:
1. **Cache'owanie promptów** - zmniejszenie kosztów API
2. **Batch generation** - generowanie wielu posiłków naraz
3. **User preferences** - zapamiętywanie preferencji dietetycznych
4. **Cost tracking** - monitoring kosztów OpenRouter
5. **A/B testing** - testowanie różnych promptów
6. **Multilingual** - wsparcie dla innych języków
7. **Recipe variations** - warianty tego samego posiłku
8. **Nutritional analysis** - analiza makro i mikro elementów

## 📚 Dokumentacja

### OpenRouter
- Dokumentacja: https://openrouter.ai/docs
- Modele: https://openrouter.ai/models
- Pricing: https://openrouter.ai/pricing

### GPT-4o-mini
- Model: `openai/gpt-4o-mini`
- Context: 128k tokens
- Cost: ~$0.15/1M input tokens, ~$0.60/1M output tokens
- Avg response: ~500 tokens (~$0.0003/request)

## ✅ Checklist wdrożenia

- [x] Utworzenie `generation.service.ts`
- [x] Aktualizacja `ai-generate.ts` endpoint
- [x] Weryfikacja zmiennych środowiskowych
- [x] Sprawdzenie TypeScript types
- [x] Code review (brak błędów lintera)
- [x] **Naprawa walidacji `week_id`** (zmiana z `z.string().uuid()` na `z.number().int().positive()`)
- [ ] Testy manualne (wymaga uruchomienia aplikacji)
- [ ] Weryfikacja klucza API OpenRouter
- [ ] Deploy na produkcję

## 🐛 Troubleshooting

### Problem: "OPENROUTER_API_KEY is not set"
**Rozwiązanie:** 
```bash
# Dodaj do .env
OPENROUTER_API_KEY=sk-or-v1-xxx...
```

### Problem: "Authentication failed"
**Rozwiązanie:** Sprawdź poprawność klucza API w OpenRouter dashboard

### Problem: "Rate limit exceeded"
**Rozwiązanie:** Zaczekaj lub zwiększ limit w OpenRouter

### Problem: "Expected string, received number" dla week_id
**Rozwiązanie:** ✅ **NAPRAWIONE** - `week_id` w bazie to `number` (integer), nie UUID string

### Problem: Meal nie zapisuje się
**Rozwiązanie:** Sprawdź console.log, upewnij się że user jest zalogowany

### Problem: Response nie przechodzi walidacji
**Rozwiązanie:** Sprawdź czy wartości mieszczą się w zakresach (±10% tolerancja)

---

**Status:** ✅ Gotowe do testowania
**Ostatnia aktualizacja:** 2025-12-03

