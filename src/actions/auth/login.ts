import { ServerResponseType } from "@/types/api-response";
import { loginInSchema } from "@/validation/auth/login";
import z from "zod";

export async function loginInApiAction(
  data: z.infer<typeof loginInSchema>
): Promise<ServerResponseType<{ token: string }>> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return response.json();
}
