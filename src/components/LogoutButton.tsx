import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Wystąpił błąd podczas wylogowania");
        return;
      }

      toast.success("Wylogowano pomyślnie");

      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout} disabled={isLoading}>
      {isLoading ? "Wylogowywanie..." : "Wyloguj się"}
    </Button>
  );
}
