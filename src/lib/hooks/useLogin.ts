import { useState } from "react";
import { toast } from "sonner";
import type { LoginFormData } from "@/lib/schemas/auth";

interface UseLoginOptions {
  redirectTo?: string;
  onSuccess?: () => void;
}

interface UseLoginReturn {
  login: (credentials: LoginFormData) => Promise<void>;
  isLoading: boolean;
  serverError: string | null;
  clearError: () => void;
}

/**
 * Custom hook for handling user login
 * Manages API call, loading state, and error handling
 */
export function useLogin(options: UseLoginOptions = {}): UseLoginReturn {
  const { redirectTo = "/planner", onSuccess } = options;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Wystąpił błąd podczas logowania";
        setServerError(errorMessage);
        throw new Error(errorMessage);
      }

      // Success
      toast.success("Zalogowano pomyślnie!");

      if (onSuccess) {
        onSuccess();
      }

      // Small delay to show toast before redirect
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 500);
    } catch (error) {
      // Error already set in serverError state
      if (error instanceof Error && !serverError) {
        setServerError(error.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setServerError(null);
  };

  return {
    login,
    isLoading,
    serverError,
    clearError,
  };
}
