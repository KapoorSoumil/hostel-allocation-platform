import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const counselingSlotRoutes = Router();

counselingSlotRoutes.get("/", requireAuth, (_req, res) => {
  res.status(501).json({ success: false, message: "Counseling slot listing will be implemented later" });
});

counselingSlotRoutes.post("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), (_req, res) => {
  res.status(501).json({ success: false, message: "Counseling slot creation will be implemented later" });
});
