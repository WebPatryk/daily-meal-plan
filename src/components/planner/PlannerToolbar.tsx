import { Button } from "@/components/ui/button";
import type { WeekDto } from "../../types";
import { WeekNavigation } from "./WeekNavigation";

interface PlannerToolbarProps {
  week: WeekDto;
  onPrev: () => void;
  onNext: () => void;
  onGenerateAI: () => void;
}

/**
 * PlannerToolbar - top toolbar with week navigation and AI generation button.
 */
export function PlannerToolbar({ week, onPrev, onNext, onGenerateAI }: PlannerToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b">
      {/* Week Navigation */}
      <div className="flex-1 min-w-0">
        <WeekNavigation week={week} onPrev={onPrev} onNext={onNext} />
      </div>

      {/* AI Generate Button */}
      <Button onClick={onGenerateAI} className="gap-2 shrink-0" size="default">
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 7H7v6h6V7z" />
          <path
            fillRule="evenodd"
            d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm sm:text-base">Generuj AI</span>
      </Button>
    </div>
  );
}
