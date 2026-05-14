import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { prisma } from "../../config/database";
import { HttpError } from "../../utils/http-error";

export const studentRoutes = Router();

studentRoutes.get("/me", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        phone: true,
        department: true,
        year: true,
        gender: true,
        cgpa: true,
        rank: true,
        isAllocated: true
      }
    });

    if (!student) {
      throw new HttpError(404, "Student profile not found");
    }

    res.json({
      success: true,
      data: {
        student: {
          ...student,
          cgpa: Number(student.cgpa)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

studentRoutes.get("/me/slot", requireAuth, requireRole("STUDENT"), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { userId: req.user!.id },
      select: { rank: true }
    });

    if (!student?.rank) {
      throw new HttpError(404, "Student rank is not available");
    }

    const now = new Date();
    const slot = await prisma.counselingSlot.findFirst({
      where: {
        minRank: { lte: student.rank },
        maxRank: { gte: student.rank }
      },
      orderBy: { startTime: "asc" }
    });

    const status = !slot
      ? "NOT_ASSIGNED"
      : now < slot.startTime
        ? "UPCOMING"
        : now > slot.endTime
          ? "ENDED"
          : "ACTIVE";

    res.json({
      success: true,
      data: {
        slot,
        status,
        serverTime: now
      }
    });
  } catch (error) {
    next(error);
  }
});
