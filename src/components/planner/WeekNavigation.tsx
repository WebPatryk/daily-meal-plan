import { Button } from "@/components/ui/button";
import type { WeekDto } from "../../types";

interface WeekNavigationProps {
  week: WeekDto;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * WeekNavigation - displays the current week date range with navigation arrows.
 * Allows user to navigate to previous/next weeks.
 */
export function WeekNavigation({ week, onPrev, onNext }: WeekNavigationProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  // Calculate end date (6 days after start)
  const getEndDate = (startDate: string) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 6);
    return date.toISOString().split("T")[0];
  };

  const startDate = formatDate(week.start_date);
  const endDate = formatDate(getEndDate(week.start_date));

  return (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" size="icon" onClick={onPrev} aria-label="Poprzedni tydzień">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>

      <div className="flex-1 text-center">
        <h2 className="text-xl font-semibold">
          {startDate} - {endDate}
        </h2>
        <p className="text-sm text-muted-foreground">Tydzień {new Date(week.start_date).getWeek()}</p>
      </div>

      <Button variant="outline" size="icon" onClick={onNext} aria-label="Następny tydzień">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  );
}

// Extend Date prototype for week number calculation
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function () {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};
