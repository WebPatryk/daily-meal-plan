import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserGoals {
  kcal_target: number | null;
  protein_target: number | null;
}

interface ProfilePageProps {
  user?: {
    email: string;
    id: string;
  };
}

export function ProfilePage({ user }: ProfilePageProps) {
  const [goals, setGoals] = useState<UserGoals>({ kcal_target: null, protein_target: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/profile/goals");
      if (!response.ok) {
        throw new Error("Failed to fetch goals");
      }
      const data = await response.json();
      setGoals(data);
    } catch {
      toast.error("Nie udało się pobrać celów żywieniowych");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/goals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goals),
      });

      if (!response.ok) {
        throw new Error("Failed to update goals");
      }

      const data = await response.json();
      setGoals(data);
      toast.success("Cele żywieniowe zostały zaktualizowane");
    } catch {
      toast.error("Nie udało się zaktualizować celów żywieniowych");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserGoals, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setGoals((prev) => ({ ...prev, [field]: numValue }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-muted-foreground">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cele Żywieniowe</CardTitle>
          <CardDescription>Ustaw swoje dzienne cele kaloryczne i białkowe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kcal_target">Dzienny cel kaloryczny (kcal)</Label>
              <Input
                id="kcal_target"
                type="number"
                min="0"
                max="10000"
                step="1"
                value={goals.kcal_target ?? ""}
                onChange={(e) => handleInputChange("kcal_target", e.target.value)}
                placeholder="np. 2000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein_target">Dzienny cel białkowy (g)</Label>
              <Input
                id="protein_target"
                type="number"
                min="0"
                max="1000"
                step="1"
                value={goals.protein_target ?? ""}
                onChange={(e) => handleInputChange("protein_target", e.target.value)}
                placeholder="np. 150"
                required
              />
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacje o koncie</CardTitle>
          <CardDescription>Szczegóły Twojego konta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm font-medium text-muted-foreground">Email:</span>
              <span className="text-sm">{user?.email || "Nieznany"}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
