/**
 * API Client for communicating with the backend.
 * Provides type-safe functions for all planner-related API calls.
 */

import type {
  WeekDto,
  MealDto,
  PaginatedResponse,
  CreateMealCommand,
  UpdateMealCommand,
  AiGenerateMealCommand,
} from "../types";

/**
 * Base URL for API endpoints.
 * In production, this would be configured via environment variables.
 */
const API_BASE = "/api";

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    // Handle different error status codes
    if (response.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Fetches or creates the current week for the authenticated user.
 * This endpoint ensures that a user always has an active week.
 *
 * @returns The current week (never undefined)
 */
export async function getCurrentWeek(): Promise<WeekDto> {
  const response = await fetchApi<WeekDto>(`${API_BASE}/weeks/current`);
  return response;
}

/**
 * Gets a specific week by start date, creating it if it doesn't exist.
 *
 * @param startDate - ISO date string (YYYY-MM-DD) for Monday of the week
 * @returns The week for the specified start date
 */
export async function getWeekByDate(startDate: string): Promise<WeekDto> {
  const response = await fetchApi<PaginatedResponse<WeekDto>>(`${API_BASE}/weeks?start_date=${startDate}&limit=1`);

  // If week exists, return it
  if (response.items.length > 0) {
    return response.items[0];
  }

  // Week doesn't exist, create it
  return createWeek({ start_date: startDate });
}

/**
 * Creates a new week.
 *
 * @param week - Week creation data
 * @returns The created week
 */
export async function createWeek(week: { start_date: string }): Promise<WeekDto> {
  return fetchApi<WeekDto>(`${API_BASE}/weeks`, {
    method: "POST",
    body: JSON.stringify(week),
  });
}

/**
 * Fetches all meals for a specific week.
 *
 * @param weekId - The week's UUID
 * @returns Array of meals for the week
 */
export async function getWeekMeals(weekId: string): Promise<MealDto[]> {
  const response = await fetchApi<MealDto[]>(`${API_BASE}/weeks/${weekId}/meals`);
  return response;
}

/**
 * Creates a new meal.
 *
 * @param weekId - The week's UUID
 * @param meal - Meal creation data
 * @returns The created meal
 */
export async function createMeal(weekId: string, meal: CreateMealCommand): Promise<MealDto> {
  return fetchApi<MealDto>(`${API_BASE}/weeks/${weekId}/meals`, {
    method: "POST",
    body: JSON.stringify(meal),
  });
}

/**
 * Updates an existing meal.
 *
 * @param mealId - The meal's UUID
 * @param meal - Partial meal update data
 * @returns The updated meal
 */
export async function updateMeal(mealId: string, meal: UpdateMealCommand): Promise<MealDto> {
  return fetchApi<MealDto>(`${API_BASE}/meals/${mealId}`, {
    method: "PATCH",
    body: JSON.stringify(meal),
  });
}

/**
 * Deletes a meal.
 *
 * @param mealId - The meal's UUID
 */
export async function deleteMeal(mealId: string): Promise<void> {
  return fetchApi<undefined>(`${API_BASE}/meals/${mealId}`, {
    method: "DELETE",
  });
}

/**
 * Generates a meal using AI.
 *
 * @param command - AI generation parameters
 * @returns The generated meal (persisted if save=true, preview otherwise)
 */
export async function generateMealWithAI(command: AiGenerateMealCommand): Promise<MealDto> {
  return fetchApi<MealDto>(`${API_BASE}/meals/ai-generate`, {
    method: "POST",
    body: JSON.stringify(command),
  });
}
