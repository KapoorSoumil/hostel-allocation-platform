import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

adminRoutes.get("/dashboard", (_req, res) => {
  res.status(501).json({ success: false, message: "Admin dashboard data will be implemented later" });
});

adminRoutes.get("/allocations", (_req, res) => {
  res.status(501).json({ success: false, message: "Admin allocation reporting will be implemented later" });
});
