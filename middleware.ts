import {
  applySecurityHeaders,
  getClientIP,
  logSecurityEvent,
  validateRequestSize,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Log all API requests
  logSecurityEvent("API_REQUEST", {
    method: request.method,
    url: request.url,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  // Validate request size for API routes
  const sizeValidation = validateRequestSize(request, 1024 * 1024); // 1MB
  if (!sizeValidation.valid) {
    logSecurityEvent(
      "REQUEST_SIZE_EXCEEDED",
      {
        ip,
        userAgent,
        url: request.url,
        error: sizeValidation.error,
      },
      "warn",
    );

    const response = NextResponse.json(
      { success: false, error: sizeValidation.error },
      { status: 413 },
    );
    return applySecurityHeaders(response);
  }

  // Create response wrapper to add security headers and logging
  const response = NextResponse.next();

  // Add security headers
  applySecurityHeaders(response);

  // Add custom headers
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
