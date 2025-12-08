import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import type { WeekDto, PaginatedResponse } from "../types";
import type { WeeksQuerySchemaType } from "./schemas/weeks";

/**
 * Service for managing weeks data.
 * Handles all business logic related to fetching and filtering weeks.
 */
export class WeeksService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Lists weeks for the authenticated user with pagination and filtering.
   *
   * @param userId - The authenticated user's ID
   * @param query - Validated query parameters from WeeksQuerySchema
   * @returns Paginated list of weeks
   *
   * @throws Error if database query fails
   */
  async listWeeks(userId: string, query: WeeksQuerySchemaType): Promise<PaginatedResponse<WeekDto>> {
    const { limit, offset, start_date, sort } = query;

    // Start building the query
    let queryBuilder = this.supabase.from("weeks").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply date filtering based on start_date
    if (start_date) {
      // Filter by specific start_date
      queryBuilder = queryBuilder.eq("start_date", start_date);
    }

    // Apply sorting
    const ascending = sort === "start_date:asc";
    queryBuilder = queryBuilder.order("start_date", { ascending });

    // Apply pagination
    const rangeStart = offset;
    const rangeEnd = offset + limit - 1;
    queryBuilder = queryBuilder.range(rangeStart, rangeEnd);

    // Execute the query
    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch weeks: ${error.message}`);
    }

    return {
      items: (data ?? []) as WeekDto[],
      total: count ?? 0,
    };
  }
}

/**
 * Factory function to create a WeeksService instance.
 * Use this in API routes to instantiate the service.
 *
 * @param supabase - Supabase client from context.locals
 * @returns WeeksService instance
 */
export function createWeeksService(supabase: SupabaseClient<Database>): WeeksService {
  return new WeeksService(supabase);
}
