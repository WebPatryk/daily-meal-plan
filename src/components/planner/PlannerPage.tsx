import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { OnboardingModal } from "@/components/auth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { PlannerProvider } from "./PlannerContext";
import { WeekPlannerLayout } from "./WeekPlannerLayout";

/**
 * PlannerPage - main entry point for the planner view.
 * Wraps the layout with PlannerProvider for state management.
 * Checks if user has goals set and shows onboarding modal if not.
 */
export function PlannerPage() {
  const { hasGoals, checkGoals } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkGoals();
  }, []);

  useEffect(() => {
    // Show onboarding modal if user doesn't have goals set
    if (hasGoals === false) {
      setShowOnboarding(true);
    }
  }, [hasGoals]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh the page to reload data with new goals
    window.location.reload();
  };

  return (
    <>
      <PlannerProvider>
        <WeekPlannerLayout />
        <Toaster position="top-right" richColors />
      </PlannerProvider>

      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
    </>
  );
}
