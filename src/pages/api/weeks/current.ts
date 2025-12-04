import type { APIRoute } from "astro";
import { logError } from "@/lib/utils";

/**
 * GET /api/weeks/current - Get or create the current week for authenticated user
 *
 * This endpoint ensures that a user always has an active week.
 * If no week exists for the current Monday, it creates one automatically.
 *
 * Returns:
 * - 200: WeekDto - The current week
 * - 401: { error: string } - Unauthorized
 * - 500: { error: string } - Internal server error
 */
export const GET: APIRoute = async ({ locals }) => {
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

    // Step 2: Calculate current Monday (ISO week start)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday=0, Monday=1
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday);
    const startDate = monday.toISOString().split("T")[0]; // YYYY-MM-DD

    // Step 3: Try to fetch existing week for current Monday
    const { data: existingWeeks } = await locals.supabase
      .from("weeks")
      .select("*")
      .eq("user_id", user.id)
      .eq("start_date", startDate)
      .limit(1);

    if (existingWeeks && existingWeeks.length > 0) {
      // Week exists, return it
      return new Response(JSON.stringify(existingWeeks[0]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=60",
        },
      });
    }

    // Step 4: Week doesn't exist, create it
    const { data: newWeek, error: createError } = await locals.supabase
      .from("weeks")
      .insert({
        user_id: user.id,
        start_date: startDate,
      })
      .select()
      .single();

    if (createError || !newWeek) {
      throw new Error(`Failed to create week: ${createError?.message}`);
    }

    // Step 5: Return the newly created week
    return new Response(JSON.stringify(newWeek), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    logError(error, "GET /api/weeks/current");

    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
