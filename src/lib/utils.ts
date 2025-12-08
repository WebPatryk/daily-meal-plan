import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared helper to log errors consistently across client & server.
 */
export function logError(error: unknown, context = "Unhandled error") {
  // eslint-disable-next-line no-console
  console.error(`[${context}]`, error);
}
