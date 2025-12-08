import { useState } from "react";
import { toast } from "sonner";
import type { RegisterApiData } from "@/lib/schemas/auth";

interface UseRegisterOptions {
  redirectTo?: string;
  onSuccess?: () => void;
}

interface UseRegisterReturn {
  register: (credentials: RegisterApiData) => Promise<void>;
  isLoading: boolean;
  serverError: string | null;
  clearError: () => void;
}

/**
 * Custom hook for handling user registration
 * Manages API call, loading state, and error handling
 */
export function useRegister(options: UseRegisterOptions = {}): UseRegisterReturn {
  const { redirectTo = "/planner", onSuccess } = options;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const register = async (credentials: RegisterApiData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Wystąpił błąd podczas rejestracji";
        setServerError(errorMessage);
        throw new Error(errorMessage);
      }

      // Success
      toast.success("Rejestracja zakończona pomyślnie!");

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
    register,
    isLoading,
    serverError,
    clearError,
  };
}

