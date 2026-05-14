import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  adminLoginController,
  meController,
  refreshTokenController,
  studentLoginController
} from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/student/login", studentLoginController);
authRoutes.post("/admin/login", adminLoginController);
authRoutes.post("/refresh-token", refreshTokenController);

authRoutes.get("/me", requireAuth, meController);

authRoutes.get("/student-only", requireAuth, requireRole("STUDENT"), (_req, res) => {
  res.json({
    success: true,
    message: "Protected student route reached"
  });
});

authRoutes.get("/admin-only", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), (_req, res) => {
  res.json({
    success: true,
    message: "Protected admin route reached"
  });
});
