import { useCallback, useEffect, useState } from "react";
import type { DayOfWeek, MealType } from "../../../types";

interface GridPosition {
  day: DayOfWeek;
  mealType: MealType;
}

interface UseGridKeyboardNavigationOptions {
  /**
   * Array of days in order (e.g., ["monday", "tuesday", ...])
   */
  days: DayOfWeek[];
  /**
   * Array of meal types in order (e.g., ["breakfast", "lunch", ...])
   */
  mealTypes: MealType[];
  /**
   * Callback when a cell is selected (Enter/Space)
   */
  onCellSelect?: (position: GridPosition) => void;
}

/**
 * Custom hook for managing keyboard navigation within the week planner grid.
 * Handles arrow key navigation and Enter/Space for selection.
 *
 * @param options Configuration for grid navigation
 * @returns Current focused position and navigation handlers
 */
export function useGridKeyboardNavigation({ days, mealTypes, onCellSelect }: UseGridKeyboardNavigationOptions) {
  // Current focused cell position
  const [focusedPosition, setFocusedPosition] = useState<GridPosition>({
    day: days[0],
    mealType: mealTypes[0],
  });

  /**
   * Moves focus in the specified direction.
   */
  const moveFocus = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      setFocusedPosition((prev) => {
        const currentDayIndex = days.indexOf(prev.day);
        const currentMealIndex = mealTypes.indexOf(prev.mealType);

        let newDayIndex = currentDayIndex;
        let newMealIndex = currentMealIndex;

        switch (direction) {
          case "up":
            newMealIndex = Math.max(0, currentMealIndex - 1);
            break;
          case "down":
            newMealIndex = Math.min(mealTypes.length - 1, currentMealIndex + 1);
            break;
          case "left":
            newDayIndex = Math.max(0, currentDayIndex - 1);
            break;
          case "right":
            newDayIndex = Math.min(days.length - 1, currentDayIndex + 1);
            break;
        }

        return {
          day: days[newDayIndex],
          mealType: mealTypes[newMealIndex],
        };
      });
    },
    [days, mealTypes]
  );

  /**
   * Handles keyboard events for grid navigation.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore keyboard events when user is interacting with a form element or dialog
      const target = event.target as HTMLElement;
      const isInDialog = target.closest('[role="dialog"]') !== null;
      const isInInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";
      const isContentEditable = target.isContentEditable;

      // Skip keyboard navigation if user is typing in a form element or inside a dialog
      if (isInDialog || isInInput || isContentEditable) {
        return;
      }

      const key = event.key;

      // Arrow key navigation
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        event.preventDefault();

        switch (key) {
          case "ArrowUp":
            moveFocus("up");
            break;
          case "ArrowDown":
            moveFocus("down");
            break;
          case "ArrowLeft":
            moveFocus("left");
            break;
          case "ArrowRight":
            moveFocus("right");
            break;
        }
      }

      // Enter or Space to select
      if (key === "Enter" || key === " ") {
        event.preventDefault();
        onCellSelect?.(focusedPosition);
      }
    },
    [moveFocus, onCellSelect, focusedPosition]
  );

  /**
   * Sets focus to a specific cell.
   */
  const setFocus = useCallback((position: GridPosition) => {
    setFocusedPosition(position);
  }, []);

  /**
   * Checks if a cell is currently focused.
   */
  const isFocused = useCallback(
    (day: DayOfWeek, mealType: MealType) => {
      return focusedPosition.day === day && focusedPosition.mealType === mealType;
    },
    [focusedPosition]
  );

  return {
    focusedPosition,
    setFocus,
    isFocused,
    handleKeyDown,
  };
}
