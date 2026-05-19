import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "../../config/database";
import { broadcastAdminRealtime, broadcastRealtime } from "../../realtime/realtime.service";
import { HttpError } from "../../utils/http-error";

function publicStudent(student: {
  id: string;
  registrationNumber: string;
  name: string;
  department: string | null;
  year?: number | null;
}) {
  return {
    id: student.id,
    registrationNumber: student.registrationNumber,
    name: student.name,
    department: student.department,
    year: student.year
  };
}

function publicRoom(room: {
  id: string;
  roomNumber: string;
  floor: number | null;
  capacity: number;
  currentOccupancy: number;
  isAvailable: boolean;
  hostelBlock: {
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
  };
  category: {
    id: string;
    name: string;
    capacity: number;
  };
}) {
  return {
    id: room.id,
    roomNumber: room.roomNumber,
    floor: room.floor,
    capacity: room.capacity,
    currentOccupancy: room.currentOccupancy,
    availableBeds: Math.max(room.capacity - room.currentOccupancy, 0),
    isAvailable: room.isAvailable && room.currentOccupancy < room.capacity,
    hostelBlock: room.hostelBlock,
    category: room.category
  };
}

function publicAllocation(allocation: {
  id: string;
  allocationGroupId: string;
  createdAt: Date;
  room: Parameters<typeof publicRoom>[0];
  student: Parameters<typeof publicStudent>[0];
}) {
  return {
    id: allocation.id,
    allocationGroupId: allocation.allocationGroupId,
    allocatedAt: allocation.createdAt,
    student: publicStudent(allocation.student),
    room: publicRoom(allocation.room),
    receipt: {
      receiptNumber: `ALLOC-${allocation.createdAt.getFullYear()}-${allocation.id.slice(0, 8).toUpperCase()}`,
      issuedAt: allocation.createdAt,
      message: `Room ${allocation.room.roomNumber} in ${allocation.room.hostelBlock.name} has been allocated successfully.`
    }
  };
}

const allocationInclude = {
  student: {
    select: {
      id: true,
      registrationNumber: true,
      name: true,
      department: true,
      year: true
    }
  },
  room: {
    include: {
      hostelBlock: {
        select: {
          id: true,
          name: true,
          gender: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          capacity: true
        }
      }
    }
  }
} satisfies Prisma.AllocationInclude;

export async function allocateRoomForStudent(input: {
  userId: string;
  roomId: string;
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { userId: input.userId },
        select: {
          id: true,
          registrationNumber: true,
          name: true,
          department: true,
          year: true,
          rank: true,
          gender: true,
          isAllocated: true
        }
      });

      if (!student) {
        throw new HttpError(404, "Student profile not found");
      }

      if (!student.rank) {
        throw new HttpError(403, "Student rank is required before allocation");
      }

      const now = new Date();
      const activeSlot = await tx.counselingSlot.findFirst({
        where: {
          isActive: true,
          minRank: { lte: student.rank },
          maxRank: { gte: student.rank },
          startTime: { lte: now },
          endTime: { gte: now }
        },
        orderBy: { startTime: "asc" }
      });

      if (!activeSlot) {
        throw new HttpError(403, "Room allocation is only allowed during your active counseling slot");
      }

      const existingAllocation = await tx.allocation.findUnique({
        where: { studentId: student.id }
      });

      if (student.isAllocated || existingAllocation) {
        throw new HttpError(409, "You already have a room allocation");
      }

      const room = await tx.room.findUnique({
        where: { id: input.roomId },
        include: {
          hostelBlock: {
            select: {
              id: true,
              name: true,
              gender: true,
              isActive: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              capacity: true
            }
          }
        }
      });

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      if (!room.hostelBlock.isActive) {
        throw new HttpError(400, "This hostel block is not active for allocation");
      }

      if (room.hostelBlock.gender && student.gender && room.hostelBlock.gender !== student.gender) {
        throw new HttpError(400, "This room is not available for your hostel category");
      }

      if (!room.isAvailable || room.currentOccupancy >= room.capacity) {
        throw new HttpError(409, "Room is no longer available");
      }

      const updatedRoom = await tx.room.updateMany({
        where: {
          id: room.id,
          isAvailable: true,
          currentOccupancy: { lt: room.capacity }
        },
        data: {
          currentOccupancy: { increment: 1 }
        }
      });

      if (updatedRoom.count !== 1) {
        throw new HttpError(409, "Room is no longer available");
      }

      const allocationGroupId = randomUUID();
      const allocation = await tx.allocation.create({
        data: {
          roomId: room.id,
          studentId: student.id,
          allocatedByUserId: input.userId,
          allocationGroupId
        }
      });

      await tx.roomOccupant.create({
        data: {
          roomId: room.id,
          studentId: student.id
        }
      });

      await tx.student.update({
        where: { id: student.id },
        data: { isAllocated: true }
      });

      const roomAfterAllocation = await tx.room.findUniqueOrThrow({
        where: { id: room.id },
        include: {
          hostelBlock: {
            select: {
              id: true,
              name: true,
              gender: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              capacity: true
            }
          }
        }
      });

      if (roomAfterAllocation.currentOccupancy >= roomAfterAllocation.capacity) {
        await tx.room.update({
          where: { id: room.id },
          data: { isAvailable: false }
        });
        roomAfterAllocation.isAvailable = false;
      }

      return publicAllocation({
        ...allocation,
        student,
        room: roomAfterAllocation
      });
    });

    broadcastRealtime("ROOM_AVAILABILITY_CHANGED", { roomId: result.room.id });
    broadcastRealtime("OCCUPANCY_CHANGED", { roomId: result.room.id });
    broadcastRealtime("ALLOCATION_CREATED", {
      allocationId: result.id,
      roomId: result.room.id,
      studentId: result.student.id
    });
    broadcastAdminRealtime("ADMIN_DASHBOARD_CHANGED", { reason: "allocation-created" });

    return result;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpError(409, "You already have a room allocation");
    }

    throw error;
  }
}

export async function getCurrentAllocation(userId: string) {
  const allocation = await prisma.allocation.findFirst({
    where: {
      student: { userId }
    },
    include: allocationInclude
  });

  return allocation ? publicAllocation(allocation) : null;
}

export async function getAllocationStatus(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true,
      rank: true,
      isAllocated: true
    }
  });

  if (!student) {
    throw new HttpError(404, "Student profile not found");
  }

  const now = new Date();
  const slot = student.rank
    ? await prisma.counselingSlot.findFirst({
        where: {
          minRank: { lte: student.rank },
          maxRank: { gte: student.rank }
        },
        orderBy: { startTime: "asc" }
      })
    : null;

  const slotStatus = !slot
    ? "NOT_ASSIGNED"
    : !slot.isActive
      ? "INACTIVE"
      : now < slot.startTime
        ? "UPCOMING"
        : now > slot.endTime
          ? "ENDED"
          : "ACTIVE";

  return {
    isAllocated: student.isAllocated,
    canAllocate: !student.isAllocated && slotStatus === "ACTIVE",
    slotStatus,
    slot,
    serverTime: now
  };
}

export async function getRoomOccupants(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      roomNumber: true,
      capacity: true,
      currentOccupancy: true,
      occupants: {
        orderBy: { createdAt: "asc" },
        include: {
          student: {
            select: {
              id: true,
              registrationNumber: true,
              name: true,
              department: true,
              year: true
            }
          }
        }
      }
    }
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return {
    room: {
      id: room.id,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      currentOccupancy: room.currentOccupancy,
      availableBeds: Math.max(room.capacity - room.currentOccupancy, 0)
    },
    occupants: room.occupants.map((occupant) => ({
      ...publicStudent(occupant.student),
      joinedAt: occupant.createdAt
    }))
  };
}
