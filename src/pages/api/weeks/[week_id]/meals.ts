import type { APIRoute } from "astro";
import { z } from "zod";
import { logError } from "@/lib/utils";
import type { MealDto, CreateMealCommand } from "@/types";

/**
 * GET /api/weeks/{week_id}/meals - Get all meals for a specific week
 *
 * Returns:
 * - 200: MealDto[] - Array of meals for the week
 * - 401: { error: string } - Unauthorized
 * - 403: { error: string } - User doesn't own this week
 * - 500: { error: string } - Internal server error
 */
export const GET: APIRoute = async ({ locals, params }) => {
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

    const { week_id } = params;

    if (!week_id) {
      return new Response(JSON.stringify({ error: "week_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Verify the week belongs to the user
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

    // Step 3: Fetch meals for this week
    const { data: meals, error: mealsError } = await locals.supabase
      .from("meals")
      .select("*")
      .eq("week_id", week_id)
      .eq("user_id", user.id)
      .order("day_of_week", { ascending: true })
      .order("meal_type", { ascending: true });

    if (mealsError) {
      throw new Error(`Failed to fetch meals: ${mealsError.message}`);
    }

    // Step 4: Transform meals to DTOs (flatten ai_proposition fields)
    const mealDtos: MealDto[] = (meals || []).map((meal) => {
      // If meal has ai_proposition, flatten its fields
      if (meal.ai_proposition && typeof meal.ai_proposition === "object") {
        const proposition = meal.ai_proposition as {
          name?: string;
          ingredients?: string[];
          steps?: string[];
        };

        return {
          ...meal,
          name: proposition.name || meal.name,
          ingredients: proposition.ingredients || [],
          steps: proposition.steps || [],
        };
      }

      // For manual meals, return as-is
      return {
        ...meal,
        name: meal.name || "",
        ingredients: [],
        steps: [],
      };
    });

    // Step 5: Return meals (empty array if none exist)
    return new Response(JSON.stringify(mealDtos), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error) {
    logError(error, `GET /api/weeks/${params.week_id}/meals`);

    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/weeks/{week_id}/meals - Create a new meal for a specific week
 *
 * Request Body: CreateMealCommand
 * {
 *   name: string,
 *   kcal: number,
 *   protein: number,
 *   day_of_week: DayOfWeek,
 *   meal_type: MealType,
 *   source: "manual" | "ai_generated",
 *   ingredients?: string[],
 *   steps?: string[],
 *   image_path?: string | null
 * }
 *
 * Returns:
 * - 201: MealDto - Created meal
 * - 400: { error: string } - Invalid request
 * - 401: { error: string } - Unauthorized
 * - 403: { error: string } - User doesn't own this week
 * - 500: { error: string } - Internal server error
 */
export const POST: APIRoute = async ({ locals, params, request }) => {
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

    const { week_id } = params;

    if (!week_id) {
      return new Response(JSON.stringify({ error: "week_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Verify the week belongs to the user
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

    // Step 3: Parse and validate request body
    const body = (await request.json()) as CreateMealCommand;

    const schema = z.object({
      name: z.string().min(1),
      kcal: z.number().int().min(1).max(3000),
      protein: z.number().int().min(1).max(300),
      day_of_week: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
      meal_type: z.enum(["breakfast", "second_breakfast", "lunch", "snack", "dinner"]),
      source: z.enum(["manual", "ai_generated"]),
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

    const mealData = validationResult.data;

    // Step 4: Prepare meal for database insertion
    const aiProposition = {
      name: mealData.name,
      ingredients: mealData.ingredients || [],
      steps: mealData.steps || [],
    };

    const dbInsert = {
      user_id: user.id,
      week_id: parseInt(week_id, 10),
      day_of_week: mealData.day_of_week,
      meal_type: mealData.meal_type,
      kcal: mealData.kcal,
      protein: mealData.protein,
      source: mealData.source,
      ai_proposition: aiProposition,
      image_path: mealData.image_path || null,
    };

    // Step 5: Insert meal into database
    const { data: createdMeal, error: insertError } = await locals.supabase
      .from("meals")
      .insert(dbInsert)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create meal: ${insertError.message}`);
    }

    // Step 6: Transform to DTO (flatten ai_proposition fields)
    const mealDto: MealDto = {
      ...createdMeal,
      name: aiProposition.name,
      ingredients: aiProposition.ingredients,
      steps: aiProposition.steps,
    };

    return new Response(JSON.stringify(mealDto), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError(error, `POST /api/weeks/${params.week_id}/meals`);

    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
