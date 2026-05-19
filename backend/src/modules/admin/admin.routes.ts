import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  counselingSlotUpsertSchema,
  hostelUpsertSchema,
  idParamSchema,
  roomUpsertSchema,
  studentImportSchema
} from "./admin.validation";
import {
  createCounselingSlot,
  createHostel,
  createRoom,
  getAdminDashboard,
  getAllocationReport,
  importStudents,
  updateCounselingSlot,
  updateHostel,
  updateRoom
} from "./admin.service";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole("ADMIN", "SUPER_ADMIN"));

adminRoutes.get("/dashboard", async (_req, res, next) => {
  try {
    const dashboard = await getAdminDashboard();
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

adminRoutes.get("/allocations", async (_req, res, next) => {
  try {
    const allocations = await getAllocationReport();
    res.json({ success: true, data: { allocations } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/students/import", async (req, res, next) => {
  try {
    const input = studentImportSchema.parse(req.body);
    const result = await importStudents(input);
    res.status(201).json({ success: true, message: "Students imported successfully", data: result });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/hostels", async (req, res, next) => {
  try {
    const input = hostelUpsertSchema.parse(req.body);
    const hostel = await createHostel(input);
    res.status(201).json({ success: true, data: { hostel } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/hostels/:id", async (req, res, next) => {
  try {
    const params = idParamSchema.parse(req.params);
    const input = hostelUpsertSchema.parse(req.body);
    const hostel = await updateHostel(params.id, input);
    res.json({ success: true, data: { hostel } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/rooms", async (req, res, next) => {
  try {
    const input = roomUpsertSchema.parse(req.body);
    const room = await createRoom(input);
    res.status(201).json({ success: true, data: { room } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/rooms/:id", async (req, res, next) => {
  try {
    const params = idParamSchema.parse(req.params);
    const input = roomUpsertSchema.parse(req.body);
    const room = await updateRoom(params.id, input);
    res.json({ success: true, data: { room } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.post("/counseling-slots", async (req, res, next) => {
  try {
    const input = counselingSlotUpsertSchema.parse(req.body);
    const slot = await createCounselingSlot(input);
    res.status(201).json({ success: true, data: { slot } });
  } catch (error) {
    next(error);
  }
});

adminRoutes.put("/counseling-slots/:id", async (req, res, next) => {
  try {
    const params = idParamSchema.parse(req.params);
    const input = counselingSlotUpsertSchema.parse(req.body);
    const slot = await updateCounselingSlot(params.id, input);
    res.json({ success: true, data: { slot } });
  } catch (error) {
    next(error);
  }
});
