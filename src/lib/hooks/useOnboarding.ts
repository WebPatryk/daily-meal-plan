import { useState } from "react";
import { toast } from "sonner";

interface OnboardingGoals {
  kcal_target: number;
  protein_target: number;
}

interface UseOnboardingReturn {
  saveGoals: (goals: OnboardingGoals) => Promise<void>;
  isLoading: boolean;
  hasGoals: boolean | null;
  checkGoals: () => Promise<void>;
}

/**
 * Custom hook for handling onboarding process
 * Checks if user has goals set and allows saving them
 */
export function useOnboarding(): UseOnboardingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);

  const checkGoals = async () => {
    try {
      const response = await fetch("/api/profile/goals");
      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }
      const data = await response.json();

      // User has goals if both kcal_target and protein_target are set
      const goalsExist = data.kcal_target !== null && data.protein_target !== null;
      setHasGoals(goalsExist);
    } catch (error) {
      console.error("Error checking goals:", error);
      setHasGoals(false);
    }
  };

  const saveGoals = async (goals: OnboardingGoals) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/profile/goals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goals),
      });

      if (!response.ok) {
        throw new Error("Failed to save goals");
      }

      toast.success("Cele żywieniowe zostały zapisane!");
      setHasGoals(true);
    } catch (error) {
      toast.error("Nie udało się zapisać celów żywieniowych");
      console.error(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveGoals,
    isLoading,
    hasGoals,
    checkGoals,
  };
}
