import { SECURITY_CONFIG } from "@/config/security";
import { HTTP_MESSAGE } from "@/constants/http";
import { redis } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
}

/**
 * Checks rate limiting for multiple keys. If any key exceeds maxAttempts, returns not allowed.
 * If all are within limits, increments all keys with the given TTL.
 * @param keys - Array of Redis keys to check
 * @param maxAttempts - Maximum allowed attempts (optional, uses config default)
 * @param ttl - Time to live in seconds (optional, uses config default)
 * @returns RateLimitResult indicating if the action is allowed
 */
export async function checkRateLimit(
  keys: string[],
  maxAttempts?: number,
  ttl?: number,
): Promise<RateLimitResult> {
  // Check if any key has exceeded the limit
  for (const key of keys) {
    const attempts = await redis.get(key);
    if (attempts && Number.parseInt(attempts as string) >= (maxAttempts || 5)) {
      return {
        allowed: false,
        message: HTTP_MESSAGE.TOO_MANY_ATTEMPTS,
      };
    }
  }

  // If all keys are within limits, increment them
  for (const key of keys) {
    await redis.incr(key);
    await redis.expire(key, ttl || 3600); // Default 1 hour
  }

  return { allowed: true };
}

/**
 * Pre-configured rate limit functions for common use cases
 */
export const rateLimiters = {
  signup: (email: string, ip: string) =>
    checkRateLimit(
      [`signup:attempt:email:${email}`, `signup:attempt:ip:${ip}`],
      SECURITY_CONFIG.RATE_LIMITS.SIGNUP.MAX_ATTEMPTS,
      SECURITY_CONFIG.RATE_LIMITS.SIGNUP.WINDOW_SECONDS,
    ),

  login: (email: string, ip: string) =>
    checkRateLimit(
      [`login:attempt:email:${email}`, `login:attempt:ip:${ip}`],
      SECURITY_CONFIG.RATE_LIMITS.LOGIN.MAX_ATTEMPTS,
      SECURITY_CONFIG.RATE_LIMITS.LOGIN.WINDOW_SECONDS,
    ),

  verifyOtp: (email: string, ip: string) =>
    checkRateLimit(
      [`verify:attempt:email:${email}`, `verify:attempt:ip:${ip}`],
      SECURITY_CONFIG.RATE_LIMITS.VERIFY_OTP.MAX_ATTEMPTS,
      SECURITY_CONFIG.RATE_LIMITS.VERIFY_OTP.WINDOW_SECONDS,
    ),
};
