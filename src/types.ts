// src/types.ts - shared DTO & Command Model definitions
// =====================================================
// These types bridge the public REST API contract (see .ai/api-plan.md)
// with the underlying database entities generated in `src/db/database.types.ts`.
// We build on top of the auto-generated types via utility helpers such as `Pick`,
// `Omit` and `Partial` to ensure full type-safety while allowing the API layer
// to expose only the required surface.

import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ---------------------------------------------------------------------------
// ENUM RE-EXPORTS
// ---------------------------------------------------------------------------

// Re-export database enums so consumers can import them directly from this file.
export type DayOfWeek = Enums<"day_of_week_enum">;
export type MealType = Enums<"meal_type_enum">;

// ---------------------------------------------------------------------------
// WEEK
// ---------------------------------------------------------------------------

// Public representation of a Week entity.
export type WeekDto = Tables<"weeks">;

// POST /weeks → body payload
export type CreateWeekCommand = Pick<TablesInsert<"weeks">, "start_date">;

// PATCH /weeks/{week_id} → body payload (all fields optional)
export type UpdateWeekCommand = Partial<Pick<TablesUpdate<"weeks">, "start_date">>;

// ---------------------------------------------------------------------------
// MEAL
// ---------------------------------------------------------------------------

// Additional descriptive meal fields that currently live inside `ai_proposition`
// JSON column. We make them explicit for the API surface even though they map
// to a nested JSON structure in the DB.
interface MealDescription {
  /** Human-readable meal name (e.g. "Oatmeal & Berries"). */
  name: string;
  /** Ordered list of ingredient strings. */
  ingredients: string[];
  /** Ordered list of preparation steps. */
  steps: string[];
}

// Public representation of a Meal – merge DB row with descriptive fields.
export type MealDto = Tables<"meals"> & Partial<MealDescription>;

// POST /weeks/{week_id}/meals → body payload
export type CreateMealCommand =
  // Core DB columns we allow the client to set
  Pick<TablesInsert<"meals">, "week_id" | "day_of_week" | "meal_type" | "kcal" | "protein" | "image_path" | "source"> &
    MealDescription;

// PATCH /meals/{meal_id} → body payload (all fields optional)
export type UpdateMealCommand = Partial<
  Pick<TablesUpdate<"meals">, "day_of_week" | "meal_type" | "kcal" | "protein" | "image_path" | "ai_proposition">
> &
  Partial<MealDescription>;

// POST /meals/ai-generate → body payload
export interface AiGenerateMealCommand {
  kcal_range: { min: number; max: number };
  protein_range: { min: number; max: number };
  /** Free-form textual description that guides the AI (e.g. "high-fiber vegetarian lunch"). */
  description: string;
  /** Persist the generated meal when `true`; otherwise return as preview only. */
  save: boolean;
  // Slot placement info (optional when save=false but we keep required for simplicity)
  week_id: Tables<"weeks">["week_id"];
  day_of_week: DayOfWeek;
  meal_type: MealType;
}

// PUT /meals/{meal_id}/image → we only expose the raw `File`/`Blob` to the API layer;
// handling happens in the route code.
export interface PutMealImageCommand {
  file: Blob; // ≤ 1 MB validated at the handler level
}

// ---------------------------------------------------------------------------
// USER GOAL
// ---------------------------------------------------------------------------

export type UserGoalDto = Tables<"user_goals">;

// POST /user-goals → body payload
export type CreateUserGoalCommand = Pick<TablesInsert<"user_goals">, "kcal_target" | "protein_target" | "valid_from">;

// PATCH /user-goals/{goal_id} – currently only `valid_to` can be changed.
export type UpdateUserGoalCommand = Partial<Pick<TablesUpdate<"user_goals">, "valid_to">>;

// ---------------------------------------------------------------------------
// PAGINATION HELPERS (shared across list endpoints)
// ---------------------------------------------------------------------------

export interface PaginationQuery {
  limit?: number; // 1-100, default 20
  offset?: number; // 0-n
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

// ---------------------------------------------------------------------------
// FILTER & SORT QUERY TYPES (examples for Weeks / Meals)
// ---------------------------------------------------------------------------

export interface WeeksQuery extends PaginationQuery {
  start_date?: string; // filter by ISO date string (YYYY-MM-DD)
  history?: boolean;
  sort?: "start_date:asc" | "start_date:desc";
}

export interface MealsQuery extends PaginationQuery {
  day_of_week?: DayOfWeek;
  meal_type?: MealType;
  sort?: "day_of_week" | "day_of_week,meal_type";
}

// ---------------------------------------------------------------------------
// UTILITY TYPE GUARDS (optional helpers)
// ---------------------------------------------------------------------------

/** Runtime helper – narrows an unknown object to `MealDescription`. */
export function isMealDescription(obj: unknown): obj is MealDescription {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.name === "string" && Array.isArray(o.ingredients) && Array.isArray(o.steps);
}

// ---------------------------------------------------------------------------
// PLANNER VIEW MODELS
// ---------------------------------------------------------------------------

/**
 * View-model for a single grid cell in the week planner.
 * Represents a meal slot (day × meal type) with optional meal data.
 */
export interface GridCellVM {
  day: DayOfWeek;
  mealType: MealType;
  meal?: MealDto; // undefined = empty slot
}

/**
 * Active week state with computed totals.
 * Used by PlannerContext to manage the current week's data.
 */
export interface ActiveWeekState {
  week: WeekDto;
  meals: MealDto[];
  totals: {
    kcal: number;
    protein: number;
  };
}

/**
 * Planner context value provided to all planner components.
 */
export interface PlannerContextValue {
  state: ActiveWeekState;
  isLoading: boolean;
  error?: Error;
  // Actions
  addMeal: (meal: CreateMealCommand) => Promise<void>;
  updateMeal: (mealId: string, meal: UpdateMealCommand) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  changeWeek: (direction: "prev" | "next") => Promise<void>;
  refreshData: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// OPENROUTER SERVICE TYPES (re-exported for convenience)
// ---------------------------------------------------------------------------

export type {
  Role,
  Message,
  SystemMessage,
  UserMessage,
  AssistantMessage,
  ResponseFormatSchema,
  ModelParams,
  ChatOptions,
  TokenUsage,
  LLMResponse,
  OpenRouterServiceOptions,
} from "./lib/openrouter.types";

export {
  OpenRouterError,
  AuthError,
  RateLimitError,
  ServiceUnavailableError,
  SchemaValidationError,
  TimeoutError,
} from "./lib/openrouter.types";