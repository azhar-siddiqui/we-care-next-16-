import { HTTP_MESSAGE, HTTP_STATUS } from "@/constants/http";
import serverResponse from "@/lib/api-response-helper";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";
import { env } from "@/lib/env";
import { formatZodError } from "@/lib/zod-error-msg";
import { LoggedInUser } from "@/types";
import { loginInSchema } from "@/validation/auth/login";
import { NextRequest } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginInSchema.safeParse(body);

    if (!parsed.success) {
      return serverResponse({
        success: false,
        message: "Validation Error",
        error: formatZodError(parsed.error),
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }
    const { email, password } = parsed.data;

    let loggedInUser: LoggedInUser | null = null;

    // Check if KEY_ADMIN
    const keyAdmin = await prisma.keyAdmin.findUnique({
      where: { email },
    });

    // Check if ADMIN
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    // Check if USER
    const user = await prisma.user.findUnique({
      where: { username: email },
    });

    if (keyAdmin) {
      // Validate KEY_ADMIN password
      const isPasswordValid = await comparePassword(
        password,
        keyAdmin.password
      );

      if (!isPasswordValid) {
        return serverResponse({
          success: false,
          message: "Invalid credentials",
          error: "Email or password is incorrect.",
          data: undefined,
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      loggedInUser = {
        id: keyAdmin.id,
        name: keyAdmin.name,
        email: keyAdmin.email,
        role: keyAdmin.role as LoggedInUser["role"],
      };
    } else if (admin) {
      // Validate ADMIN password
      const isPasswordValid = await comparePassword(password, admin.password);

      if (!isPasswordValid) {
        return serverResponse({
          success: false,
          message: "Invalid credentials",
          error: "Email or password is incorrect.",
          data: undefined,
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      loggedInUser = {
        id: admin.id,
        name: admin.ownerName,
        email: admin.email,
        role: admin.role as LoggedInUser["role"],
      };
    } else if (user) {
      // Validate USER password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return serverResponse({
          success: false,
          message: "Invalid credentials",
          error: "Email or password is incorrect.",
          data: undefined,
          status: HTTP_STATUS.UNAUTHORIZED,
        });
      }

      loggedInUser = {
        id: user.id,
        name: user.name,
        email: user.username,
        role: user.role as LoggedInUser["role"],
      };
    } else {
      return serverResponse({
        success: false,
        message: "Invalid credentials",
        error: "Email or password is incorrect.",
        data: undefined,
        status: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    // Issue tokens: short-lived access token + long-lived refresh token stored in DB
    const accessToken = await generateAccessToken(loggedInUser, "15m");

    // Attempt to capture client ip / user-agent for refresh token metadata (best-effort)
    // NextRequest does not expose `ip`; prefer X-Forwarded-For (may contain a comma-separated list)
    const xForwardedFor = req.headers.get("x-forwarded-for");
    const ip =
      (xForwardedFor ? xForwardedFor.split(",")[0].trim() : undefined) ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || undefined;
    const refreshToken = await generateRefreshToken(loggedInUser.id, {
      expiresIn: "30d",
      ip,
      userAgent,
    });

    const response = serverResponse({
      success: true,
      message: "Login successful",
      error: undefined,
      data: undefined,
      status: HTTP_STATUS.OK,
    });

    response.cookies.set({
      name: "token",
      value: accessToken,
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set({
      name: "refresh_token",
      value: refreshToken,
      httpOnly: true,
      secure: env.APP_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return serverResponse({
      success: false,
      message: HTTP_MESSAGE.INTERNAL_ERROR,
      error: `An unexpected error occurred. ${error}`,
      data: undefined,
      status: HTTP_STATUS.INTERNAL_ERROR,
    });
  }
}
