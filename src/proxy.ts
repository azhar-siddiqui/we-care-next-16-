import { NextRequest, NextResponse } from "next/server";
import {
  generateAccessToken,
  generateRefreshToken,
  mapDbUserToLoggedInUser,
  revokeRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./lib/auth"; // adjust path
import { env } from "./lib/env";
import prisma from "./lib/prisma";

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
  newRefresh: string | null
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
  newRefresh: string | null
) {
  if (isValidToken) {
    const redirectResponse = NextResponse.redirect(
      new URL("/dashboard/default", request.nextUrl)
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
  newRefresh: string | null
) {
  if (!isValidToken) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  const resp = NextResponse.next();
  setAuthCookies(resp, newAccess, newRefresh);
  return resp;
}

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const { isValidToken, newAccess, newRefresh } = await getAuthStatus(request);

  if (path === "/login") {
    return handleLogin(request, isValidToken, newAccess, newRefresh);
  }

  if (path.startsWith("/dashboard")) {
    return handleDashboard(request, isValidToken, newAccess, newRefresh);
  }

  if (path === "/") {
    return NextResponse.next();
  }

  return NextResponse.next();
}
