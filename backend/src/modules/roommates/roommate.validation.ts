import { z } from "zod";

export const createRoommateRequestSchema = z.object({
  registrationNumber: z.string().trim().min(3).max(50),
  phone: z.string().trim().min(8).max(20),
  roomId: z.string().uuid().optional()
});

export const verifyRoommateOtpSchema = z.object({
  requestId: z.string().uuid(),
  otp: z.string().trim().regex(/^\d{6}$/, "OTP must be a 6 digit code")
});

export const roommateRequestIdSchema = z.object({
  id: z.string().uuid()
});
