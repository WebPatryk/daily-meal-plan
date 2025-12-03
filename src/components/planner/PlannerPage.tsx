import { Toaster } from "@/components/ui/sonner";
import { PlannerProvider } from "./PlannerContext";
import { WeekPlannerLayout } from "./WeekPlannerLayout";

/**
 * PlannerPage - main entry point for the planner view.
 * Wraps the layout with PlannerProvider for state management.
 */
export function PlannerPage() {
  return (
    <PlannerProvider>
      <WeekPlannerLayout />
      <Toaster position="top-right" richColors />
    </PlannerProvider>
  );
}
