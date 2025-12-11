import { HTTP_MESSAGE, HTTP_STATUS } from "@/constants/http";
import serverResponse from "@/lib/api-response-helper";
import { revokeRefreshToken, verifyRefreshToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get cookies using Next.js cookies API
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // If neither token present, user is not authenticated
    if (!token && !refreshToken) {
      return serverResponse({
        success: false,
        message: "Not authenticated",
        error: "Not authenticated. Please log in first.",
        status: HTTP_STATUS.UNAUTHORIZED,
        data: undefined,
      });
    }

    // If refresh token present, try to verify and revoke
    if (refreshToken) {
      const verified = await verifyRefreshToken(refreshToken);
      if (verified) {
        await revokeRefreshToken(verified.jti);
      }
    }

    // Create response
    const response = serverResponse({
      success: true,
      message: "Logged out successfully",
      error: undefined,
      data: undefined,
      status: HTTP_STATUS.OK,
    });

    // Clear cookies
    response.cookies.delete({ name: "token", path: "/" });
    response.cookies.delete({ name: "refresh_token", path: "/" });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return serverResponse({
      success: false,
      message: HTTP_MESSAGE.INTERNAL_ERROR,
      error: `An unexpected error occurred. ${error}`,
      data: undefined,
      status: HTTP_STATUS.INTERNAL_ERROR,
    });
  }
}
