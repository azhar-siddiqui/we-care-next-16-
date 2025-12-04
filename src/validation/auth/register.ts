import { z } from "zod";

export const ALLOWED_EMAIL_DOMAINS = [
  "wecare.com",
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "icloud.com",
  "zoho.com",
  "proton.me",
  "yandex.ru",
];

export const userEmailSchema = z
  .email("Invalid email format")
  .max(191, "Email must not exceed 191 characters")
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
    },
    {
      message: `Email domain must be one of: ${ALLOWED_EMAIL_DOMAINS.join(
        ", "
      )}`,
    }
  );
