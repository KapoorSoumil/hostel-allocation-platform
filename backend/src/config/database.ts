import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "../utils/logger";

export const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"]
});

export async function connectDatabase() {
  await prisma.$connect();
  logger.info("Database connection established");
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
