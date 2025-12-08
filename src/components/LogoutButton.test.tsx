import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "./LogoutButton";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    // Clear all mocks przed każdym testem
    vi.clearAllMocks();

    // Mock fetch API
    global.fetch = vi.fn();

    // Mock window.location
    delete (window as any).location;
    window.location = { href: "" } as any;
  });

  it("should render logout button", () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /wyloguj się/i });
    expect(button).toBeInTheDocument();
  });

  it("should show loading state when clicked", async () => {
    const user = userEvent.setup();

    // Mock fetch do zwrócenia pending promise
    (global.fetch as any).mockImplementation(
      () => new Promise(() => {}) // Promise, który nigdy się nie resolve'uje
    );

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /wyloguj się/i });
    await user.click(button);

    // Sprawdź czy przycisk pokazuje stan ładowania
    expect(screen.getByText(/wylogowywanie\.\.\./i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("should call logout API on button click", async () => {
    const user = userEvent.setup();

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /wyloguj się/i });
    await user.click(button);

    // Sprawdź czy fetch został wywołany z poprawnymi parametrami
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
  });

  it("should handle successful logout", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");

    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /wyloguj się/i });
    await user.click(button);

    // Sprawdź czy toast.success został wywołany
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Wylogowano pomyślnie");
    });

    // Sprawdź czy nastąpiło przekierowanie
    expect(window.location.href).toBe("/auth/login");
  });

  it("should handle logout error", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");

    // Mock error API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /wyloguj się/i });
    await user.click(button);

    // Sprawdź czy toast.error został wywołany
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized");
    });

    // Przycisk powinien być ponownie aktywny
    expect(button).not.toBeDisabled();
  });

  it("should handle network error", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");

    // Mock network error
    (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<LogoutButton />);

    const button = screen.getByRole("button", { name: /wyloguj się/i });
    await user.click(button);

    // Sprawdź czy toast.error został wywołany z ogólnym komunikatem
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Wystąpił nieoczekiwany błąd");
    });

    // Sprawdź czy błąd został zalogowany
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
