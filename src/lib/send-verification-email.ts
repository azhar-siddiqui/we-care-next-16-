import WeCareVerifyEmail from "@/components/email/VerificationEmail";
import { HTTP_STATUS } from "@/constants/http";
import { resend } from "@/lib/resend";
import { ServerResponseType } from "@/types/api-response";
import { env } from "./env";

export async function sendVerificationEmail(
  name: string,
  email: string | string[],
  verifyCode: string
): Promise<ServerResponseType<null>> {
  console.log("Domain used for sending email:", env.RESEND_DOMAIN);
  try {
    const result = await resend.emails.send({
      from: `We Care <no-reply@${env.RESEND_DOMAIN}>`,
      to: email,
      subject: "Your We Care OTP for Email Verification",
      react: WeCareVerifyEmail({ name, verificationCode: verifyCode }),
    });

    if (result.error) {
      console.log("Resend error:", result.error);
      return {
        success: false,
        message: "Failed to send verification email",
        error: result.error.message || "Unknown error",
        data: undefined,
        status: HTTP_STATUS.INTERNAL_ERROR,
      };
    }

    return {
      success: true,
      message: "Verification email sent successfully",
      error: undefined,
      data: null,
      status: HTTP_STATUS.OK,
    };
  } catch (error) {
    console.log("Error while sending email:", error);
    return {
      success: false,
      message: "Failed to send verification email",
      error: error instanceof Error ? error.message : "Unknown error",
      data: undefined,
      status: HTTP_STATUS.INTERNAL_ERROR,
    };
  }
}
