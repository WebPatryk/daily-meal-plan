// src/lib/generation.service.ts
// Meal Generation Service – warstwa biznesowa dla generowania posiłków AI
// =============================================================================

import { createOpenRouterService } from "./openrouter.service";
import type { OpenRouterService } from "./openrouter.service";
import type { LLMResponse } from "./openrouter.types";
import type { DayOfWeek, MealType } from "../types";

// ---------------------------------------------------------------------------
// TYPE DEFINITIONS
// ---------------------------------------------------------------------------

/**
 * Parameters for AI meal generation.
 */
export interface MealGenerationParams {
  /** Calorie range for the meal */
  kcal_range: { min: number; max: number };
  /** Protein range for the meal (in grams) */
  protein_range: { min: number; max: number };
  /** Free-form description to guide AI generation */
  description: string;
  /** Day of the week this meal is for */
  day_of_week: DayOfWeek;
  /** Type of meal (breakfast, lunch, etc.) */
  meal_type: MealType;
}

/**
 * Available meal icon categories
 */
export type MealIcon =
  | "breakfast" // śniadanie - jajka, płatki, tosty
  | "salad" // sałatki, warzywa
  | "meat" // mięso, kurczak
  | "fish" // ryby, owoce morza
  | "pasta" // makarony, dania z makaronem
  | "soup" // zupy
  | "dessert" // desery, słodycze
  | "fruit" // owoce, smoothie
  | "vegetarian" // dania wegańskie/wegetariańskie
  | "snack"; // przekąski

/**
 * Structured AI-generated meal response.
 */
export interface GeneratedMeal {
  /** Creative meal name */
  name: string;
  /** Exact calorie count (within specified range) */
  kcal: number;
  /** Exact protein amount in grams (within specified range) */
  protein: number;
  /** Icon category representing the meal type */
  icon: MealIcon;
  /** List of ingredients with quantities */
  ingredients: string[];
  /** Step-by-step cooking instructions */
  steps: string[];
}

/**
 * Error thrown when meal generation fails.
 */
export class MealGenerationError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "MealGenerationError";
  }
}

// ---------------------------------------------------------------------------
// MEAL GENERATION SERVICE
// ---------------------------------------------------------------------------

/**
 * Service for generating meals using AI (OpenRouter + GPT-4o-mini).
 *
 * Features:
 * - Structured JSON schema validation
 * - Type-safe meal generation
 * - Nutritional requirement enforcement
 * - Detailed ingredient and preparation steps
 *
 * @example
 * ```ts
 * const service = new MealGenerationService();
 * const meal = await service.generateMeal({
 *   kcal_range: { min: 400, max: 600 },
 *   protein_range: { min: 25, max: 40 },
 *   description: "Healthy vegetarian breakfast",
 *   day_of_week: "monday",
 *   meal_type: "breakfast"
 * });
 * ```
 */
export class MealGenerationService {
  readonly #openRouter: OpenRouterService;
  readonly #model: string;

  constructor(openRouter?: OpenRouterService) {
    this.#openRouter =
      openRouter ??
      createOpenRouterService({
        defaultModel: "openai/gpt-4o-mini",
        defaultParams: {
          temperature: 0.8,
          max_tokens: 1500,
        },
      });
    this.#model = "openai/gpt-4o-mini";
  }

  /**
   * Generates a meal using AI based on provided parameters.
   *
   * @param params - Meal generation parameters (ranges, description, etc.)
   * @returns Generated meal with nutritional info, ingredients, and steps
   * @throws {MealGenerationError} If generation fails or response is invalid
   */
  async generateMeal(params: MealGenerationParams): Promise<GeneratedMeal> {
    try {
      // Validate input parameters
      this.#validateParams(params);

      // Build AI prompt
      const prompt = this.#buildPrompt(params);

      // Call OpenRouter with structured output
      const response = await this.#openRouter.chat(
        [
          {
            role: "system",
            content: this.#getSystemPrompt(),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        {
          model: this.#model,
          params: {
            temperature: 0.8,
            max_tokens: 1500,
          },
          responseFormat: this.#getResponseSchema(),
        }
      );

      // Parse and validate AI response
      const meal = this.#parseResponse(response);

      // Validate generated meal meets requirements
      this.#validateGeneratedMeal(meal, params);

      return meal;
    } catch (error) {
      if (error instanceof MealGenerationError) {
        throw error;
      }

      throw new MealGenerationError("Failed to generate meal with AI", error);
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------

  /**
   * Validates input parameters before generation.
   */
  #validateParams(params: MealGenerationParams): void {
    const { kcal_range, protein_range, description } = params;

    // Validate calorie range
    if (kcal_range.min < 1 || kcal_range.max > 3000) {
      throw new MealGenerationError("Calorie range must be between 1 and 3000 kcal");
    }

    if (kcal_range.min >= kcal_range.max) {
      throw new MealGenerationError("Minimum calories must be less than maximum calories");
    }

    // Validate protein range
    if (protein_range.min < 1 || protein_range.max > 300) {
      throw new MealGenerationError("Protein range must be between 1 and 300g");
    }

    if (protein_range.min >= protein_range.max) {
      throw new MealGenerationError("Minimum protein must be less than maximum protein");
    }

    // Validate description
    if (!description || description.trim().length === 0) {
      throw new MealGenerationError("Description cannot be empty");
    }

    if (description.length > 500) {
      throw new MealGenerationError("Description is too long (max 500 characters)");
    }
  }

  /**
   * Returns the system prompt for AI meal generation.
   */
  #getSystemPrompt(): string {
    return `Jesteś profesjonalnym dietetykiem i szefem kuchni z wieloletnim doświadczeniem.

Twoje zadanie to tworzenie szczegółowych, zdrowych i smacznych przepisów kulinarnych zgodnie z wymaganiami użytkownika.

Wytyczne:
- Twórz realistyczne, wykonalne przepisy
- Używaj łatwo dostępnych składników
- Podawaj dokładne ilości składników
- Opisuj kroki przygotowania w sposób jasny i zrozumiały
- Dostosowuj posiłki do określonego typu i pory dnia
- Uwzględniaj wartości odżywcze (kalorie i białko) w podanych zakresach
- Dbaj o różnorodność i smak
- Wszystkie odpowiedzi podawaj po polsku
- Zawsze zwracaj poprawny JSON zgodny ze schematem`;
  }

  /**
   * Builds the user prompt for AI generation.
   */
  #buildPrompt(params: MealGenerationParams): string {
    const { kcal_range, protein_range, description, day_of_week, meal_type } = params;

    // Translate meal types and days to Polish
    const mealTypeLabels: Record<MealType, string> = {
      breakfast: "Śniadanie",
      second_breakfast: "Drugie śniadanie",
      lunch: "Obiad",
      snack: "Podwieczorek",
      dinner: "Kolacja",
    };

    const dayLabels: Record<DayOfWeek, string> = {
      monday: "Poniedziałek",
      tuesday: "Wtorek",
      wednesday: "Środa",
      thursday: "Czwartek",
      friday: "Piątek",
      saturday: "Sobota",
      sunday: "Niedziela",
    };

    return `Wygeneruj posiłek spełniający następujące wymagania:

📊 Wymagania żywieniowe:
- Kalorie: od ${kcal_range.min} do ${kcal_range.max} kcal
- Białko: od ${protein_range.min} do ${protein_range.max}g

📅 Kontekst:
- Dzień tygodnia: ${dayLabels[day_of_week]}
- Rodzaj posiłku: ${mealTypeLabels[meal_type]}

📝 Opis preferencji użytkownika:
${description}

Wygeneruj szczegółowy przepis zawierający:
1. Kreatywną i apetyczną nazwę posiłku
2. Dokładne wartości kaloryczne i białkowe (w podanych zakresach)
3. Odpowiednią ikonę posiłku z dostępnych kategorii:
   - breakfast: śniadanie (jajka, płatki, tosty)
   - salad: sałatki i dania warzywne
   - meat: dania mięsne (kurczak, wołowina, wieprzowina)
   - fish: ryby i owoce morza
   - pasta: makarony i dania z makaronem
   - soup: zupy
   - dessert: desery i słodycze
   - fruit: owoce, smoothie, koktajle owocowe
   - vegetarian: dania wegańskie i wegetariańskie
   - snack: przekąski
4. Listę składników z konkretnymi ilościami (np. "200g kurczaka", "1 łyżka oliwy")
5. Krok po kroku instrukcje przygotowania

WAŻNE: Zwróć odpowiedź jako JSON zgodny ze schematem response_format.`;
  }

  /**
   * Returns the JSON schema for structured AI responses.
   */
  #getResponseSchema() {
    return {
      type: "json_schema" as const,
      json_schema: {
        name: "meal_generation",
        strict: true as const,
        schema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Kreatywna nazwa posiłku po polsku",
            },
            kcal: {
              type: "number",
              description: "Dokładna liczba kalorii (w podanym zakresie)",
            },
            protein: {
              type: "number",
              description: "Dokładna ilość białka w gramach (w podanym zakresie)",
            },
            icon: {
              type: "string",
              description:
                "Kategoria ikony posiłku: breakfast, salad, meat, fish, pasta, soup, dessert, fruit, vegetarian, snack",
              enum: ["breakfast", "salad", "meat", "fish", "pasta", "soup", "dessert", "fruit", "vegetarian", "snack"],
            },
            ingredients: {
              type: "array",
              description: "Lista składników z konkretnymi ilościami",
              items: { type: "string" },
              minItems: 1,
            },
            steps: {
              type: "array",
              description: "Krok po kroku instrukcje przygotowania",
              items: { type: "string" },
              minItems: 1,
            },
          },
          required: ["name", "kcal", "protein", "icon", "ingredients", "steps"],
          additionalProperties: false,
        },
      },
    };
  }

  /**
   * Parses and validates the AI response.
   */
  #parseResponse(response: LLMResponse): GeneratedMeal {
    try {
      const content = response.message.content;
      const meal = JSON.parse(content) as GeneratedMeal;

      // Validate required fields
      if (!meal.name || typeof meal.name !== "string") {
        throw new Error("Invalid or missing 'name' field");
      }

      if (typeof meal.kcal !== "number" || meal.kcal <= 0) {
        throw new Error("Invalid or missing 'kcal' field");
      }

      if (typeof meal.protein !== "number" || meal.protein <= 0) {
        throw new Error("Invalid or missing 'protein' field");
      }

      if (!meal.icon || typeof meal.icon !== "string") {
        throw new Error("Invalid or missing 'icon' field");
      }

      // Validate icon is one of allowed values
      const validIcons: MealIcon[] = [
        "breakfast",
        "salad",
        "meat",
        "fish",
        "pasta",
        "soup",
        "dessert",
        "fruit",
        "vegetarian",
        "snack",
      ];
      if (!validIcons.includes(meal.icon as MealIcon)) {
        throw new Error(`Invalid icon value: ${meal.icon}`);
      }

      if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
        throw new Error("Invalid or missing 'ingredients' field");
      }

      if (!Array.isArray(meal.steps) || meal.steps.length === 0) {
        throw new Error("Invalid or missing 'steps' field");
      }

      return meal;
    } catch (error) {
      throw new MealGenerationError("Failed to parse AI response", error);
    }
  }

  /**
   * Validates that the generated meal meets the specified requirements.
   */
  #validateGeneratedMeal(meal: GeneratedMeal, params: MealGenerationParams): void {
    const { kcal_range, protein_range } = params;

    // Validate calorie range (with 10% tolerance)
    const kcalTolerance = (kcal_range.max - kcal_range.min) * 0.1;
    if (meal.kcal < kcal_range.min - kcalTolerance || meal.kcal > kcal_range.max + kcalTolerance) {
      throw new MealGenerationError(
        `Generated meal calories (${meal.kcal}) outside acceptable range (${kcal_range.min}-${kcal_range.max})`
      );
    }

    // Validate protein range (with 10% tolerance)
    const proteinTolerance = (protein_range.max - protein_range.min) * 0.1;
    if (meal.protein < protein_range.min - proteinTolerance || meal.protein > protein_range.max + proteinTolerance) {
      throw new MealGenerationError(
        `Generated meal protein (${meal.protein}g) outside acceptable range (${protein_range.min}-${protein_range.max}g)`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// FACTORY FUNCTION
// ---------------------------------------------------------------------------

/**
 * Creates a MealGenerationService instance.
 * Convenience factory for quick instantiation.
 *
 * @param openRouter - Optional custom OpenRouter service instance
 * @returns Configured MealGenerationService
 *
 * @example
 * ```ts
 * const service = createMealGenerationService();
 * const meal = await service.generateMeal({...});
 * ```
 */
export function createMealGenerationService(openRouter?: OpenRouterService): MealGenerationService {
  return new MealGenerationService(openRouter);
}
