import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const roommateRoutes = Router();

roommateRoutes.post("/request", requireAuth, requireRole("STUDENT"), (_req, res) => {
  res.status(501).json({ success: false, message: "Roommate request flow will be implemented later" });
});

roommateRoutes.post("/verify-otp", requireAuth, requireRole("STUDENT"), (_req, res) => {
  res.status(501).json({ success: false, message: "OTP verification will be implemented in a later phase" });
});
