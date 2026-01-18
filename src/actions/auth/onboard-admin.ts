import { ServerResponseType } from "@/types/api-response";
import { onboardAdminSchema } from "@/validation/auth/register";
import z from "zod";

export async function onboardAdminApiAction(
  data: z.infer<typeof onboardAdminSchema>
): Promise<ServerResponseType<{ token: string }>> {
  const response = await fetch("/api/on-board/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return response.json();
}
