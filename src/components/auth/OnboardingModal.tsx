import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

/**
 * Onboarding modal that appears after registration
 * Requires user to set nutritional goals before accessing the planner
 */
export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { saveGoals, isLoading } = useOnboarding();
  const [kcalTarget, setKcalTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const kcal = parseInt(kcalTarget, 10);
    const protein = parseInt(proteinTarget, 10);

    if (isNaN(kcal) || isNaN(protein)) {
      return;
    }

    try {
      await saveGoals({
        kcal_target: kcal,
        protein_target: protein,
      });
      onComplete();
    } catch {
      // Error is handled by useOnboarding hook
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Witaj w Daily Meal Plan!</DialogTitle>
          <DialogDescription>Zanim zaczniesz planować posiłki, ustaw swoje dzienne cele żywieniowe.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="kcal_target">
              Dzienny cel kaloryczny (kcal) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kcal_target"
              type="number"
              min="1"
              max="10000"
              step="1"
              value={kcalTarget}
              onChange={(e) => setKcalTarget(e.target.value)}
              placeholder="np. 2000"
              required
            />
            <p className="text-xs text-muted-foreground">Ilość kalorii, którą chcesz spożywać dziennie</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="protein_target">
              Dzienny cel białkowy (g) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="protein_target"
              type="number"
              min="1"
              max="1000"
              step="1"
              value={proteinTarget}
              onChange={(e) => setProteinTarget(e.target.value)}
              placeholder="np. 150"
              required
            />
            <p className="text-xs text-muted-foreground">Ilość białka w gramach, którą chcesz spożywać dziennie</p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Zapisywanie..." : "Rozpocznij planowanie"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
