import { ServerResponseType } from "@/types/api-response";
import { doctorFormSchema } from "@/validation/doctor";
import z from "zod";

export async function addDoctorApiAction(
  data: z.infer<typeof doctorFormSchema>,
): Promise<ServerResponseType<unknown>> {
  const response = await fetch("/api/doctors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return response.json();
}
