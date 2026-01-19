import { HTTP_MESSAGE, HTTP_STATUS } from "@/constants/http";
import serverResponse from "@/lib/api-response-helper";
import prisma from "@/lib/prisma";
import { rateLimiters } from "@/lib/rate-limit";
import { deleteOTP, redis, verifyOTP } from "@/lib/redis";
import {
  getClientIP,
  isValidEmailFormat,
  logSecurityEvent,
  validateRequestSize,
} from "@/lib/security";
import { formatZodError } from "@/lib/zod-error-msg";
import { verifyOtpSchema } from "@/validation/auth/verifyOtpSchema";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Security: Validate request size
    const sizeValidation = validateRequestSize(request, 1024 * 10); // 10KB max for OTP verification
    if (!sizeValidation.valid) {
      logSecurityEvent(
        "INVALID_REQUEST_SIZE",
        {
          ip: getClientIP(request),
          error: sizeValidation.error,
        },
        "warn",
      );

      return serverResponse({
        success: false,
        message: "Request too large",
        error: sizeValidation.error!,
        data: undefined,
        status: 413,
      });
    }

    const body = await request.json();
    const ip = getClientIP(request);

    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return serverResponse({
        success: false,
        message: "Validation Error",
        data: undefined,
        error: formatZodError(parsed.error),
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    const { email, otp } = parsed.data;

    // Security: Validate email format
    if (!isValidEmailFormat(email)) {
      logSecurityEvent(
        "INVALID_EMAIL_FORMAT",
        {
          ip,
          email: email.substring(0, 3) + "***", // Log partial email for security
        },
        "warn",
      );

      return serverResponse({
        success: false,
        message: "Invalid email format",
        error: "Please provide a valid email address",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Security: Validate OTP format (should be numeric and reasonable length)
    if (!/^\d{4,8}$/.test(otp)) {
      logSecurityEvent(
        "INVALID_OTP_FORMAT",
        {
          ip,
          email: email.substring(0, 3) + "***",
        },
        "warn",
      );

      return serverResponse({
        success: false,
        message: "Invalid OTP format",
        error: "OTP must be 4-8 digits",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Rate limiting: Check OTP verification attempts
    const rateLimitResult = await rateLimiters.verifyOtp(email, ip);

    if (!rateLimitResult.allowed) {
      logSecurityEvent(
        "RATE_LIMIT_EXCEEDED",
        {
          ip,
          email: email.substring(0, 3) + "***",
          rateLimiter: "verifyOtp",
        },
        "warn",
      );

      return serverResponse({
        success: false,
        message: HTTP_MESSAGE.TOO_MANY_ATTEMPTS,
        error: rateLimitResult.message || HTTP_MESSAGE.TOO_MANY_ATTEMPTS,
        data: undefined,
        status: HTTP_STATUS.TOO_MANY_ATTEMPTS,
      });
    }

    // Verify OTP
    const { isValid, message } = await verifyOTP(email, otp);

    if (!isValid) {
      logSecurityEvent(
        "OTP_VERIFICATION_FAILED",
        {
          ip,
          email: email.substring(0, 3) + "***",
          reason: message,
        },
        "warn",
      );

      return serverResponse({
        success: false,
        error: "OTP verification failed",
        message: message,
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Log successful verification
    logSecurityEvent("OTP_VERIFICATION_SUCCESS", {
      ip,
      email: email.substring(0, 3) + "***",
    });

    // Check if email or contact number already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin?.isVerified) {
      return serverResponse({
        success: false,
        message: "Email already verified",
        error: "Email already verified",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Retrieve pending admin data from Redis
    const pendingKey = `pending:admin:${email}`;
    const pendingData = await redis.get(pendingKey);

    if (!pendingData) {
      return serverResponse({
        success: false,
        message: "No pending admin data found",
        error: "No pending admin data found",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    let adminData;
    if (typeof pendingData === "string") {
      try {
        adminData = JSON.parse(pendingData);
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Data:", pendingData);
        return serverResponse({
          success: false,
          message: "Invalid pending data format",
          error: "Invalid pending data format",
          data: undefined,
          status: HTTP_STATUS.BAD_REQUEST,
        });
      }
    } else if (typeof pendingData === "object") {
      adminData = pendingData;
    } else {
      return serverResponse({
        success: false,
        message: "Invalid pending data type",
        error: "Invalid pending data type",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }

    // Validate adminData structure
    if (!adminData.labName || !adminData.email || !adminData.password) {
      return serverResponse({
        success: false,
        message: "Incomplete admin data",
        error: "Incomplete admin data",
        data: undefined,
        status: HTTP_STATUS.BAD_REQUEST,
      });
    }
    await prisma.keyAdmin.findFirst();

    // Create admin in PostgreSQL using Prisma
    await prisma.admin.create({
      data: {
        ...adminData,
        isVerified: true,
      },
    });

    // Log successful admin creation
    logSecurityEvent("ADMIN_CREATED_SUCCESSFULLY", {
      ip,
      email: email.substring(0, 3) + "***",
      labName: adminData.labName,
    });

    // Delete OTP and pending data from Redis
    await deleteOTP(email);
    await redis.del(pendingKey);

    return serverResponse({
      success: true,
      message: "Email verified successfully",
      error: undefined,
      data: undefined,
      status: 200,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return serverResponse({
      success: false,
      message: HTTP_MESSAGE.INTERNAL_ERROR,
      error: `An unexpected error occurred. ${error}`,
      data: undefined,
      status: HTTP_STATUS.INTERNAL_ERROR,
    });
  }
}
