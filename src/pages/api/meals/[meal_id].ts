import type { APIRoute } from "astro";
import { z } from "zod";
import { logError } from "@/lib/utils";
import type { UpdateMealCommand, MealDto } from "@/types";

/**
 * PATCH /api/meals/{meal_id} - Update an existing meal
 *
 * Request Body: UpdateMealCommand (partial)
 * {
 *   name?: string,
 *   kcal?: number,
 *   protein?: number,
 *   day_of_week?: DayOfWeek,
 *   meal_type?: MealType,
 *   ingredients?: string[],
 *   steps?: string[]
 * }
 *
 * Returns:
 * - 200: MealDto - Updated meal
 * - 400: { error: string } - Invalid request
 * - 401: { error: string } - Unauthorized
 * - 403: { error: string } - User doesn't own this meal
 * - 404: { error: string } - Meal not found
 * - 500: { error: string } - Internal server error
 */
export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

    const { meal_id } = params;

    if (!meal_id) {
      return new Response(JSON.stringify({ error: "meal_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Parse and validate request body
    const body = (await request.json()) as UpdateMealCommand;

    const schema = z.object({
      name: z.string().min(1).optional(),
      kcal: z.number().int().min(1).max(3000).optional(),
      protein: z.number().int().min(1).max(300).optional(),
      day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]).optional(),
      meal_type: z.enum(["breakfast", "second_breakfast", "lunch", "snack", "dinner"]).optional(),
      ingredients: z.array(z.string()).optional(),
      steps: z.array(z.string()).optional(),
      image_path: z.string().nullable().optional(),
    });

    const validationResult = schema.safeParse(body);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid request body", details: validationResult.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData = validationResult.data;

    // Step 3: Fetch existing meal to verify ownership
    const { data: existingMeal, error: fetchError } = await locals.supabase
      .from("meals")
      .select("*")
      .eq("meal_id", meal_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingMeal) {
      return new Response(JSON.stringify({ error: "Meal not found or access denied" }), {
        status: existingMeal ? 403 : 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Prepare update object
    // If name, ingredients, or steps are provided, update ai_proposition
    const aiProposition = existingMeal.ai_proposition as {
      name?: string;
      ingredients?: string[];
      steps?: string[];
    } | null;

    const updatedProposition = {
      name: updateData.name ?? aiProposition?.name,
      ingredients: updateData.ingredients ?? aiProposition?.ingredients ?? [],
      steps: updateData.steps ?? aiProposition?.steps ?? [],
    };

    const dbUpdate: any = {
      updated_at: new Date().toISOString(),
    };

    // Update basic fields
    if (updateData.kcal !== undefined) dbUpdate.kcal = updateData.kcal;
    if (updateData.protein !== undefined) dbUpdate.protein = updateData.protein;
    if (updateData.day_of_week !== undefined) dbUpdate.day_of_week = updateData.day_of_week;
    if (updateData.meal_type !== undefined) dbUpdate.meal_type = updateData.meal_type;
    if (updateData.image_path !== undefined) dbUpdate.image_path = updateData.image_path;

    // Update ai_proposition if any of name/ingredients/steps changed
    if (updateData.name !== undefined || updateData.ingredients !== undefined || updateData.steps !== undefined) {
      dbUpdate.ai_proposition = updatedProposition;
    }

    // Step 5: Update meal in database
    const { data: updatedMeal, error: updateError } = await locals.supabase
      .from("meals")
      .update(dbUpdate)
      .eq("meal_id", meal_id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update meal: ${updateError.message}`);
    }

    // Step 6: Transform to DTO (flatten ai_proposition fields)
    const mealDto: MealDto = {
      ...updatedMeal,
      name: updatedProposition.name || "",
      ingredients: updatedProposition.ingredients || [],
      steps: updatedProposition.steps || [],
    };

    return new Response(JSON.stringify(mealDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError(error, `PATCH /api/meals/${params.meal_id}`);

    return new Response(
      JSON.stringify({
        error: "Failed to update meal",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/meals/{meal_id} - Delete a meal
 *
 * Returns:
 * - 204: No content - Meal deleted successfully
 * - 401: { error: string } - Unauthorized
 * - 403: { error: string } - User doesn't own this meal
 * - 404: { error: string } - Meal not found
 * - 500: { error: string } - Internal server error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

    const { meal_id } = params;

    if (!meal_id) {
      return new Response(JSON.stringify({ error: "meal_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Delete meal (RLS policy ensures only owner can delete)
    const { error: deleteError } = await locals.supabase
      .from("meals")
      .delete()
      .eq("meal_id", meal_id)
      .eq("user_id", user.id);

    if (deleteError) {
      throw new Error(`Failed to delete meal: ${deleteError.message}`);
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    logError(error, `DELETE /api/meals/${params.meal_id}`);

    return new Response(
      JSON.stringify({
        error: "Failed to delete meal",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};


