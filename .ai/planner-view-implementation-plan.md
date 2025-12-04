# Plan implementacji widoku Planer Tygodnia

## 1. Przegląd

Widok „Planer Tygodnia” prezentuje edytowalną, dostępnościową siatkę 5 posiłków × 7 dni dla bieżącego tygodnia. Użytkownik może:

• przeglądać i edytować makroskładniki posiłków,
• ręcznie dodawać/edytować/usuwać posiłki,
• generować posiłki przy pomocy AI na podstawie zakresu kcal/białka i opisu,
• przesyłać miniatury zdjęć (≤ 1 MB) lub używać ikon SVG z AI.

Głównym celem jest uproszczenie planowania diety oraz zapewnienie zgodności z celami użytkownika.

## 2. Routing widoku

| Metoda | Ścieżka    | Opis                          |
| ------ | ---------- | ----------------------------- |
| GET    | `/planner` | Główny widok planera tygodnia |

## 3. Struktura komponentów

```
PlannerPage (route)
└─ WeekPlannerLayout
   ├─ PlannerToolbar
   │  ├─ WeekNavigation
   │  └─ GenerateMealButton
   ├─ WeekGrid  (role="grid")
   │  ├─ GridRow × 7 (dni)
   │  │  └─ MealCell × 5 (typy posiłków)
   │  │     └─ MealCard / AddMealButton
   ├─ MealDialog        (add / edit)
   ├─ GenerateMealDialog (AI)
   └─ MacroTooltip / Toasts
```

## 4. Szczegóły komponentów

### PlannerPage

- **Opis**: Strona routingu. Ładuje dane tygodnia, zarządza stanem globalnym planera.
- **Główne elementy**: `<WeekPlannerLayout />` opakowany w `<Suspense>`.
- **Obsługiwane interakcje**: ładowanie / odświeżanie danych, obsługa błędów globalnych.
- **Walidacja**: brak (deleguje niżej).
- **Typy**: `ActiveWeekState`, `PlannerContext`.
- **Propsy**: brak – routowany komponent.

### WeekPlannerLayout

- **Opis**: Układ strony – toolbar + grid, zapewnia kontekst React Context.
- **Główne elementy**: `PlannerToolbar`, `WeekGrid`, `Outlet` dla dialogów.
- **Interakcje**: przekazuje handler `openAddMeal(day, type)`.
- **Walidacja**: upewnia się, że `week` jest załadowany.
- **Typy**: `WeekDto`, `MealDto[]`.
- **Propsy**: `{ week: WeekDto, meals: MealDto[] }`.

### PlannerToolbar

- **Opis**: Pasek górny z nawigacją tygodni oraz przyciskiem AI.
- **Główne elementy**: `WeekNavigation`, `Button` (Generate AI).
- **Interakcje**: zmiana tygodnia, otwarcie `GenerateMealDialog`.
- **Walidacja**: brak.
- **Typy**: `WeekDto`.
- **Propsy**: `{ week, onPrev, onNext, onGenerate }`.

### WeekGrid

- **Opis**: Renderuje 7 wierszy (dni) i 5 kolumn (typy posiłków).
- **Główne elementy**: semantyczny `<div role="grid">`, `GridRow`, `MealCell`.
- **Interakcje**: nawigacja klawiszami strzałek, `Enter` = edycja/dodanie.
- **Walidacja**: dostępnościowa rola grid, fokus row/col.
- **Typy**: `GridCellVM`.
- **Propsy**: `{ cells: GridCellVM[], onCellClick }`.

### MealCell

- **Opis**: Pojedyncze pole siatki. Wyświetla `MealCard` albo pusty wariant.
- **Główne elementy**: przycisk `role="button"` z tooltipem.
- **Interakcje**: klik / Enter otwiera dialog (add/edit).
- **Walidacja**: sygnalizacja przekroczenia kcal (klasa `bg-red-50`).
- **Typy**: `GridCellVM`.
- **Propsy**: `{ cell: GridCellVM, onSelect(cell) }`.

### MealCard

- **Opis**: Kompaktowa karta posiłku (nazwa, kcal, protein, miniatura).
- **Główne elementy**: `Card`, `CardContent`, miniatura `<img>` lub SVG.
- **Interakcje**: klik otwiera `MealDialog` w trybie edycji.
- **Walidacja**: brak – read-only.
- **Typy**: `MealDto`.
- **Propsy**: `{ meal }`.

### MealDialog

- **Opis**: Modal do dodawania/edycji posiłku.
- **Główne elementy**: `Dialog`, `Form`, pola `Input`, `Textarea`, `ImageUploadInput`.
- **Interakcje**: submit = POST/PATCH; anuluj = zamknij.
- **Walidacja**: Zod (`MealFormSchema`) – nazwa ≠ pusta, kcal 1-3000, protein 1-300.
- **Typy**: `MealFormValues`, `CreateMealCommand`, `UpdateMealCommand`.
- **Propsy**: `{ mode: "add"|"edit", defaultValues?, onSuccess }`.

### GenerateMealDialog

- **Opis**: Modal wywołujący AI (US-005).
- **Główne elementy**: `InputRange` (kcal, protein), `Textarea` (opis), przycisk `Generate`, podgląd wyniku `MealPreviewCard`.
- **Interakcje**: `Generate` → POST `/meals/ai-generate`; `Save` → zapisuje do gridu.
- **Walidacja**: kcal/protein range jak wyżej.
- **Typy**: `AiGenerateMealCommand`, `MealDto`.
- **Propsy**: `{ weekId, day, mealType, onSave }`.

### WeekNavigation

- **Opis**: Strzałki ←/→ + label daty startowej tygodnia.
- **Główne elementy**: `Button`, `Heading`.
- **Interakcje**: zmiana stanu tygodnia.
- **Typy**: `WeekDto`.
- **Propsy**: `{ week, onPrev, onNext }`.

## 5. Typy

```ts
// View-model siatki
export interface GridCellVM {
  day: DayOfWeek;
  mealType: MealType;
  meal?: MealDto; // brak → puste pole
}

// Aktywny tydzień + dane pomocnicze
export interface ActiveWeekState {
  week: WeekDto;
  meals: MealDto[];
  totals: { kcal: number; protein: number };
}

// Formularz posiłku
export const MealFormSchema = z.object({
  name: z.string().min(1),
  kcal: z.number().int().min(1).max(3000),
  protein: z.number().int().min(1).max(300),
  ingredients: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  image: z.any().optional(), // File | undefined
});
export type MealFormValues = z.infer<typeof MealFormSchema>;
```

## 6. Zarządzanie stanem

• React Context `PlannerContext` przechowuje `ActiveWeekState` i funkcje mutujące.
• `usePlanner` – custom hook zwracający kontekst.
• Fetching danych: `useQuery` z TanStack Query (lub własny `useWeeks`) dla `/api/weeks` i `/api/weeks/{id}/meals`.
• Mutacje (add/edit/delete) poprzez `useMutation`, z optymistycznym UI.
• Fokus gridu: hook `useGridKeyboardNavigation`.

## 7. Integracja API

| Akcja                   | Endpoint                                | Metoda | Typy żądania                   | Typy odpowiedzi           |
| ----------------------- | --------------------------------------- | ------ | ------------------------------ | ------------------------- |
| POBIERZ bieżący tydzień | `/api/weeks?limit=1&history=false`      | GET    | _brak_                         | `PaginatedResponse<Week>` |
| POBIERZ posiłki         | `/api/weeks/{week_id}/meals` (przyszły) | GET    | _brak_                         | `MealDto[]`               |
| DODAJ posiłek           | `/api/weeks/{week_id}/meals`            | POST   | `CreateMealCommand`            | `MealDto`                 |
| EDYTUJ posiłek          | `/api/meals/{meal_id}`                  | PATCH  | `UpdateMealCommand`            | `MealDto`                 |
| AI Generate             | `/api/meals/ai-generate`                | POST   | `AiGenerateMealCommand`        | `MealDto`                 |
| Upload miniatury        | `/api/meals/{meal_id}/image`            | PUT    | `PutMealImageCommand` (`File`) | `204`                     |

## 8. Interakcje użytkownika

1. **Klik pustej komórki** → otwarcie `MealDialog` w trybie „add”.
2. **Klik istniejącego posiłku** → `MealDialog` w trybie „edit”.
3. **Przycisk AI** → `GenerateMealDialog` → generowanie → podgląd → zapis.
4. **Strzałki ←/→** → zmiana tygodnia; grid ponownie ładuje dane.
5. **Klawisze ↑/↓/←/→** wewnątrz gridu → przesuwa fokus.
6. **Tooltip na makrach** → pokazuje % celu.

## 9. Warunki i walidacja

| Pole         | Warunek UI                       | Błąd                        |
| ------------ | -------------------------------- | --------------------------- |
| `kcal`       | 1 ≤ kcal ≤ 3000                  | „Kcal poza zakresem”        |
| `protein`    | 1 ≤ protein ≤ 300                | „Białko poza zakresem”      |
| `image`      | size ≤ 1 MB, type = image/\*     | „Plik za duży / zły format” |
| Zak. energii | suma kcal > cel → highlight col. | kolor `bg-red-50`           |

Walidacja za pomocą Zod + komunikaty i aria-live.

## 10. Obsługa błędów

• 401 Unauthorized → redirect `/login`.
• 400 Validation → pokaż inline errors.
• 500 / network → toast „Coś poszło nie tak, spróbuj ponownie.”
• Upload > 1 MB → odrzuć przed wysłaniem, pokaż toast.
• AI timeout / quota → toast + możliwość ponownej próby.

## 11. Kroki implementacji

1. **Routing** – dodaj plik `src/pages/planner.astro` z lazy-loaded komponentem React.
2. **Service API** – utwórz `src/lib/apiClient.ts` z funkcjami `getWeek`, `getMeals`, `createMeal`…
3. **Typy & schematy** – dodaj `MealFormSchema`, `GridCellVM`.
4. **Context & hooks** – zaimplementuj `PlannerContext`, `usePlanner`, `useGridKeyboardNavigation`.
5. **Komponenty UI** – WeekGrid → MealCell → MealCard (z użyciem Shadcn/ui `Card`).
6. **Dialogi** – MealDialog + GenerateMealDialog (użyj Shadcn/ui `Dialog`, `Form`).
7. **Toolbar** – WeekNavigation + przycisk AI.
8. **Integracja API** – spin TanStack Query, mutacje z optymistyczną aktualizacją.
9. **Walidacja & A11y** – grid roles, trap focus w dialogach, opisy alt dla obrazów.
10. **Testy E2E** – scenariusze dodania, edycji, AI, przekroczeń kcal.
11. **Code Review & Merge** – upewnij się, że linter i testy przechodzą.
