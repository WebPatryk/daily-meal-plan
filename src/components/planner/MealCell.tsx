import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { GridCellVM } from "../../types";
import { MealCard } from "./MealCard";

interface MealCellProps {
  cell: GridCellVM;
  onSelect: (cell: GridCellVM) => void;
  isFocused?: boolean;
  isOverCalories?: boolean;
}

/**
 * MealCell - represents a single cell in the week grid.
 * Displays either a MealCard (if meal exists) or an "Add Meal" button.
 */
export function MealCell({ cell, onSelect, isFocused = false, isOverCalories = false }: MealCellProps) {
  const handleClick = () => {
    onSelect(cell);
  };

  // If meal exists, show the meal card
  if (cell.meal) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                relative
                ${isFocused ? "ring-2 ring-primary ring-offset-2" : ""}
                ${isOverCalories ? "bg-red-50 dark:bg-red-950/20" : ""}
              `}
              data-day={cell.day}
              data-meal-type={cell.mealType}
            >
              <MealCard meal={cell.meal} onClick={handleClick} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{cell.meal.name}</p>
              <div className="text-xs text-muted-foreground">
                <p>
                  {cell.meal.kcal} kcal • {cell.meal.protein}g białka
                </p>
                {isOverCalories && <p className="text-destructive font-medium">⚠ Przekroczono cel kaloryczny</p>}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Otherwise, show "Add Meal" button
  return (
    <div
      className={`
        h-full min-h-[200px]
        ${isFocused ? "ring-2 ring-primary ring-offset-2" : ""}
        ${isOverCalories ? "bg-red-50 dark:bg-red-950/20" : ""}
      `}
      data-day={cell.day}
      data-meal-type={cell.mealType}
    >
      <Button
        variant="outline"
        className="w-full h-full flex flex-col items-center justify-center gap-2 border-dashed hover:border-solid hover:bg-accent/50"
        onClick={handleClick}
        aria-label={`Dodaj posiłek: ${cell.mealType} w ${cell.day}`}
      >
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-xs text-muted-foreground">Dodaj posiłek</span>
      </Button>
    </div>
  );
}
