import { z } from "zod";

/**
 * Zod schema for validating query parameters for GET /api/weeks endpoint.
 *
 * Validates:
 * - limit: number between 1 and 100 (default: 20)
 * - offset: non-negative integer (default: 0)
 * - start_date: ISO date string in YYYY-MM-DD format (optional)
 * - sort: sorting order for start_date (default: "start_date:desc")
 */
export const WeeksQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1, "limit must be at least 1").max(100, "limit must be at most 100")),

  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0, "offset must be non-negative")),

  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be in YYYY-MM-DD format")
    .optional()
    .refine(
      (date) => {
        if (!date) return true;
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      },
      { message: "start_date must be a valid date" }
    ),

  sort: z.enum(["start_date:asc", "start_date:desc"]).optional().default("start_date:desc"),
});

/**
 * Inferred TypeScript type from the WeeksQuerySchema.
 * Use this type when working with validated query parameters.
 */
export type WeeksQuerySchemaType = z.infer<typeof WeeksQuerySchema>;

/**
 * Zod schema for validating POST /api/weeks request body.
 *
 * Validates:
 * - start_date: ISO date string in YYYY-MM-DD format (required)
 */
export const CreateWeekSchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be in YYYY-MM-DD format")
    .refine(
      (date) => {
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      },
      { message: "start_date must be a valid date" }
    )
    .refine(
      (date) => {
        const parsed = new Date(date);
        const dayOfWeek = parsed.getDay();
        return dayOfWeek === 1; // Monday
      },
      { message: "start_date must be a Monday" }
    ),
});

/**
 * Inferred TypeScript type from the CreateWeekSchema.
 */
export type CreateWeekSchemaType = z.infer<typeof CreateWeekSchema>;
