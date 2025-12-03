import { cn } from "@/lib/utils";

interface AuthErrorProps {
  message?: string | null;
  className?: string;
}

/**
 * Component for displaying authentication error messages
 */
export function AuthError({ message, className }: AuthErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive dark:border-destructive/30 dark:bg-destructive/20",
        className
      )}
    >
      <svg
        className="size-4 shrink-0 mt-0.5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
      <span className="flex-1">{message}</span>
    </div>
  );
}

/**
 * Maps Supabase error codes to user-friendly messages in Polish
 */
export function mapAuthError(code?: string): string {
  const errorMap: Record<string, string> = {
    // Supabase Auth errors
    invalid_credentials: "Nieprawidłowy email lub hasło",
    email_exists: "Konto z tym adresem email już istnieje",
    weak_password: "Hasło jest zbyt słabe",
    invalid_email: "Nieprawidłowy format adresu email",
    user_not_found: "Nie znaleziono użytkownika",
    email_not_confirmed: "Email nie został potwierdzony",
    too_many_requests: "Zbyt wiele prób. Spróbuj ponownie później",

    // Generic errors
    network_error: "Błąd połączenia. Sprawdź swoje połączenie internetowe",
    server_error: "Wystąpił błąd serwera. Spróbuj ponownie później",
  };

  return errorMap[code || ""] || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie";
}


