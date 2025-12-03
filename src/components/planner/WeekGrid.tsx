import { useEffect, useMemo } from "react";
import type { GridCellVM, DayOfWeek, MealType } from "../../types";
import { MealCell } from "./MealCell";
import { useGridKeyboardNavigation } from "./hooks/useGridKeyboardNavigation";

interface WeekGridProps {
  cells: GridCellVM[];
  onCellClick: (cell: GridCellVM) => void;
  caloriesOverLimit?: boolean;
}

// Constants for grid structure
const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const MEAL_TYPES: MealType[] = ["breakfast", "second_breakfast", "lunch", "snack", "dinner"];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Poniedziałek",
  tuesday: "Wtorek",
  wednesday: "Środa",
  thursday: "Czwartek",
  friday: "Piątek",
  saturday: "Sobota",
  sunday: "Niedziela",
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "II śniadanie",
  lunch: "Obiad",
  snack: "Podwieczorek",
  dinner: "Kolacja",
};

/**
 * WeekGrid - renders a 7×5 grid of meal cells with keyboard navigation.
 * Implements ARIA grid pattern for accessibility.
 */
export function WeekGrid({ cells, onCellClick, caloriesOverLimit = false }: WeekGridProps) {
  const { focusedPosition, isFocused, handleKeyDown } = useGridKeyboardNavigation({
    days: DAYS,
    mealTypes: MEAL_TYPES,
    onCellSelect: (position) => {
      // Find the cell that matches the focused position
      const cell = cells.find((c) => c.day === position.day && c.mealType === position.mealType);
      if (cell) {
        onCellClick(cell);
      }
    },
  });

  // Set up keyboard event listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => handleKeyDown(e);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKeyDown]);

  // Organize cells into a 2D structure for rendering
  const gridData = useMemo(() => {
    return DAYS.map((day) => {
      return MEAL_TYPES.map((mealType) => {
        return cells.find((cell) => cell.day === day && cell.mealType === mealType) || { day, mealType };
      });
    });
  }, [cells]);

  return (
    <div className="space-y-4">
      {/* Grid header - meal type labels */}
      <div className="grid grid-cols-[120px_repeat(7,1fr)] gap-3">
        <div className="font-medium text-sm text-muted-foreground"></div>
        {DAYS.map((day) => (
          <div key={day} className="font-semibold text-sm text-center">
            {DAY_LABELS[day]}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div
        role="grid"
        aria-label="Planer posiłków na tydzień"
        className="space-y-3"
        data-testid="week-grid"
        tabIndex={0}
      >
        {MEAL_TYPES.map((mealType, mealIndex) => (
          <div key={mealType} role="row" className="grid grid-cols-[120px_repeat(7,1fr)] gap-3 items-start">
            {/* Row header - meal type label */}
            <div
              className="font-medium text-sm text-muted-foreground flex items-center h-full pt-3"
              role="rowheader"
              id={`meal-type-${mealType}`}
            >
              {MEAL_TYPE_LABELS[mealType]}
            </div>

            {/* Cells for each day */}
            {DAYS.map((day, dayIndex) => {
              const cell = gridData[dayIndex][mealIndex] as GridCellVM;
              const cellIsFocused = isFocused(day, mealType);

              return (
                <div
                  key={`${day}-${mealType}`}
                  role="gridcell"
                  aria-labelledby={`meal-type-${mealType}`}
                  tabIndex={cellIsFocused ? 0 : -1}
                >
                  <MealCell
                    cell={cell}
                    onSelect={onCellClick}
                    isFocused={cellIsFocused}
                    isOverCalories={caloriesOverLimit}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Grid instructions for keyboard users */}
      <div className="text-xs text-muted-foreground text-center mt-4">
        <p>Użyj strzałek ↑↓←→ do nawigacji, Enter aby edytować posiłek</p>
      </div>
    </div>
  );
}
