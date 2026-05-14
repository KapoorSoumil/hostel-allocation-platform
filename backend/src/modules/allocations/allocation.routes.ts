import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const allocationRoutes = Router();

allocationRoutes.post("/", requireAuth, requireRole("STUDENT"), (_req, res) => {
  res.status(501).json({ success: false, message: "Room allocation logic will be implemented later" });
});

allocationRoutes.get("/me", requireAuth, requireRole("STUDENT"), (_req, res) => {
  res.status(501).json({ success: false, message: "Student allocation details will be implemented later" });
});
