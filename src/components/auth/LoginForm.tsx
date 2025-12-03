import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthError } from "./AuthError";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { toast } from "sonner";

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void>;
  redirectTo?: string;
}

/**
 * Login form component with email, password, and remember me fields
 */
export function LoginForm({ onSubmit, redirectTo }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Validate form data
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmit) {
        await onSubmit(result.data);
      } else {
        // Default behavior - call login API
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(result.data),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.error || "Wystąpił błąd podczas logowania");
          return;
        }

        // Success - show toast and redirect
        toast.success("Zalogowano pomyślnie!");

        // Small delay to show toast before redirect
        setTimeout(() => {
          window.location.href = redirectTo || "/planner";
        }, 500);
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby uzyskać dostęp do swojego konta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthError message={serverError} />

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="twoj@email.com"
              value={formData.email}
              onChange={handleChange("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isLoading}
              autoComplete="email"
              required
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={isLoading}
              autoComplete="current-password"
              required
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Nie masz konta? </span>
            <a href="/auth/register" className="text-primary hover:underline font-medium">
              Zarejestruj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
