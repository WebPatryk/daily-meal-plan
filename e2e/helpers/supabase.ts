import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Tworzy klienta Supabase do użycia w testach E2E
 * Używa zmiennych środowiskowych SUPABASE_URL i SUPABASE_KEY
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_KEY environment variables. " + "Make sure they are set in your .env file."
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Pobiera ID użytkownika testowego
 */
export async function getTestUserId(email: string): Promise<string | null> {
  const supabase = createTestSupabaseClient();

  // Logowanie jako użytkownik testowy aby uzyskać jego ID
  const testPassword = process.env.TEST_PASSWORD || "Lekki123";
  if (!testPassword) {
    throw new Error("Missing TEST_PASSWORD environment variable");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: testPassword,
  });

  if (error || !data.user) {
    console.error("Failed to get test user ID:", error);
    return null;
  }

  // Wyloguj się po uzyskaniu ID
  await supabase.auth.signOut();

  return data.user.id;
}
