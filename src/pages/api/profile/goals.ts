import type { APIRoute } from "astro";
import { z } from "zod";
import { logError } from "@/lib/utils";

export const prerender = false;

const UpdateGoalsSchema = z.object({
  kcal_target: z.number().min(0).max(10000),
  protein_target: z.number().min(0).max(1000),
});

/**
 * GET /api/profile/goals - Get current user goals
 *
 * Returns:
 * - 200: { kcal_target: number, protein_target: number } - Current goals or null if none exist
 * - 401: { error: string } - Unauthorized
 * - 500: { error: string } - Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
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

    // Get current valid goal
    const { data: goals, error: goalsError } = await locals.supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", user.id)
      .is("valid_to", null)
      .order("valid_from", { ascending: false })
      .limit(1);

    if (goalsError) {
      logError(goalsError, "GET /api/profile/goals");
      return new Response(JSON.stringify({ error: "Failed to fetch goals" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentGoal = goals && goals.length > 0 ? goals[0] : null;

    return new Response(
      JSON.stringify({
        kcal_target: currentGoal?.kcal_target || null,
        protein_target: currentGoal?.protein_target || null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (error) {
    logError(error, "GET /api/profile/goals");
    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/profile/goals - Update user goals
 *
 * Body:
 * - kcal_target: number (0-10000)
 * - protein_target: number (0-1000)
 *
 * Returns:
 * - 200: { kcal_target: number, protein_target: number } - Updated goals
 * - 400: { error: string } - Invalid request body
 * - 401: { error: string } - Unauthorized
 * - 500: { error: string } - Internal server error
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
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

    const body = await request.json();
    const result = UpdateGoalsSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: result.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { kcal_target, protein_target } = result.data;
    const today = new Date().toISOString();

    // Close existing goal if it exists
    await locals.supabase.from("user_goals").update({ valid_to: today }).eq("user_id", user.id).is("valid_to", null);

    // Create new goal
    const { data: newGoal, error: createError } = await locals.supabase
      .from("user_goals")
      .insert({
        user_id: user.id,
        kcal_target,
        protein_target,
        valid_from: today,
        valid_to: null,
      })
      .select()
      .single();

    if (createError) {
      logError(createError, "PUT /api/profile/goals");
      return new Response(JSON.stringify({ error: "Failed to update goals" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        kcal_target: newGoal.kcal_target,
        protein_target: newGoal.protein_target,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logError(error, "PUT /api/profile/goals");
    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
