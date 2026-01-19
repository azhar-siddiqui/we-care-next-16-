/**
 * Next.js Middleware / Proxy Handler
 *
 * Consolidated middleware that handles:
 * 1. Authentication & authorization
 * 2. Security headers & logging
 * 3. Request validation & rate limiting
 */

import {
  generateAccessToken,
  generateRefreshToken,
  mapDbUserToLoggedInUser,
  revokeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import {
  applySecurityHeaders,
  getClientIP,
  logSecurityEvent,
  validateRequestSize,
} from "@/lib/security";
import { NextRequest, NextResponse } from "next/server";

// Try refresh token flow and rotate tokens. Returns new tokens when successful.
async function tryRefreshAndRotate(refreshToken: string) {
  try {
    const verified = await verifyRefreshToken(refreshToken);
    if (!verified) return { success: false };

    const userId = verified.userId;

    const [keyAdmin, admin, usr] = await Promise.all([
      prisma.keyAdmin.findUnique({ where: { id: userId } }),
      prisma.admin.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const found = keyAdmin ?? admin ?? usr;
    const loggedInUser = mapDbUserToLoggedInUser(found);
    if (!loggedInUser) {
      // If no user found, revoke the token for safety
      await revokeRefreshToken(verified.jti);
      return { success: false };
    }

    await revokeRefreshToken(verified.jti);
    const newRefresh = await generateRefreshToken(userId, { expiresIn: "30d" });
    const newAccess = await generateAccessToken(loggedInUser, "15m");

    return { success: true, newAccess, newRefresh };
  } catch (err) {
    console.error("Proxy refresh failed:", err);
    return { success: false };
  }
}

async function getAuthStatus(request: NextRequest) {
  const token = request.cookies.get("token")?.value ?? null;
  const refreshToken = request.cookies.get("refresh_token")?.value ?? null;

  let isValidToken = false;
  let newAccess: string | null = null;
  let newRefresh: string | null = null;

  if (token) {
    const payload = await verifyAccessToken(token);
    isValidToken = Boolean(payload);
  }

  if (!isValidToken && refreshToken) {
    const result = await tryRefreshAndRotate(refreshToken);
    if (result.success) {
      isValidToken = true;
      newAccess = result.newAccess ?? null;
      newRefresh = result.newRefresh ?? null;
    }
  }

  return { isValidToken, newAccess, newRefresh };
}

function setAuthCookies(
  resp: NextResponse,
  newAccess: string | null,
  newRefresh: string | null,
) {
  if (newAccess) {
    resp.cookies.set({
      name: "token",
      value: newAccess,
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60,
    });
  }
  if (newRefresh) {
    resp.cookies.set({
      name: "refresh_token",
      value: newRefresh,
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  }
}

function handleLogin(
  request: NextRequest,
  isValidToken: boolean,
  newAccess: string | null,
  newRefresh: string | null,
) {
  if (isValidToken) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard/default", request.nextUrl),
    );
    setAuthCookies(redirectResponse, newAccess, newRefresh);
    return redirectResponse;
  }
  return NextResponse.next();
}

function handleDashboard(
  request: NextRequest,
  isValidToken: boolean,
  newAccess: string | null,
  newRefresh: string | null,
) {
  if (!isValidToken) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  const resp = NextResponse.next();
  setAuthCookies(resp, newAccess, newRefresh);
  return resp;
}

// Apply security features to response
function applyProxySecurityHeaders(response: NextResponse, startTime: number) {
  applySecurityHeaders(response);
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  return response;
}

// Log security events and validate request
function logProxySecurityEvent(
  request: NextRequest,
): { error: true; response: NextResponse } | { error: false } {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  logSecurityEvent("PROXY_REQUEST", {
    method: request.method,
    url: request.url,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  });

  // Validate request size (1MB limit)
  const sizeValidation = validateRequestSize(request, 1024 * 1024);
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

    return {
      error: true,
      response: NextResponse.json(
        { success: false, error: sizeValidation.error },
        { status: 413 },
      ),
    };
  }

  return { error: false };
}

// Main proxy function - exported as both default and named export for Next.js middleware
async function proxyHandler(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;

  // Check security and request size
  const securityCheck = logProxySecurityEvent(request);
  if (securityCheck.error) {
    return applyProxySecurityHeaders(securityCheck.response, startTime);
  }

  const { isValidToken, newAccess, newRefresh } = await getAuthStatus(request);

  let response: NextResponse;

  if (path === "/login") {
    response = handleLogin(request, isValidToken, newAccess, newRefresh);
  } else if (path.startsWith("/dashboard")) {
    response = handleDashboard(request, isValidToken, newAccess, newRefresh);
  } else if (path === "/") {
    response = NextResponse.next();
  } else {
    response = NextResponse.next();
  }

  // Apply security headers and logging
  return applyProxySecurityHeaders(response, startTime);
}

// Export for Next.js middleware (required name)
export async function middleware(request: NextRequest) {
  return proxyHandler(request);
}

// Export for direct imports
export default proxyHandler;

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
