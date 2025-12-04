import { z } from "zod";
import { userEmailSchema } from "./register";

export const loginInSchema = z.object({
  email: userEmailSchema,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(255, "Password must not exceed 255 characters"),
});
