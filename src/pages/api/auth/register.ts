import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { registerApiSchema } from "../../../lib/schemas/auth.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = registerApiSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane formularza",
          details: result.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { email, password } = result.data;

    // Create Supabase client with cookie management
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Map Supabase error to user-friendly message
      let errorMessage = "Wystąpił błąd podczas rejestracji";

      if (error.message.includes("already registered")) {
        errorMessage = "Konto z tym adresem email już istnieje";
      } else if (error.message.includes("Password")) {
        errorMessage = "Hasło jest zbyt słabe";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create initial week for the new user (current Monday)
    if (data.user) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday=0, Monday=1
      const monday = new Date(today);
      monday.setDate(today.getDate() + daysToMonday);
      const startDate = monday.toISOString().split("T")[0]; // YYYY-MM-DD

      const { error: weekError } = await supabase.from("weeks").insert({
        user_id: data.user.id,
        start_date: startDate,
      });

      if (weekError) {
        console.error("Failed to create initial week:", weekError);
        // Don't fail registration if week creation fails
        // User can create it later
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

