import { Gender } from "@prisma/client";
import { z } from "zod";

const genderSchema = z.nativeEnum(Gender).nullable().optional();

export const studentImportSchema = z.object({
  csv: z.string().optional(),
  students: z.array(z.object({
    registrationNumber: z.string().trim().min(1),
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().min(1),
    department: z.string().trim().optional().nullable(),
    year: z.coerce.number().int().positive().optional().nullable(),
    gender: z.nativeEnum(Gender).optional().nullable(),
    cgpa: z.coerce.number().min(0).max(10)
  })).optional()
}).refine((data) => data.csv || data.students?.length, {
  message: "Provide CSV text or students array"
});

export const hostelUpsertSchema = z.object({
  name: z.string().trim().min(1),
  gender: genderSchema,
  description: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional()
});

export const roomUpsertSchema = z.object({
  hostelBlockId: z.string().uuid(),
  categoryId: z.string().uuid(),
  roomNumber: z.string().trim().min(1),
  floor: z.coerce.number().int().optional().nullable(),
  capacity: z.coerce.number().int().positive(),
  isAvailable: z.boolean().optional()
});

export const counselingSlotUpsertSchema = z.object({
  name: z.string().trim().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  minRank: z.coerce.number().int().positive(),
  maxRank: z.coerce.number().int().positive(),
  isActive: z.boolean().optional()
}).refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"]
}).refine((data) => data.maxRank >= data.minRank, {
  message: "Max rank must be greater than or equal to min rank",
  path: ["maxRank"]
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});
