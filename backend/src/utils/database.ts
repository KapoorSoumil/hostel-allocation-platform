import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { logger } from "./logger";

export async function runInTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
) {
  return prisma.$transaction(callback);
}

export async function assertDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
  logger.info("Database health check passed");
}

export function calculateAvailableBeds(room: {
  capacity: number;
  currentOccupancy: number;
}) {
  return Math.max(room.capacity - room.currentOccupancy, 0);
}

export function isRoomFull(room: {
  capacity: number;
  currentOccupancy: number;
}) {
  return calculateAvailableBeds(room) === 0;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeRegistrationNumber(registrationNumber: string) {
  return registrationNumber.trim().toUpperCase();
}
