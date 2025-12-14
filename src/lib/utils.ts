import { LoggedInUser } from "@/types";
import { clsx, type ClassValue } from "clsx";
import crypto from "node:crypto";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOtp() {
  // Generate a random number between 10000 and 99999
  const min = 10000;
  const max = 99999;
  const randomBytes = crypto.randomInt(min, max + 1); // randomInt generates an integer in [min, max]
  return randomBytes.toString();
}

// Get initials for fallback (e.g., "AS" or "A")
export function getInitialsFallbackName(user: LoggedInUser): string {
  // Step 2: Generate initials from fallback name
  if (!user) return "";
  const words = user.name.trim().split(" ");
  if (words.length === 1) {
    return words[0][0]?.toUpperCase() ?? ""; // e.g., "Azhar" → "A"
  }
  return (words[0][0] + (words[1][0] ?? "")).toUpperCase(); // e.g., "John Doe" → "JD"
}
