import { useEffect, useMemo, useState } from "react";
import type { GridCellVM, DayOfWeek, MealType } from "../../types";
import { MealCell } from "./MealCell";
import { useGridKeyboardNavigation } from "./hooks/useGridKeyboardNavigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const DAY_LABELS_SHORT: Record<DayOfWeek, string> = {
  monday: "Pn",
  tuesday: "Wt",
  wednesday: "Śr",
  thursday: "Czw",
  friday: "Pt",
  saturday: "Sob",
  sunday: "Ndz",
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Śniadanie",
  second_breakfast: "II śniadanie",
  lunch: "Obiad",
  snack: "Podwieczorek",
  dinner: "Kolacja",
};

/**
 * WeekGrid - renders a responsive grid of meal cells with keyboard navigation.
 * Shows 3 days on mobile, 5 on tablet, 7 on desktop.
 * Implements ARIA grid pattern for accessibility.
 */
export function WeekGrid({ cells, onCellClick, caloriesOverLimit = false }: WeekGridProps) {
  const [dayOffset, setDayOffset] = useState(0);
  const [visibleDaysCount, setVisibleDaysCount] = useState(3);

  // Track viewport size to determine how many days to show
  useEffect(() => {
    const updateVisibleDays = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        // lg breakpoint
        setVisibleDaysCount(7);
        setDayOffset(0); // Reset offset when showing all days
      } else if (width >= 640) {
        // sm breakpoint
        setVisibleDaysCount(5);
        // Reset offset if it's beyond the new range
        setDayOffset((prev) => (prev >= 5 ? 0 : prev));
      } else {
        setVisibleDaysCount(3);
        // Reset offset if it's beyond the new range
        setDayOffset((prev) => (prev >= 6 ? 0 : prev));
      }
    };

    updateVisibleDays();
    window.addEventListener("resize", updateVisibleDays);
    return () => window.removeEventListener("resize", updateVisibleDays);
  }, []);

  // Calculate visible days based on offset and count
  const visibleDays = useMemo(() => {
    return DAYS.slice(dayOffset, dayOffset + visibleDaysCount);
  }, [dayOffset, visibleDaysCount]);

  // Navigation handlers
  const canGoPrev = dayOffset > 0;
  const canGoNext = dayOffset + visibleDaysCount < DAYS.length;

  const handlePrevDays = () => {
    if (canGoPrev) {
      setDayOffset((prev) => Math.max(0, prev - visibleDaysCount));
    }
  };

  const handleNextDays = () => {
    if (canGoNext) {
      setDayOffset((prev) => Math.min(DAYS.length - visibleDaysCount, prev + visibleDaysCount));
    }
  };

  const { focusedPosition, isFocused, handleKeyDown } = useGridKeyboardNavigation({
    days: visibleDays, // Only navigate through visible days
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
    return visibleDays.map((day) => {
      return MEAL_TYPES.map((mealType) => {
        return cells.find((cell) => cell.day === day && cell.mealType === mealType) || { day, mealType };
      });
    });
  }, [cells, visibleDays]);

  return (
    <div className="space-y-4">
      {/* Navigation controls - visible only when not all days are shown */}
      <div className="flex items-center justify-between lg:hidden">
        <Button variant="outline" size="sm" onClick={handlePrevDays} disabled={!canGoPrev} aria-label="Poprzednie dni">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Poprzednie
        </Button>

        <div className="text-sm text-muted-foreground">
          Dni {dayOffset + 1}-{dayOffset + visibleDays.length} z {DAYS.length}
        </div>

        <Button variant="outline" size="sm" onClick={handleNextDays} disabled={!canGoNext} aria-label="Następne dni">
          Następne
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Grid header - day labels */}
      <div className="grid grid-cols-[80px_repeat(3,1fr)] sm:grid-cols-[96px_repeat(5,1fr)] lg:grid-cols-[120px_repeat(7,1fr)] gap-2 sm:gap-3">
        <div className="font-medium text-sm text-muted-foreground"></div>
        {visibleDays.map((day) => (
          <div key={day} className="font-semibold text-xs sm:text-sm text-center">
            <span className="sm:hidden">{DAY_LABELS_SHORT[day]}</span>
            <span className="hidden sm:inline">{DAY_LABELS[day]}</span>
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
          <div
            key={mealType}
            role="row"
            className="grid grid-cols-[80px_repeat(3,1fr)] sm:grid-cols-[96px_repeat(5,1fr)] lg:grid-cols-[120px_repeat(7,1fr)] gap-2 sm:gap-3 items-start"
          >
            {/* Row header - meal type label */}
            <div
              className="font-medium text-xs sm:text-sm text-muted-foreground flex items-center h-full pt-3"
              role="rowheader"
              id={`meal-type-${mealType}`}
            >
              {MEAL_TYPE_LABELS[mealType]}
            </div>

            {/* Cells for each day */}
            {visibleDays.map((day, dayIndex) => {
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
