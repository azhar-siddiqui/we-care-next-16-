import z from "zod";
import { userEmailSchema } from "./register";

// Zod schema for OTP verification
export const verifyOtpSchema = z.object({
  email: userEmailSchema,
  otp: z
    .string()
    .length(5, "OTP must be 5 digits")
    .regex(/^\d{5}$/, "OTP must be numeric"),
});
