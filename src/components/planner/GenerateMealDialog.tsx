import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiGenerateMealSchema, type AiGenerateMealFormValues } from "../../lib/schemas/meals";
import { generateMealWithAI } from "../../lib/apiClient";
import type { DayOfWeek, MealType } from "../../types";

interface GenerateMealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  weekId: number;
  defaultDay?: DayOfWeek;
  defaultMealType?: MealType;
}

// Day and meal type labels
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
  second_breakfast: "Drugie śniadanie",
  lunch: "Obiad",
  snack: "Podwieczorek",
  dinner: "Kolacja",
};

/**
 * GenerateMealDialog - modal for generating meals using AI.
 * Allows user to specify calorie/protein ranges, description, day, and meal type.
 */
export function GenerateMealDialog({
  isOpen,
  onClose,
  onSave,
  weekId,
  defaultDay = "monday",
  defaultMealType = "breakfast",
}: GenerateMealDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<AiGenerateMealFormValues>({
    resolver: zodResolver(AiGenerateMealSchema),
    defaultValues: {
      kcal_range: { min: 300, max: 700 },
      protein_range: { min: 20, max: 50 },
      description: "",
      day_of_week: defaultDay,
      meal_type: defaultMealType,
    },
  });

  // Watch values for sliders
  const kcalMin = watch("kcal_range.min");
  const kcalMax = watch("kcal_range.max");
  const proteinMin = watch("protein_range.min");
  const proteinMax = watch("protein_range.max");

  const handleGenerate = async (data: AiGenerateMealFormValues) => {
    try {
      setIsGenerating(true);
      setError(null);

      // Generate and save meal directly (no preview)
      await generateMealWithAI({
        kcal_range: data.kcal_range,
        protein_range: data.protein_range,
        description: data.description,
        week_id: weekId,
        day_of_week: data.day_of_week,
        meal_type: data.meal_type,
        save: true, // Save directly to database
      });

      // Call onSave to refresh the planner grid
      await onSave();

      // Close modal after successful save
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się wygenerować posiłku");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generuj posiłek z AI</DialogTitle>
          <DialogDescription>
            Podaj zakres kalorii, białka i opis posiłku. AI wygeneruje i automatycznie doda posiłek do wybranego dnia i
            pory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleGenerate)} className="space-y-6">
          {/* Day of Week */}
          <div className="space-y-2">
            <Label htmlFor="day_of_week" className="required">
              Dzień tygodnia
            </Label>
            <Controller
              name="day_of_week"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="day_of_week" aria-invalid={!!errors.day_of_week}>
                    <SelectValue placeholder="Wybierz dzień" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">{DAY_LABELS.monday}</SelectItem>
                    <SelectItem value="tuesday">{DAY_LABELS.tuesday}</SelectItem>
                    <SelectItem value="wednesday">{DAY_LABELS.wednesday}</SelectItem>
                    <SelectItem value="thursday">{DAY_LABELS.thursday}</SelectItem>
                    <SelectItem value="friday">{DAY_LABELS.friday}</SelectItem>
                    <SelectItem value="saturday">{DAY_LABELS.saturday}</SelectItem>
                    <SelectItem value="sunday">{DAY_LABELS.sunday}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.day_of_week && (
              <p className="text-sm text-destructive" role="alert">
                {errors.day_of_week.message}
              </p>
            )}
          </div>

          {/* Meal Type */}
          <div className="space-y-2">
            <Label htmlFor="meal_type" className="required">
              Typ posiłku
            </Label>
            <Controller
              name="meal_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="meal_type" aria-invalid={!!errors.meal_type}>
                    <SelectValue placeholder="Wybierz typ posiłku" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">{MEAL_TYPE_LABELS.breakfast}</SelectItem>
                    <SelectItem value="second_breakfast">{MEAL_TYPE_LABELS.second_breakfast}</SelectItem>
                    <SelectItem value="lunch">{MEAL_TYPE_LABELS.lunch}</SelectItem>
                    <SelectItem value="snack">{MEAL_TYPE_LABELS.snack}</SelectItem>
                    <SelectItem value="dinner">{MEAL_TYPE_LABELS.dinner}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.meal_type && (
              <p className="text-sm text-destructive" role="alert">
                {errors.meal_type.message}
              </p>
            )}
          </div>

          {/* Calorie Range */}
          <div className="space-y-3">
            <Label>Zakres kalorii (kcal)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={kcalMin}
                  onChange={(e) => setValue("kcal_range.min", parseInt(e.target.value, 10))}
                  min={1}
                  max={3000}
                  className="w-24"
                />
                <Slider
                  value={[kcalMin, kcalMax]}
                  onValueChange={([min, max]) => {
                    setValue("kcal_range.min", min);
                    setValue("kcal_range.max", max);
                  }}
                  min={1}
                  max={3000}
                  step={10}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={kcalMax}
                  onChange={(e) => setValue("kcal_range.max", parseInt(e.target.value, 10))}
                  min={1}
                  max={3000}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Posiłek będzie mieć od {kcalMin} do {kcalMax} kcal
              </p>
            </div>
            {errors.kcal_range && (
              <p className="text-sm text-destructive" role="alert">
                {errors.kcal_range.message}
              </p>
            )}
          </div>

          {/* Protein Range */}
          <div className="space-y-3">
            <Label>Zakres białka (g)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={proteinMin}
                  onChange={(e) => setValue("protein_range.min", parseInt(e.target.value, 10))}
                  min={1}
                  max={300}
                  className="w-24"
                />
                <Slider
                  value={[proteinMin, proteinMax]}
                  onValueChange={([min, max]) => {
                    setValue("protein_range.min", min);
                    setValue("protein_range.max", max);
                  }}
                  min={1}
                  max={300}
                  step={5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={proteinMax}
                  onChange={(e) => setValue("protein_range.max", parseInt(e.target.value, 10))}
                  min={1}
                  max={300}
                  className="w-24"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Posiłek będzie mieć od {proteinMin}g do {proteinMax}g białka
              </p>
            </div>
            {errors.protein_range && (
              <p className="text-sm text-destructive" role="alert">
                {errors.protein_range.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="required">
              Opis posiłku
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="np. Lekkie śniadanie z wysoką zawartością błonnika, bez nabiału"
              rows={4}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            <p className="text-xs text-muted-foreground">
              Opisz swoje preferencje: rodzaj posiłku, składniki, ograniczenia dietetyczne itp.
            </p>
            {errors.description && (
              <p id="description-error" className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md" role="alert">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button type="submit" disabled={isGenerating} className="w-full">
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generowanie...
              </>
            ) : (
              "Generuj posiłek"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
