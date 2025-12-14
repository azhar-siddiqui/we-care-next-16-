import { HTTP_MESSAGE, HTTP_STATUS } from "@/constants/http";
import serverResponse from "@/lib/api-response-helper";
import { hashPassword } from "@/lib/auth";
import { env } from "@/lib/env";
import prisma from "@/lib/prisma";
import { redis, storeOTP } from "@/lib/redis";
import { sendVerificationEmail } from "@/lib/send-verification-email";
import { generateOtp } from "@/lib/utils";
import { formatZodError } from "@/lib/zod-error-msg";
import { onboardAdminSchema } from "@/validation/auth/register";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = onboardAdminSchema.safeParse(body);

    if (!parsed.success) {
      return serverResponse({
        success: false,
        message: "Validation Error",
        error: formatZodError(parsed.error),
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const {
      labName,
      ownerName,
      email,
      password,
      contactNumber,
      previousSoftware,
    } = parsed.data;

    // Rate limiting: Check signup attempts
    const rateLimitKey = `signup:attempt:${email}`;
    const attempts = await redis.get(rateLimitKey);
    const maxAttempts = 5;

    if (attempts && Number.parseInt(attempts as string) >= maxAttempts) {
      return serverResponse({
        success: false,
        message: HTTP_MESSAGE.TOO_MANY_ATTEMPTS,
        error: HTTP_MESSAGE.TOO_MANY_ATTEMPTS,
        data: undefined,
        status: HTTP_STATUS.TOO_MANY_ATTEMPTS,
      });
    }

    // Increment signup attempts
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, Number(env.REDIS_TEMP_ADMIN_TTL)); // 1 hour expiry

    // Check if email or contact number already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ email }, { contactNumber }],
      },
    });

    if (existingAdmin) {
      return serverResponse({
        success: false,
        message: "Admin with this email or contact number already exists.",
        error: "Admin with this email or contact number already exists.",
        data: undefined,
        status: HTTP_STATUS.CONFLICT,
      });
    }

    // Generate OTP
    const otp = generateOtp();
    // Store OTP in Redis
    await storeOTP(email, otp);

    // Send OTP email using Resend + React Email
    const emailResult = await sendVerificationEmail(ownerName, email, otp);

    if (!emailResult.success) {
      return serverResponse({
        success: false,
        error: emailResult.message,
        data: undefined,
        message: emailResult.message,
        status: HTTP_STATUS.INTERNAL_ERROR,
      });
    }

    // Temporarily store admin data in Redis (until verified)
    await redis.set(
      `pending:admin:${email}`,
      JSON.stringify({
        labName,
        ownerName,
        email,
        password: await hashPassword(password),
        contactNumber,
        previousSoftware,
      }),
      { ex: Number.parseInt(env.REDIS_TEMP_ADMIN_TTL || "600") }
    );

    return serverResponse({
      success: true,
      error: undefined,
      message: "OTP sent to email",
      data: undefined,
      status: HTTP_STATUS.OK,
    });
  } catch (error) {
    console.error("on-board error:", error);
    return serverResponse({
      success: false,
      message: HTTP_MESSAGE.INTERNAL_ERROR,
      error: `An unexpected error occurred. ${error}`,
      data: undefined,
      status: HTTP_STATUS.INTERNAL_ERROR,
    });
  }
}
