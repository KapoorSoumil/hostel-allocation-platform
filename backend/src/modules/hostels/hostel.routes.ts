import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { prisma } from "../../config/database";
import { HttpError } from "../../utils/http-error";

export const hostelRoutes = Router();

hostelRoutes.get("/", requireAuth, async (_req, res, next) => {
  try {
    const hostels = await prisma.hostelBlock.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        rooms: {
          select: {
            capacity: true,
            currentOccupancy: true,
            isAvailable: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        hostels: hostels.map((hostel) => {
          const totalBeds = hostel.rooms.reduce((sum, room) => sum + room.capacity, 0);
          const occupiedBeds = hostel.rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);

          return {
            id: hostel.id,
            name: hostel.name,
            gender: hostel.gender,
            description: hostel.description,
            totalRooms: hostel.totalRooms,
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

hostelRoutes.post("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), (_req, res) => {
  res.status(501).json({ success: false, message: "Hostel block creation will be implemented later" });
});

hostelRoutes.get("/:id/rooms", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

    if (typeof id !== "string") {
      throw new HttpError(400, "Invalid hostel block id");
    }

    const hostel = await prisma.hostelBlock.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        gender: true,
        description: true,
        totalRooms: true
      }
    });

    if (!hostel) {
      throw new HttpError(404, "Hostel block not found");
    }

    const rooms = await prisma.room.findMany({
      where: {
        hostelBlockId: id,
        ...(categoryId ? { categoryId } : {}),
        ...(search ? { roomNumber: { contains: search, mode: "insensitive" } } : {})
      },
      orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            capacity: true
          }
        },
        occupants: {
          select: {
            studentId: true
          }
        }
      }
    });

    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);

    res.json({
      success: true,
      data: {
        hostel,
        summary: {
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds
        },
        rooms: rooms.map((room) => ({
          id: room.id,
          roomNumber: room.roomNumber,
          floor: room.floor,
          capacity: room.capacity,
          currentOccupancy: room.currentOccupancy,
          availableBeds: room.capacity - room.currentOccupancy,
          isAvailable: room.isAvailable && room.currentOccupancy < room.capacity,
          category: room.category,
          occupantCount: room.occupants.length
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});
