import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const result = cn("foo", false && "bar", "baz");
    expect(result).toBe("foo baz");
  });

  it("should merge Tailwind classes correctly", () => {
    const result = cn("p-4", "p-2");
    // twMerge powinien zachować tylko ostatnią wartość dla tego samego property
    expect(result).toBe("p-2");
  });

  it("should handle empty input", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle undefined and null values", () => {
    const result = cn("foo", undefined, "bar", null);
    expect(result).toBe("foo bar");
  });

  it("should handle array of classes", () => {
    const result = cn(["foo", "bar"]);
    expect(result).toBe("foo bar");
  });

  it("should handle objects with boolean values", () => {
    const result = cn({
      foo: true,
      bar: false,
      baz: true,
    });
    expect(result).toBe("foo baz");
  });
});
