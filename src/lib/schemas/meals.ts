import { z } from "zod";

/**
 * Zod schema for validating meal form inputs.
 *
 * Validates:
 * - name: non-empty string (meal name)
 * - kcal: integer between 1 and 3000
 * - protein: integer between 1 and 300
 * - ingredients: optional string (textarea input, each line is an ingredient)
 * - steps: optional string (textarea input, each line is a step)
 * - image: optional file (validated separately for size/type)
 */
export const MealFormSchema = z.object({
  name: z.string().min(1, "Nazwa posiłku jest wymagana"),

  kcal: z
    .number({ required_error: "Kalorie są wymagane" })
    .int("Kalorie muszą być liczbą całkowitą")
    .min(1, "Kalorie muszą być większe niż 0")
    .max(3000, "Kalorie nie mogą przekroczyć 3000"),

  protein: z
    .number({ required_error: "Białko jest wymagane" })
    .int("Białko musi być liczbą całkowitą")
    .min(1, "Białko musi być większe niż 0")
    .max(300, "Białko nie może przekroczyć 300g"),

  ingredients: z.string().optional(),

  steps: z.string().optional(),
});

/**
 * Inferred TypeScript type from the MealFormSchema.
 * Use this type when working with meal form values.
 */
export type MealFormValues = z.infer<typeof MealFormSchema>;

/**
 * Schema for validating AI meal generation request.
 */
export const AiGenerateMealSchema = z.object({
  kcal_range: z.object({
    min: z.number().int().min(1).max(3000),
    max: z.number().int().min(1).max(3000),
  }),
  protein_range: z.object({
    min: z.number().int().min(1).max(300),
    max: z.number().int().min(1).max(300),
  }),
  description: z.string().min(1, "Opis jest wymagany"),
  day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"], {
    required_error: "Dzień tygodnia jest wymagany",
  }),
  meal_type: z.enum(["breakfast", "second_breakfast", "lunch", "snack", "dinner"], {
    required_error: "Typ posiłku jest wymagany",
  }),
});

export type AiGenerateMealFormValues = z.infer<typeof AiGenerateMealSchema>;
