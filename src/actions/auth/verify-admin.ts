import { ServerResponseType } from "@/types/api-response";

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export async function verifyOtp(
  data: VerifyOtpData
): Promise<ServerResponseType<{ token: string }>> {
  const response = await fetch("/api/on-board/admin/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
