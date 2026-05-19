import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import {
  cancelRoommateRequest,
  createRoommateRequest,
  listMyRoommateRequests,
  verifyRoommateOtp
} from "./roommate.service";
import {
  createRoommateRequestSchema,
  roommateRequestIdSchema,
  verifyRoommateOtpSchema
} from "./roommate.validation";

export const roommateRoutes = Router();

roommateRoutes.get("/me", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const requests = await listMyRoommateRequests(req.user!.id);

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    next(error);
  }
});

roommateRoutes.post("/request", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const input = createRoommateRequestSchema.parse(req.body);
    const result = await createRoommateRequest({
      userId: req.user!.id,
      registrationNumber: input.registrationNumber,
      phone: input.phone,
      roomId: input.roomId
    });

    res.status(201).json({
      success: true,
      message: "Roommate OTP generated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
});

roommateRoutes.post("/verify-otp", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const input = verifyRoommateOtpSchema.parse(req.body);
    const request = await verifyRoommateOtp({
      userId: req.user!.id,
      requestId: input.requestId,
      otp: input.otp
    });

    res.json({
      success: true,
      message: "Roommate verified successfully",
      data: { request }
    });
  } catch (error) {
    next(error);
  }
});

roommateRoutes.post("/:id/cancel", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const params = roommateRequestIdSchema.parse(req.params);
    const request = await cancelRoommateRequest({
      userId: req.user!.id,
      requestId: params.id
    });

    res.json({
      success: true,
      message: "Roommate request cancelled",
      data: { request }
    });
  } catch (error) {
    next(error);
  }
});
