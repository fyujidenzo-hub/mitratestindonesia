import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
