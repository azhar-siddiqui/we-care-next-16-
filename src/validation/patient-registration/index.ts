import { Age, Designation, Gender } from "@/generated/prisma/enums";
import { ALLOWED_EMAIL_DOMAINS } from "@/types/domain";
import z from "zod";

export const patientFormSchema = z.object({
  date: z.date(),
  reference: z.uuid(),
  designation: z.enum(Designation),
  patientName: z.string().min(2, { message: "Patient name required" }),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{7,14}$/.test(val), {
      message: "Invalid phone number format. Example: +918808808808",
    }),
  gender: z.enum(Gender),
  age: z
    .string({
      message: "Age required",
    })
    .min(1, { message: "Age cannot be negative" }),
  ageType: z.enum(Age),
  email: z
    .string()
    .optional() // Make email optional
    .refine(
      (email) => {
        // Skip validation if email is undefined or empty
        if (!email || email === "") return true;
        // Validate email format
        const emailSchema = z.email("Invalid email format");
        const result = emailSchema.safeParse(email);
        if (!result.success) return false;
        // Validate max length
        if (email.length > 191) return false;
        // Validate domain
        const domain = email.split("@")[1]?.toLowerCase();
        return domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
      },
      {
        message: `Email must be valid and have a domain from: ${ALLOWED_EMAIL_DOMAINS.join(", ")}`,
      },
    ),
  address: z.string().optional(),
});

export const tempPatientRecord = [
  {
    id: "d1a0f7e2-6b21-4d92-8b01-11f4c9a00101",
    name: "Aarav Patel",
    email: "aarav.patel@clinic.com",
    contactNumber: "+91-9876543210",
    specialization: "Cardiology",
  },
  {
    id: "b2e8a123-3f98-4d61-a987-3a1b9fbc0202",
    name: "Neha Sharma",
    email: "neha.sharma@healthcare.com",
    contactNumber: "+91-9123456789",
    specialization: "Dermatology",
  },
  {
    id: "c3f91234-7d56-4a88-9c12-8fbcaa030303",
    name: "Rohit Mehra",
    email: undefined,
    contactNumber: "+91-9988776655",
    specialization: "Orthopedics",
  },
  {
    id: "e41c9d55-55c2-4e8f-8a67-2bcd44040404",
    name: "Priya Iyer",
    email: "priya.iyer@hospital.org",
    contactNumber: null,
    specialization: "Pediatrics",
  },
  {
    id: "f5d8a921-9b33-4b12-b321-acde05050505",
    name: "Sameer Khan",
    email: "sameer.khan@neurocare.com",
    contactNumber: "+91-8899001122",
    specialization: "Neurology",
  },
  {
    id: "a6b3e777-88a1-4c99-9e22-ccd606060606",
    name: "Kavita Desai",
    email: null,
    contactNumber: null,
    specialization: "Gynecology",
  },
  {
    id: "bb77a011-5c66-4d10-9aa1-7ee707070707",
    name: "Manish Gupta",
    email: "manish.gupta@cityclinic.in",
    contactNumber: "+91-9012345678",
    specialization: "General Medicine",
  },
  {
    id: "cc8d9021-91f3-4bb7-b88b-aadd08080808",
    name: "Sneha Kulkarni",
    email: "sneha.k@healthplus.com",
    contactNumber: "+91-9345678123",
    specialization: "ENT",
  },
  {
    id: "dd9f4b12-0a22-41d9-9f02-acde09090909",
    name: "Ankit Joshi",
    email: "ankit.joshi@orthocare.com",
    contactNumber: null,
    specialization: "Sports Medicine",
  },
  {
    id: "ee0a1f99-2345-4cfa-9c88-acde10101010",
    name: "Farhan Ali",
    email: null,
    contactNumber: "+91-9765432109",
    specialization: "Pulmonology",
  },
];
