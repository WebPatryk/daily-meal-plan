import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import type { PlannerContextValue, ActiveWeekState, CreateMealCommand, UpdateMealCommand, WeekDto } from "../../types";
import { getCurrentWeek, getWeekByDate, getWeekMeals, createMeal, updateMeal, deleteMeal } from "../../lib/apiClient";

const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

interface PlannerProviderProps {
  children: ReactNode;
}

/**
 * PlannerProvider - manages the active week state and provides actions
 * to manipulate meals within the planner.
 */
export function PlannerProvider({ children }: PlannerProviderProps) {
  const [state, setState] = useState<ActiveWeekState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  /**
   * Calculates total kcal and protein from meals array.
   */
  const calculateTotals = useCallback((meals: ActiveWeekState["meals"]) => {
    return meals.reduce(
      (acc, meal) => ({
        kcal: acc.kcal + (meal.kcal ?? 0),
        protein: acc.protein + (meal.protein ?? 0),
      }),
      { kcal: 0, protein: 0 }
    );
  }, []);

  /**
   * Loads the current week and its meals.
   */
  const loadWeekData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(undefined);

      // getCurrentWeek() now always returns a week (creates if doesn't exist)
      const week = await getCurrentWeek();
      const meals = await getWeekMeals(String(week.week_id));
      const totals = calculateTotals(meals);

      setState({
        week,
        meals,
        totals,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nieznany błąd"));
    } finally {
      setIsLoading(false);
    }
  }, [calculateTotals]);

  /**
   * Loads a specific week by start date and its meals.
   */
  const loadWeekByDate = useCallback(
    async (startDate: string) => {
      try {
        setIsLoading(true);
        setError(undefined);

        const week = await getWeekByDate(startDate);
        const meals = await getWeekMeals(String(week.week_id));
        const totals = calculateTotals(meals);

        setState({
          week,
          meals,
          totals,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Nieznany błąd"));
      } finally {
        setIsLoading(false);
      }
    },
    [calculateTotals]
  );

  /**
   * Initial load on mount.
   */
  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  /**
   * Adds a new meal to the current week.
   */
  const addMeal = useCallback(
    async (meal: CreateMealCommand) => {
      if (!state) return;

      try {
        const newMeal = await createMeal(String(state.week.week_id), meal);

        setState((prev) => {
          if (!prev) return prev;
          const meals = [...prev.meals, newMeal];
          return {
            ...prev,
            meals,
            totals: calculateTotals(meals),
          };
        });

        toast.success("Posiłek został dodany", {
          description: `${meal.name} - ${meal.kcal} kcal`,
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nie udało się dodać posiłku");
        toast.error("Błąd", {
          description: error.message,
        });
        throw error;
      }
    },
    [state, calculateTotals]
  );

  /**
   * Updates an existing meal.
   */
  const updateMealAction = useCallback(
    async (mealId: string, mealUpdate: UpdateMealCommand) => {
      if (!state) return;

      try {
        const updatedMeal = await updateMeal(String(mealId), mealUpdate);

        setState((prev) => {
          if (!prev) return prev;
          const meals = prev.meals.map((m) => (String(m.meal_id) === mealId ? updatedMeal : m));
          return {
            ...prev,
            meals,
            totals: calculateTotals(meals),
          };
        });

        toast.success("Posiłek został zaktualizowany");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nie udało się zaktualizować posiłku");
        toast.error("Błąd", {
          description: error.message,
        });
        throw error;
      }
    },
    [state, calculateTotals]
  );

  /**
   * Deletes a meal.
   */
  const deleteMealAction = useCallback(
    async (mealId: string) => {
      if (!state) return;

      try {
        await deleteMeal(String(mealId));

        setState((prev) => {
          if (!prev) return prev;
          const meals = prev.meals.filter((m) => String(m.meal_id) !== mealId);
          return {
            ...prev,
            meals,
            totals: calculateTotals(meals),
          };
        });

        toast.success("Posiłek został usunięty");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nie udało się usunąć posiłku");
        toast.error("Błąd", {
          description: error.message,
        });
        throw error;
      }
    },
    [state, calculateTotals]
  );

  /**
   * Changes the active week (prev/next).
   * Calculates the new Monday and loads that week's data.
   */
  const changeWeek = useCallback(
    async (direction: "prev" | "next") => {
      if (!state) return;

      try {
        // Calculate the new Monday based on direction
        const currentStartDate = new Date(state.week.start_date);
        const daysToAdd = direction === "next" ? 7 : -7;
        const newStartDate = new Date(currentStartDate);
        newStartDate.setDate(currentStartDate.getDate() + daysToAdd);

        // Format as YYYY-MM-DD
        const newStartDateStr = newStartDate.toISOString().split("T")[0];

        // Load the new week
        await loadWeekByDate(newStartDateStr);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Nie udało się zmienić tygodnia");
        toast.error("Błąd", {
          description: error.message,
        });
        setError(error);
      }
    },
    [state, loadWeekByDate]
  );

  const contextValue: PlannerContextValue = {
    state: state || {
      week: {} as unknown as WeekDto,
      meals: [],
      totals: { kcal: 0, protein: 0 },
    },
    isLoading,
    error,
    addMeal,
    updateMeal: updateMealAction,
    deleteMeal: deleteMealAction,
    changeWeek,
    refreshData: loadWeekData,
  };

  return <PlannerContext.Provider value={contextValue}>{children}</PlannerContext.Provider>;
}

/**
 * Hook to access the PlannerContext.
 * Throws an error if used outside of PlannerProvider.
 */
export function usePlanner(): PlannerContextValue {
  const context = useContext(PlannerContext);

  if (!context) {
    throw new Error("usePlanner must be used within a PlannerProvider");
  }

  return context;
}
