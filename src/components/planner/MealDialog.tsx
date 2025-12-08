import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MealFormSchema, type MealFormValues } from "../../lib/schemas/meals";
import type { MealDto } from "../../types";
import { isIconPath, extractIconName, getMealIcon } from "../../lib/mealIcons";

interface MealDialogProps {
  mode: "add" | "edit";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MealFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
  defaultValues?: Partial<MealFormValues>;
  meal?: MealDto;
}

/**
 * MealDialog - modal for adding or editing a meal.
 * Uses react-hook-form with Zod validation.
 */
export function MealDialog({ mode, isOpen, onClose, onSubmit, onDelete, defaultValues, meal }: MealDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<MealFormValues>({
    resolver: zodResolver(MealFormSchema),
    defaultValues: defaultValues || {
      name: "",
      kcal: 0,
      protein: 0,
      ingredients: "",
      steps: "",
    },
  });

  // Update form when meal changes (for edit mode)
  useEffect(() => {
    if (meal && mode === "edit") {
      reset({
        name: meal.name || "",
        kcal: meal.kcal || 0,
        protein: meal.protein || 0,
        ingredients: meal.ingredients ? meal.ingredients.join("\n") : "",
        steps: meal.steps ? meal.steps.join("\n") : "",
      });
    } else if (mode === "add") {
      reset({
        name: "",
        kcal: 0,
        protein: 0,
        ingredients: "",
        steps: "",
      });
    }
  }, [meal, mode, reset]);

  // Watch image field for preview
  const imageFile = watch("image");

  // Update preview when image changes
  useEffect(() => {
    if (imageFile && imageFile[0] instanceof File) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (meal?.image_path && !isIconPath(meal.image_path)) {
      // Only set preview for actual image paths, not icons
      setImagePreview(meal.image_path);
    } else {
      setImagePreview(null);
    }
  }, [imageFile, meal?.image_path]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setImagePreview(null);
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: MealFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error submitting meal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    const confirmed = window.confirm("Czy na pewno chcesz usunąć ten posiłek?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await onDelete();
      onClose();
    } catch (error) {
      console.error("Error deleting meal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-test-id="meal-dialog">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Dodaj nowy posiłek" : "Edytuj posiłek"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Wypełnij dane posiłku. Możesz dodać zdjęcie lub pominąć to pole."
              : "Zaktualizuj dane posiłku."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Meal Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="required">
              Nazwa posiłku
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="np. Owsianka z owocami"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              data-test-id="meal-name-input"
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Macros - Kcal and Protein */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kcal" className="required">
                Kalorie (kcal)
              </Label>
              <Input
                id="kcal"
                type="number"
                {...register("kcal", { valueAsNumber: true })}
                placeholder="0"
                min="1"
                max="3000"
                aria-invalid={!!errors.kcal}
                aria-describedby={errors.kcal ? "kcal-error" : undefined}
                data-test-id="meal-kcal-input"
              />
              {errors.kcal && (
                <p id="kcal-error" className="text-sm text-destructive" role="alert">
                  {errors.kcal.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein" className="required">
                Białko (g)
              </Label>
              <Input
                id="protein"
                type="number"
                {...register("protein", { valueAsNumber: true })}
                placeholder="0"
                min="1"
                max="300"
                aria-invalid={!!errors.protein}
                aria-describedby={errors.protein ? "protein-error" : undefined}
                data-test-id="meal-protein-input"
              />
              {errors.protein && (
                <p id="protein-error" className="text-sm text-destructive" role="alert">
                  {errors.protein.message}
                </p>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Zdjęcie posiłku (opcjonalne, max 1MB)</Label>

            {/* Show current icon if meal has one */}
            {meal?.image_path && isIconPath(meal.image_path) && (
              <div className="mb-2 p-4 bg-primary/5 rounded-md border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">
                  Aktualnie wyświetlana ikona (wygenerowana przez AI):
                </p>
                <div className="flex items-center justify-center">
                  {(() => {
                    const iconName = extractIconName(meal.image_path);
                    return iconName ? getMealIcon(iconName, "w-12 h-12 text-primary") : null;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Możesz dodać własne zdjęcie, które zastąpi tę ikonę
                </p>
              </div>
            )}

            <Input id="image" type="file" accept="image/*" {...register("image")} aria-describedby="image-hint" />
            <p id="image-hint" className="text-xs text-muted-foreground">
              Akceptowane formaty: JPG, PNG, GIF, WebP. Maksymalny rozmiar: 1MB
            </p>

            {/* Image Preview (for uploaded files) */}
            {imagePreview && (
              <div className="mt-2">
                <img src={imagePreview} alt="Podgląd zdjęcia" className="w-full h-48 object-cover rounded-md border" />
              </div>
            )}
          </div>

          {/* Ingredients - Optional */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Składniki (opcjonalne)</Label>
            <Textarea
              id="ingredients"
              {...register("ingredients")}
              placeholder="Każdy składnik w nowej linii&#10;np.&#10;100g płatków owsianych&#10;200ml mleka&#10;1 banan"
              rows={4}
              className="font-mono text-sm"
              data-test-id="meal-ingredients-input"
            />
            <p className="text-xs text-muted-foreground">Wpisz każdy składnik w osobnej linii</p>
          </div>

          {/* Preparation Steps - Optional */}
          <div className="space-y-2">
            <Label htmlFor="steps">Kroki przygotowania (opcjonalne)</Label>
            <Textarea
              id="steps"
              {...register("steps")}
              placeholder="Każdy krok w nowej linii&#10;np.&#10;1. Zagotuj mleko&#10;2. Dodaj płatki&#10;3. Gotuj 3 minuty"
              rows={5}
              className="font-mono text-sm"
              data-test-id="meal-steps-input"
            />
            <p className="text-xs text-muted-foreground">Wpisz każdy krok w osobnej linii</p>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {mode === "edit" && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? "Usuwanie..." : "Usuń posiłek"}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isDeleting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSubmitting || isDeleting} data-test-id="meal-submit-btn">
                {isSubmitting ? "Zapisywanie..." : mode === "add" ? "Dodaj posiłek" : "Zapisz zmiany"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
