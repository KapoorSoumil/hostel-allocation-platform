import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { prisma } from "../../config/database";
import { HttpError } from "../../utils/http-error";

export const roomRoutes = Router();

roomRoutes.get("/available", requireAuth, async (_req, res, next) => {
  try {
    const categories = await prisma.roomCategory.findMany({
      orderBy: { capacity: "asc" },
      include: {
        rooms: {
          where: { isAvailable: true },
          select: {
            id: true,
            capacity: true,
            currentOccupancy: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        categories: categories.map((category) => {
          const totalRooms = category.rooms.length;
          const totalBeds = category.rooms.reduce((sum, room) => sum + room.capacity, 0);
          const occupiedBeds = category.rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);

          return {
            id: category.id,
            name: category.name,
            capacity: category.capacity,
            totalRooms,
            totalBeds,
            occupiedBeds,
            availableBeds: totalBeds - occupiedBeds
          };
        })
      }
    });
  } catch (error) {
    next(error);
  }
});

roomRoutes.post("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), (_req, res) => {
  res.status(501).json({ success: false, message: "Room creation will be implemented later" });
});

roomRoutes.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;

    if (typeof id !== "string") {
      throw new HttpError(400, "Invalid room id");
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hostelBlock: {
          select: {
            id: true,
            name: true,
            gender: true,
            description: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
        occupants: {
          include: {
            student: {
              select: {
                id: true,
                registrationNumber: true,
                name: true,
                department: true
              }
            }
          }
        }
      }
    });

    if (!room) {
      throw new HttpError(404, "Room not found");
    }

    res.json({
      success: true,
      data: {
        room: {
          id: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          capacity: room.capacity,
          currentOccupancy: room.currentOccupancy,
          availableBeds: room.capacity - room.currentOccupancy,
          isAvailable: room.isAvailable && room.currentOccupancy < room.capacity,
          hostelBlock: room.hostelBlock,
          category: room.category,
          occupants: room.occupants.map((occupant) => occupant.student)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});
