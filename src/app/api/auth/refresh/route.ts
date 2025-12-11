import { HTTP_MESSAGE, HTTP_STATUS } from "@/constants/http";
import serverResponse from "@/lib/api-response-helper";
import {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { env } from "@/lib/env";
import { LoggedInUser, Role } from "@/types";
import { NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";

// Helper: map polymorphic DB user record to LoggedInUser
function mapDbUserToLoggedInUser(found: unknown): LoggedInUser | null {
  if (!found || typeof found !== "object") return null;
  const f = found as Record<string, unknown>;
  const id = typeof f.id === "string" ? f.id : null;
  if (!id) return null;

  let name = "";
  if (typeof f.name === "string") name = f.name;
  else if (typeof f.ownerName === "string") name = f.ownerName;

  let email = "";
  if (typeof f.email === "string") email = f.email;
  else if (typeof f.username === "string") email = f.username;

  const avatar = typeof f.avatar === "string" ? f.avatar : undefined;
  const roleVal = f.role;
  const role: Role =
    typeof roleVal === "string" &&
    (Object.values(Role) as string[]).includes(roleVal)
      ? (roleVal as Role)
      : Role.USER;

  return { id, name, email, avatar, role };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const refreshToken = body.refreshToken || null;
    if (!refreshToken) {
      return serverResponse({
        success: false,
        message: "Missing refresh token",
        error: "Missing refresh token",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const verified = await verifyRefreshToken(refreshToken);
    if (!verified) {
      return serverResponse({
        success: false,
        message: "Invalid refresh token",
        error: "Invalid or expired refresh token",
        data: undefined,
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Revoke old refresh token (rotation)
    await revokeRefreshToken(verified.jti);

    // Fetch the actual user record to build LoggedInUser
    const userId = verified.userId;
    const [keyAdmin, admin, usr] = await Promise.all([
      prisma.keyAdmin.findUnique({ where: { id: userId } }),
      prisma.admin.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const found = keyAdmin ?? admin ?? usr;
    const loggedInUser = mapDbUserToLoggedInUser(found);
    if (!loggedInUser) {
      return serverResponse({
        success: false,
        message: "User not found",
        error: "User associated with token no longer exists",
        data: undefined,
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Issue new tokens with full user info
    const newAccessToken = await generateAccessToken(loggedInUser, "15m");
    const newRefreshToken = await generateRefreshToken(userId, {
      expiresIn: "30d",
    });

    const response = serverResponse({
      success: true,
      message: "Token refreshed",
      error: undefined,
      data: { loggedInUser }, // Return user data for client-side hydration
      status: HTTP_STATUS.OK,
    });

    response.cookies.set({
      name: "token",
      value: newAccessToken,
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set({
      name: "refresh_token",
      value: newRefreshToken,
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Refresh error:", error);
    return serverResponse({
      success: false,
      message: HTTP_MESSAGE.INTERNAL_ERROR,
      error: `An unexpected error occurred. ${error}`,
      data: undefined,
      status: HTTP_STATUS.INTERNAL_ERROR,
    });
  }
}
