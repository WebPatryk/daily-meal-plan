import type { APIRoute } from "astro";
import { z } from "zod";
import { logError } from "@/lib/utils";
import { createMealGenerationService, MealGenerationError } from "@/lib/generation.service";
import type { AiGenerateMealCommand, MealDto } from "@/types";

/**
 * POST /api/meals/ai-generate - Generate a meal using AI
 *
 * Request Body: AiGenerateMealCommand
 * {
 *   kcal_range: { min: number, max: number },
 *   protein_range: { min: number, max: number },
 *   description: string,
 *   day_of_week: DayOfWeek,
 *   meal_type: MealType,
 *   week_id: string,
 *   save: boolean
 * }
 *
 * Returns:
 * - 200: MealDto - Generated meal (persisted if save=true)
 * - 400: { error: string } - Invalid request
 * - 401: { error: string } - Unauthorized
 * - 500: { error: string } - Internal server error
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Step 1: Authenticate the user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse and validate request body
    const body = (await request.json()) as AiGenerateMealCommand;

    const schema = z.object({
      kcal_range: z.object({
        min: z.number().int().min(1).max(3000),
        max: z.number().int().min(1).max(3000),
      }),
      protein_range: z.object({
        min: z.number().int().min(1).max(300),
        max: z.number().int().min(1).max(300),
      }),
      description: z.string().min(1),
      day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
      meal_type: z.enum(["breakfast", "second_breakfast", "lunch", "snack", "dinner"]),
      week_id: z.number().int().positive(),
      save: z.boolean(),
    });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid request body", details: validationResult.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { kcal_range, protein_range, description, day_of_week, meal_type, week_id, save } = validationResult.data;

    // Step 3: Verify the week belongs to the user
    const { data: week, error: weekError } = await locals.supabase
      .from("weeks")
      .select("week_id")
      .eq("week_id", week_id)
      .eq("user_id", user.id)
      .single();

    if (weekError || !week) {
      return new Response(JSON.stringify({ error: "Week not found or access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Generate meal using AI Generation Service
    const generationService = createMealGenerationService();

    const aiMeal = await generationService.generateMeal({
      kcal_range,
      protein_range,
      description,
      day_of_week,
      meal_type,
    });

    // Step 5: If save=true, persist to database
    if (save) {
      const { data: savedMeal, error: saveError } = await locals.supabase
        .from("meals")
        .insert({
          user_id: user.id,
          week_id: week_id,
          day_of_week: day_of_week,
          meal_type: meal_type,
          kcal: Math.round(aiMeal.kcal),
          protein: Math.round(aiMeal.protein),
          source: "ai_generated",
          ai_proposition: {
            name: aiMeal.name,
            ingredients: aiMeal.ingredients,
            steps: aiMeal.steps,
          },
          image_path: `icon:${aiMeal.icon}`, // Store icon as prefixed string
        })
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save meal: ${saveError.message}`);
      }

      // Return saved meal with AI proposition fields flattened
      const mealDto: MealDto = {
        ...savedMeal,
        name: aiMeal.name,
        ingredients: aiMeal.ingredients,
        steps: aiMeal.steps,
      };

      return new Response(JSON.stringify(mealDto), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 6: If save=false, return preview
    const previewMeal: Partial<MealDto> = {
      meal_id: "preview",
      user_id: user.id,
      week_id: week_id,
      day_of_week: day_of_week,
      meal_type: meal_type,
      kcal: Math.round(aiMeal.kcal),
      protein: Math.round(aiMeal.protein),
      source: "ai_generated",
      image_path: `icon:${aiMeal.icon}`, // Store icon as prefixed string
      name: aiMeal.name,
      ingredients: aiMeal.ingredients,
      steps: aiMeal.steps,
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(previewMeal), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError(error, "POST /api/meals/ai-generate");

    // Handle specific generation errors
    if (error instanceof MealGenerationError) {
      return new Response(
        JSON.stringify({
          error: "Meal generation failed",
          message: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Failed to generate meal",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

