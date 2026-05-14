import { z } from "zod";

export const studentLoginSchema = z.object({
  registrationNumber: z.string().trim().min(1, "Registration number is required").optional(),
  email: z.string().trim().email("Valid email is required").optional(),
  password: z.string().min(1, "Password is required")
}).refine((data) => data.registrationNumber || data.email, {
  message: "Registration number or email is required",
  path: ["registrationNumber"]
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(1, "Password is required")
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});
