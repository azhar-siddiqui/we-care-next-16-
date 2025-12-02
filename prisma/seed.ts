import { Role } from "@/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

// Create Postgres adapter for Neon
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Use Prisma 7 extension syntax
const prisma = new PrismaClient({ adapter }).$extends({});

async function main() {
  console.log("🌱 Starting Key Admin seed...");

  // 1. Ensure KeyAdmin does not already exist
  const existing = await prisma.keyAdmin.findFirst({
    where: { role: Role.KEY_ADMIN },
  });

  if (existing) {
    console.log("✔ KeyAdmin already exists, skipping seed.");
    return;
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(process.env.KEY_ADMIN_PASSWORD!, 12);

  // 3. Create KeyAdmin
  const keyAdmin = await prisma.keyAdmin.create({
    data: {
      name: process.env.KEY_ADMIN_NAME!,
      email: process.env.KEY_ADMIN_EMAIL!,
      password: hashedPassword,
      role: Role.KEY_ADMIN,
    },
  });

  console.log("✔ Key Admin created successfully:", keyAdmin);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
