import WeCareVerifyEmail from "@/components/email/VerificationEmail";
import { HTTP_STATUS } from "@/constants/http";
import { resend } from "@/lib/resend";
import { ServerResponseType } from "@/types/api-response";
import { env } from "./env";

export async function sendVerificationEmail(
  name: string,
  email: string,
  verifyCode: string
): Promise<ServerResponseType<null>> {
  try {
    await resend.emails.send({
      from: env.RESEND_DOMAIN,
      to: email,
      subject: "Your We Care OTP for Email Verification",
      react: WeCareVerifyEmail({ name, verificationCode: verifyCode }),
    });

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
