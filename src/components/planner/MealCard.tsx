import { Card, CardContent } from "@/components/ui/card";
import type { MealDto } from "../../types";
import { isIconPath, extractIconName, getMealIcon, getPlaceholderIcon } from "../../lib/mealIcons";

interface MealCardProps {
  meal: MealDto;
  onClick?: () => void;
}

/**
 * MealCard - compact display of a meal with name, macros, and optional image.
 * Used within MealCell to show existing meals.
 */
export function MealCard({ meal, onClick }: MealCardProps) {
  const hasIcon = isIconPath(meal.image_path);
  const iconName = extractIconName(meal.image_path);

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
        {/* Meal image, icon, or placeholder */}
        <div className="aspect-video rounded-md overflow-hidden bg-muted relative">
          {hasIcon && iconName ? (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              {getMealIcon(iconName, "w-12 h-12 sm:w-16 sm:h-16 text-primary")}
            </div>
          ) : meal.image_path && !hasIcon ? (
            <img src={meal.image_path} alt={meal.name || "Zdjęcie posiłku"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">{getPlaceholderIcon()}</div>
          )}
        </div>

        {/* Meal name */}
        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]" title={meal.name}>
          {meal.name || "Bez nazwy"}
        </h3>

        {/* Macros */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="font-semibold text-foreground">{meal.kcal}</span>
            <span>kcal</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="font-semibold text-foreground">{meal.protein}g</span>
            <span>białka</span>
          </div>
        </div>

        {/* Source indicator */}
        {meal.source === "ai_generated" && (
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-primary">
            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path
                fillRule="evenodd"
                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                clipRule="evenodd"
              />
            </svg>
            <span>AI</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
