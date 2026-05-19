import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { hashPassword } from "../../utils/password";
import { normalizeEmail, normalizeRegistrationNumber } from "../../utils/database";
import { HttpError } from "../../utils/http-error";

const DEFAULT_STUDENT_PASSWORD = "Password@123";

type ImportStudent = {
  registrationNumber: string;
  name: string;
  email: string;
  phone: string;
  department?: string | null;
  year?: number | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  cgpa: number;
};

function parseCsv(csv: string): ImportStudent[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));

    return {
      registrationNumber: row.registrationNumber,
      name: row.name,
      email: row.email,
      phone: row.phone,
      department: row.department || null,
      year: row.year ? Number(row.year) : null,
      gender: row.gender ? row.gender as ImportStudent["gender"] : null,
      cgpa: Number(row.cgpa)
    };
  });
}

export async function getAdminDashboard() {
  const [
    totalStudents,
    allocatedStudents,
    hostels,
    rooms,
    categories,
    slots,
    allocations,
    roommateRequests
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { isAllocated: true } }),
    prisma.hostelBlock.findMany({
      orderBy: { name: "asc" },
      include: { rooms: true }
    }),
    prisma.room.findMany({
      include: {
        hostelBlock: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      },
      orderBy: [{ hostelBlock: { name: "asc" } }, { roomNumber: "asc" }]
    }),
    prisma.roomCategory.findMany({ orderBy: { capacity: "asc" } }),
    prisma.counselingSlot.findMany({ orderBy: { startTime: "asc" } }),
    prisma.allocation.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        student: { select: { id: true, registrationNumber: true, name: true } },
        room: {
          select: {
            id: true,
            roomNumber: true,
            hostelBlock: { select: { id: true, name: true } }
          }
        }
      }
    }),
    prisma.roommateRequest.groupBy({
      by: ["status"],
      _count: { status: true }
    })
  ]);

  const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedBeds = rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);

  return {
    stats: {
      totalStudents,
      allocatedStudents,
      unallocatedStudents: totalStudents - allocatedStudents,
      totalHostels: hostels.length,
      totalRooms: rooms.length,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      activeSlots: slots.filter((slot) => slot.isActive).length
    },
    hostels: hostels.map((hostel) => {
      const hostelBeds = hostel.rooms.reduce((sum, room) => sum + room.capacity, 0);
      const hostelOccupied = hostel.rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);

      return {
        id: hostel.id,
        name: hostel.name,
        gender: hostel.gender,
        description: hostel.description,
        isActive: hostel.isActive,
        totalRooms: hostel.rooms.length,
        totalBeds: hostelBeds,
        occupiedBeds: hostelOccupied,
        availableBeds: hostelBeds - hostelOccupied
      };
    }),
    rooms: rooms.map((room) => ({
      id: room.id,
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      currentOccupancy: room.currentOccupancy,
      availableBeds: room.capacity - room.currentOccupancy,
      isAvailable: room.isAvailable,
      hostelBlock: room.hostelBlock,
      category: room.category
    })),
    categories,
    slots,
    recentAllocations: allocations.map((allocation) => ({
      id: allocation.id,
      createdAt: allocation.createdAt,
      allocationGroupId: allocation.allocationGroupId,
      student: allocation.student,
      room: allocation.room
    })),
    roommateRequestSummary: roommateRequests.map((item) => ({
      status: item.status,
      count: item._count.status
    }))
  };
}

export async function getAllocationReport() {
  const allocations = await prisma.allocation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          registrationNumber: true,
          name: true,
          department: true,
          year: true,
          rank: true
        }
      },
      room: {
        select: {
          roomNumber: true,
          hostelBlock: { select: { name: true } },
          category: { select: { name: true } }
        }
      }
    }
  });

  return allocations.map((allocation) => ({
    id: allocation.id,
    allocatedAt: allocation.createdAt,
    registrationNumber: allocation.student.registrationNumber,
    studentName: allocation.student.name,
    department: allocation.student.department,
    year: allocation.student.year,
    rank: allocation.student.rank,
    hostel: allocation.room.hostelBlock.name,
    roomNumber: allocation.room.roomNumber,
    category: allocation.room.category.name
  }));
}

export async function importStudents(input: { csv?: string; students?: ImportStudent[] }) {
  const rows = input.students?.length ? input.students : parseCsv(input.csv ?? "");
  if (!rows.length) {
    throw new HttpError(400, "No student rows found");
  }

  const validRows = rows.map((student) => ({
    ...student,
    registrationNumber: normalizeRegistrationNumber(student.registrationNumber),
    email: normalizeEmail(student.email),
    cgpa: new Prisma.Decimal(student.cgpa)
  })).sort((a, b) => Number(b.cgpa) - Number(a.cgpa) || a.registrationNumber.localeCompare(b.registrationNumber));

  const passwordHash = await hashPassword(DEFAULT_STUDENT_PASSWORD);

  await prisma.$transaction(async (tx) => {
    for (const student of validRows) {
      await tx.user.upsert({
        where: { email: student.email },
        update: {
          role: UserRole.STUDENT,
          student: {
            upsert: {
              update: {
                registrationNumber: student.registrationNumber,
                name: student.name,
                phone: student.phone,
                department: student.department,
                year: student.year,
                gender: student.gender,
                cgpa: student.cgpa
              },
              create: {
                registrationNumber: student.registrationNumber,
                name: student.name,
                phone: student.phone,
                department: student.department,
                year: student.year,
                gender: student.gender,
                cgpa: student.cgpa
              }
            }
          }
        },
        create: {
          email: student.email,
          passwordHash,
          role: UserRole.STUDENT,
          student: {
            create: {
              registrationNumber: student.registrationNumber,
              name: student.name,
              phone: student.phone,
              department: student.department,
              year: student.year,
              gender: student.gender,
              cgpa: student.cgpa
            }
          }
        }
      });
    }

    const rankedStudents = await tx.student.findMany({
      select: { id: true },
      orderBy: [{ cgpa: "desc" }, { registrationNumber: "asc" }]
    });

    for (const [index, student] of rankedStudents.entries()) {
      await tx.student.update({
        where: { id: student.id },
        data: { rank: index + 1 }
      });
    }
  });

  return {
    imported: validRows.length,
    defaultPassword: DEFAULT_STUDENT_PASSWORD
  };
}

export async function createHostel(data: {
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  description?: string | null;
  isActive?: boolean;
}) {
  return prisma.hostelBlock.create({ data });
}

export async function updateHostel(id: string, data: Parameters<typeof createHostel>[0]) {
  return prisma.hostelBlock.update({ where: { id }, data });
}

export async function createRoom(data: {
  hostelBlockId: string;
  categoryId: string;
  roomNumber: string;
  floor?: number | null;
  capacity: number;
  isAvailable?: boolean;
}) {
  const room = await prisma.room.create({ data });
  await prisma.hostelBlock.update({
    where: { id: data.hostelBlockId },
    data: { totalRooms: { increment: 1 } }
  });
  return room;
}

export async function updateRoom(id: string, data: Parameters<typeof createRoom>[0]) {
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) {
    throw new HttpError(404, "Room not found");
  }
  if (data.capacity < existing.currentOccupancy) {
    throw new HttpError(400, "Capacity cannot be lower than current occupancy");
  }
  return prisma.room.update({ where: { id }, data });
}

export async function createCounselingSlot(data: {
  name: string;
  startTime: Date;
  endTime: Date;
  minRank: number;
  maxRank: number;
  isActive?: boolean;
}) {
  return prisma.counselingSlot.create({ data });
}

export async function updateCounselingSlot(id: string, data: Parameters<typeof createCounselingSlot>[0]) {
  return prisma.counselingSlot.update({ where: { id }, data });
}
