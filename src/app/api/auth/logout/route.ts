import { HTTP_MESSAGE, HTTP_STATUS } from "@/constants/http";
import serverResponse from "@/lib/api-response-helper";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get cookies using Next.js cookies API
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Check if no token is present
    if (!token) {
      return serverResponse({
        success: false,
        message: "Not authenticated",
        error: "Not authenticated. Please log in first.",
        status: HTTP_STATUS.UNAUTHORIZED,
        data: undefined,
      });
    }

    // Verify token (try admin token first, then user token)
    const isValidToken = await verifyToken(token);

    // If no valid token was found
    if (!isValidToken) {
      return serverResponse({
        success: false,
        message: "Invalid token",
        error: "The provided token is invalid or has expired.",
        status: HTTP_STATUS.UNAUTHORIZED,
        data: undefined,
      });
    }

    // Create response
    const response = serverResponse({
      success: true,
      message: "Logged out successfully",
      error: undefined,
      data: undefined,
      status: HTTP_STATUS.OK,
    });

    // Clear both ADMIN_token and USER_token cookies
    response.cookies.delete({
      name: "token",
      path: "/",
    });

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
