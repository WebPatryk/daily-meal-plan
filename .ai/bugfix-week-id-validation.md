# Bugfix: week_id Validation Error

## 🐛 Problem

Użytkownik otrzymywał błąd walidacji podczas generowania posiłku AI:

```json
{
  "error": "Invalid request body",
  "details": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "number",
        "path": ["week_id"],
        "message": "Expected string, received number"
      }
    ]
  }
}
```

## 🔍 Analiza

### Root Cause

Niezgodność typów między:

1. **Baza danych** (`database.types.ts`):

   ```typescript
   weeks: {
     Row: {
       week_id: number; // ← INTEGER (SERIAL)
     }
   }
   ```

2. **Walidacja Zod** (`ai-generate.ts`):
   ```typescript
   const schema = z.object({
     week_id: z.string().uuid(), // ← Oczekiwano UUID string
   });
   ```

### Dlaczego wystąpił?

W projekcie `week_id` jest typu `INTEGER` (auto-increment SERIAL), nie `UUID`. Frontend poprawnie przekazywał `number`, ale backend oczekiwał `string` UUID.

## ✅ Rozwiązanie

### Zmiana w `src/pages/api/meals/ai-generate.ts`

**Przed:**

```typescript
week_id: z.string().uuid(),
```

**Po:**

```typescript
week_id: z.number().int().positive(),
```

### Uzasadnienie

- `z.number()` - akceptuje typ number
- `.int()` - wymaga liczby całkowitej (integer)
- `.positive()` - wymaga wartości > 0 (week_id zawsze dodatni)

## 🧪 Weryfikacja

### Test 1: Poprawne wywołanie

```typescript
// Request
{
  "week_id": 123,  // ← number
  "kcal_range": { "min": 400, "max": 600 },
  "protein_range": { "min": 25, "max": 40 },
  "description": "Zdrowe śniadanie",
  "day_of_week": "monday",
  "meal_type": "breakfast",
  "save": false
}

// Response: 200 OK
```

### Test 2: Nieprawidłowy typ

```typescript
// Request
{
  "week_id": "abc",  // ← string zamiast number
  // ... rest
}

// Response: 400 Bad Request
{
  "error": "Invalid request body",
  "details": {
    "issues": [{
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["week_id"]
    }]
  }
}
```

### Test 3: Ujemna wartość

```typescript
// Request
{
  "week_id": -5,  // ← ujemna liczba
  // ... rest
}

// Response: 400 Bad Request
{
  "error": "Invalid request body",
  "details": {
    "issues": [{
      "code": "too_small",
      "path": ["week_id"],
      "message": "Number must be greater than 0"
    }]
  }
}
```

## 📋 Powiązane zmiany

### Pliki zmodyfikowane

- ✅ `src/pages/api/meals/ai-generate.ts` (linia 57)

### Pliki bez zmian (już poprawne)

- ✅ `src/types.ts` - używa `Tables<"weeks">["week_id"]` (number)
- ✅ `src/db/database.types.ts` - definiuje `week_id: number`
- ✅ `src/components/planner/GenerateMealDialog.tsx` - przekazuje number
- ✅ `src/components/planner/WeekPlannerLayout.tsx` - przekazuje number

## 🔄 Flow poprawny

```
UI Component (WeekPlannerLayout)
  ↓ weekId={state.week.week_id}  ← number
GenerateMealDialog
  ↓ week_id: weekId  ← number
apiClient.generateMealWithAI()
  ↓ body: { week_id: number }  ← number
POST /api/meals/ai-generate
  ↓ Zod validation: z.number().int().positive() ✅
Backend processing
  ↓ week_id: number
Database query
  ↓ WHERE week_id = $1 (number) ✅
Success!
```

## 📚 Lessons Learned

### 1. Type Consistency

Zawsze sprawdzaj zgodność typów między:

- Database schema
- TypeScript types
- API validation (Zod)
- Frontend types

### 2. Auto-generated Types

Korzystaj z auto-generated database types:

```typescript
// ✅ Dobre - używa typu z bazy
week_id: Tables < "weeks" > ["week_id"];

// ❌ Złe - hardcoded typ
week_id: string; // założenie że UUID
```

### 3. Validation Testing

Testuj walidację z różnymi typami:

- Poprawny typ
- Nieprawidłowy typ
- Edge cases (null, undefined, negative)

## 🚀 Status

- ✅ **Naprawione** - 2025-12-03
- ✅ **Przetestowane** - walidacja działa poprawnie
- ✅ **Udokumentowane** - ten plik + update summary

---

**Czas naprawy:** ~5 minut  
**Severity:** Medium (blocking feature)  
**Impact:** Wszystkie próby generowania AI kończyły się błędem  
**Resolution:** Zmiana walidacji z `z.string().uuid()` na `z.number().int().positive()`


