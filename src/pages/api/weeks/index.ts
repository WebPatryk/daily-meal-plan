import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { WeeksQuerySchema, CreateWeekSchema } from "@/lib/schemas/weeks";
import { createWeeksService } from "@/lib/weeksService";
import { logError } from "@/lib/utils";

/**
 * GET /api/weeks - List weeks for the authenticated user
 *
 * Query Parameters:
 * - limit: number (1-100, default: 20)
 * - offset: number (≥0, default: 0)
 * - start_date: string (YYYY-MM-DD, optional)
 * - history: boolean (default: false)
 * - sort: "start_date:asc" | "start_date:desc" (default: "start_date:desc")
 *
 * Returns:
 * - 200: { items: WeekDto[], total: number }
 * - 400: { error: string } - Invalid query parameters
 * - 401: { error: string } - Unauthorized (missing or invalid JWT)
 * - 500: { error: string } - Internal server error
 */
export const GET: APIRoute = async ({ locals, url }) => {
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
    // Step 2: Parse and validate query parameters
    const queryParams = {
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
      start_date: url.searchParams.get("start_date") ?? undefined,
      history: url.searchParams.get("history") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
    };

    let validatedQuery;
    try {
      validatedQuery = WeeksQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        const errorMessage = firstError.message;

        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error; // Re-throw if it's not a ZodError
    }

    // Step 3: Fetch weeks using the service
    const weeksService = createWeeksService(locals.supabase);
    const result = await weeksService.listWeeks(user.id, validatedQuery);

    // Step 4: Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    logError(error, "GET /api/weeks");

    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/weeks - Create a new week
 *
 * Body:
 * - start_date: string (YYYY-MM-DD, Monday of the week)
 *
 * Returns:
 * - 201: WeekDto - The created week
 * - 400: { error: string } - Invalid request body
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
    const body = await request.json();
    
    let validatedData;
    try {
      validatedData = CreateWeekSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        const errorMessage = firstError.message;

        return new Response(JSON.stringify({ error: errorMessage }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // Step 3: Check if week already exists
    const { data: existingWeeks } = await locals.supabase
      .from("weeks")
      .select("*")
      .eq("user_id", user.id)
      .eq("start_date", validatedData.start_date)
      .limit(1);

    if (existingWeeks && existingWeeks.length > 0) {
      // Week already exists, return it
      return new Response(JSON.stringify(existingWeeks[0]), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Step 4: Create the week
    const { data: newWeek, error: createError } = await locals.supabase
      .from("weeks")
      .insert({
        user_id: user.id,
        start_date: validatedData.start_date,
      })
      .select()
      .single();

    if (createError || !newWeek) {
      throw new Error(`Failed to create week: ${createError?.message}`);
    }

    // Step 5: Return the created week
    return new Response(JSON.stringify(newWeek), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logError(error, "POST /api/weeks");

    return new Response(JSON.stringify({ error: "internal_server_error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
