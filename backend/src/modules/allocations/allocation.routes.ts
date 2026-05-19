import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { HttpError } from "../../utils/http-error";
import {
  allocateRoomForStudent,
  getAllocationStatus,
  getCurrentAllocation,
  getRoomOccupants
} from "./allocation.service";
import { allocateRoomSchema } from "./allocation.validation";

export const allocationRoutes = Router();

allocationRoutes.post("/", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const input = allocateRoomSchema.parse(req.body);
    const allocation = await allocateRoomForStudent({
      userId: req.user!.id,
      roomId: input.roomId
    });

    res.status(201).json({
      success: true,
      message: "Room allocated successfully",
      data: { allocation }
    });
  } catch (error) {
    next(error);
  }
});

allocationRoutes.get("/me", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const allocation = await getCurrentAllocation(req.user!.id);

    res.json({
      success: true,
      data: { allocation }
    });
  } catch (error) {
    next(error);
  }
});

allocationRoutes.get("/status", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const status = await getAllocationStatus(req.user!.id);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

allocationRoutes.get("/rooms/:roomId/occupants", requireAuth, async (req, res, next) => {
  try {
    const roomId = req.params.roomId;

    if (typeof roomId !== "string") {
      throw new HttpError(400, "Invalid room id");
    }

    const occupants = await getRoomOccupants(roomId);

    res.json({
      success: true,
      data: occupants
    });
  } catch (error) {
    next(error);
  }
});
