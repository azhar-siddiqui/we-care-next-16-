import { NextRequest, NextResponse } from "next/server";

/**
 * Security utilities for production-grade API protection
 */

export interface SecurityConfig {
  maxBodySize?: number; // in bytes, default 1MB
  timeout?: number; // in milliseconds, default 30s
  enableLogging?: boolean;
  enableSecurityHeaders?: boolean;
}

/**
 * Default security configuration
 */
const DEFAULT_SECURITY_CONFIG: Required<SecurityConfig> = {
  maxBodySize: 1024 * 1024, // 1MB
  timeout: 30000, // 30 seconds
  enableLogging: true,
  enableSecurityHeaders: true,
};

/**
 * Security headers for production
 */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
};

/**
 * Validates request body size
 */
export function validateRequestSize(
  request: NextRequest,
  maxSize: number = DEFAULT_SECURITY_CONFIG.maxBodySize,
): { valid: boolean; error?: string } {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (size > maxSize) {
      return {
        valid: false,
        error: `Request body too large. Maximum size: ${maxSize} bytes`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitizes input strings to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;")
    .replaceAll("/", "&#x2F;");
}

/**
 * Logs security events
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  level: "info" | "warn" | "error" = "info",
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    level,
    ...details,
  };

  console[level]("[SECURITY]", JSON.stringify(logEntry, null, 2));
}

/**
 * Creates a timeout promise
 */
export function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Applies security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Comprehensive security middleware wrapper
 */
export async function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {},
): Promise<(request: NextRequest) => Promise<NextResponse>> {
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Validate request size
      const sizeValidation = validateRequestSize(
        request,
        finalConfig.maxBodySize,
      );
      if (!sizeValidation.valid) {
        if (finalConfig.enableLogging) {
          logSecurityEvent(
            "REQUEST_SIZE_EXCEEDED",
            {
              ip: getClientIP(request),
              userAgent: request.headers.get("user-agent"),
              contentLength: request.headers.get("content-length"),
              maxSize: finalConfig.maxBodySize,
            },
            "warn",
          );
        }

        const response = NextResponse.json(
          { error: sizeValidation.error, success: false },
          { status: 413 },
        );
        return finalConfig.enableSecurityHeaders
          ? applySecurityHeaders(response)
          : response;
      }

      // Log request
      if (finalConfig.enableLogging) {
        logSecurityEvent("REQUEST_STARTED", {
          method: request.method,
          url: request.url,
          ip: getClientIP(request),
          userAgent: request.headers.get("user-agent"),
        });
      }

      // Execute handler with timeout
      const result = await Promise.race([
        handler(request),
        createTimeoutPromise(finalConfig.timeout),
      ]);

      // Apply security headers
      const secureResponse = finalConfig.enableSecurityHeaders
        ? applySecurityHeaders(result)
        : result;

      // Log successful completion
      if (finalConfig.enableLogging) {
        logSecurityEvent("REQUEST_COMPLETED", {
          method: request.method,
          url: request.url,
          duration: Date.now() - startTime,
          status: secureResponse.status,
        });
      }

      return secureResponse;
    } catch (error) {
      // Log error
      if (finalConfig.enableLogging) {
        logSecurityEvent(
          "REQUEST_ERROR",
          {
            method: request.method,
            url: request.url,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
          "error",
        );
      }

      // Return secure error response
      const errorResponse = NextResponse.json(
        { error: "Internal server error", success: false },
        { status: 500 },
      );

      return finalConfig.enableSecurityHeaders
        ? applySecurityHeaders(errorResponse)
        : errorResponse;
    }
  };
}

/**
 * Gets client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-client-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Validates email format (additional security check)
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Rate limiting helper with security logging
 */
export async function secureRateLimit(
  keys: string[],
  maxAttempts: number,
  ttl: number,
  request: NextRequest,
): Promise<{ allowed: boolean; message?: string }> {
  // Import here to avoid circular dependency
  const { checkRateLimit } = await import("@/lib/rate-limit");

  const result = await checkRateLimit(keys, maxAttempts, ttl);

  if (!result.allowed) {
    logSecurityEvent(
      "RATE_LIMIT_EXCEEDED",
      {
        keys,
        maxAttempts,
        ttl,
        ip: getClientIP(request),
        userAgent: request.headers.get("user-agent"),
      },
      "warn",
    );
  }

  return result;
}
