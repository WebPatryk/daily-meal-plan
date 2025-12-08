import { useState, useMemo, useCallback } from "react";
import { usePlanner } from "./PlannerContext";
import { PlannerToolbar } from "./PlannerToolbar";
import { WeekGrid } from "./WeekGrid";
import { MealDialog } from "./MealDialog";
import { GenerateMealDialog } from "./GenerateMealDialog";
import type { GridCellVM, DayOfWeek, MealType, MealDto } from "../../types";
import type { MealFormValues } from "../../lib/schemas/meals";
import { uploadMealImage } from "../../lib/apiClient";

// Dialog modes
type DialogMode = "closed" | "add" | "edit" | "generate";

interface DialogState {
  mode: DialogMode;
  cell?: GridCellVM;
  meal?: MealDto;
}

/**
 * WeekPlannerLayout - main layout component that orchestrates the planner view.
 * Manages dialog states and connects grid interactions with context actions.
 */
export function WeekPlannerLayout() {
  const { state, isLoading, error, addMeal, updateMeal, deleteMeal, changeWeek, refreshData } = usePlanner();
  const [dialogState, setDialogState] = useState<DialogState>({ mode: "closed" });

  // Build grid cells from meals
  const gridCells = useMemo((): GridCellVM[] => {
    const days: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const mealTypes: MealType[] = ["breakfast", "second_breakfast", "lunch", "snack", "dinner"];

    return days.flatMap((day) =>
      mealTypes.map((mealType) => {
        const meal = state.meals.find((m) => m.day_of_week === day && m.meal_type === mealType);
        return { day, mealType, meal };
      })
    );
  }, [state.meals]);

  // Handle cell click (open add or edit dialog)
  const handleCellClick = useCallback((cell: GridCellVM) => {
    if (cell.meal) {
      // Edit existing meal
      setDialogState({ mode: "edit", cell, meal: cell.meal });
    } else {
      // Add new meal
      setDialogState({ mode: "add", cell });
    }
  }, []);

  // Handle meal form submission (add or edit)
  const handleMealSubmit = useCallback(
    async (data: MealFormValues) => {
      if (!dialogState.cell) return;

      const { day, mealType } = dialogState.cell;

      // Process ingredients and steps (convert from textarea string to array)
      const ingredients = data.ingredients ? data.ingredients.split("\n").filter((s) => s.trim()) : [];

      const steps = data.steps ? data.steps.split("\n").filter((s) => s.trim()) : [];

      if (dialogState.mode === "add") {
        // Add new meal
        await addMeal({
          week_id: state.week.week_id,
          day_of_week: day,
          meal_type: mealType,
          name: data.name,
          kcal: data.kcal,
          protein: data.protein,
          ingredients,
          steps,
          source: "manual",
          image_path: null,
        });

        // Handle image upload if provided
        if (data.image && data.image[0] instanceof File) {
          const meal = state.meals.find((m) => m.day_of_week === day && m.meal_type === mealType);
          if (meal) {
            await uploadMealImage(String(meal.meal_id), data.image[0]);
          }
        }
      } else if (dialogState.mode === "edit" && dialogState.meal) {
        // Update existing meal
        await updateMeal(String(dialogState.meal.meal_id), {
          name: data.name,
          kcal: data.kcal,
          protein: data.protein,
          day_of_week: day,
          meal_type: mealType,
          ingredients,
          steps,
        });

        // Handle image upload if provided
        if (data.image && data.image[0] instanceof File) {
          await uploadMealImage(String(dialogState.meal.meal_id), data.image[0]);
        }
      }

      setDialogState({ mode: "closed" });
    },
    [dialogState, state.week.week_id, state.meals, addMeal, updateMeal]
  );

  // Handle AI generate dialog open
  const handleOpenGenerateAI = useCallback(() => {
    setDialogState({
      mode: "generate",
    });
  }, []);

  // Handle saving AI-generated meal (meal is already saved by backend, just refresh)
  const handleSaveGeneratedMeal = useCallback(async () => {
    // Meal is already in database, just refresh to get latest data
    await refreshData();
    setDialogState({ mode: "closed" });
  }, [refreshData]);

  // Close dialogs
  const handleCloseDialog = useCallback(() => {
    setDialogState({ mode: "closed" });
  }, []);

  // Week navigation
  const handlePrevWeek = useCallback(() => {
    changeWeek("prev");
  }, [changeWeek]);

  const handleNextWeek = useCallback(() => {
    changeWeek("next");
  }, [changeWeek]);

  // Check if calories are over limit (placeholder - would come from user goals)
  const caloriesOverLimit = state.totals.kcal > 2500; // Placeholder threshold

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Ładowanie planera...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Wystąpił błąd</h2>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <button onClick={() => window.location.reload()} className="text-primary underline">
            Odśwież stronę
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <PlannerToolbar
        week={state.week}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onGenerateAI={handleOpenGenerateAI}
      />

      {/* Totals Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Suma kalorii</p>
          <p className={`text-xl sm:text-2xl font-bold ${caloriesOverLimit ? "text-destructive" : ""}`}>
            {state.totals.kcal} kcal
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Suma białka</p>
          <p className="text-xl sm:text-2xl font-bold">{state.totals.protein}g</p>
        </div>
      </div>

      {/* Week Grid */}
      <WeekGrid cells={gridCells} onCellClick={handleCellClick} caloriesOverLimit={caloriesOverLimit} />

      {/* Meal Dialog (Add/Edit) */}
      <MealDialog
        mode={dialogState.mode === "edit" ? "edit" : "add"}
        isOpen={dialogState.mode === "add" || dialogState.mode === "edit"}
        onClose={handleCloseDialog}
        onSubmit={handleMealSubmit}
        onDelete={
          dialogState.mode === "edit" && dialogState.meal
            ? async () => {
                if (dialogState.meal) {
                  await deleteMeal(String(dialogState.meal.meal_id));
                }
              }
            : undefined
        }
        meal={dialogState.meal}
      />

      {/* Generate Meal Dialog (AI) */}
      <GenerateMealDialog
        isOpen={dialogState.mode === "generate"}
        onClose={handleCloseDialog}
        onSave={handleSaveGeneratedMeal}
        weekId={state.week.week_id}
      />
    </div>
  );
}
