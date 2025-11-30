import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
  {
    email: "alice@prisma.io",
    name: "Alice",
    contact_number: "7558380826",
  },
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();