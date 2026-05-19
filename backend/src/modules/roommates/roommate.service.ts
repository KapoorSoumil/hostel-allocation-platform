import { OtpPurpose, Prisma, RoommateRequestStatus } from "@prisma/client";
import { randomInt } from "node:crypto";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { broadcastAdminRealtime, broadcastRealtime } from "../../realtime/realtime.service";
import { hashPassword, verifyPassword } from "../../utils/password";
import { normalizeRegistrationNumber } from "../../utils/database";
import { HttpError } from "../../utils/http-error";
import { logger } from "../../utils/logger";

const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_OTP_SENDS_PER_REQUEST = 3;

function normalizePhone(phone: string) {
  return phone.replace(/[\s-]/g, "");
}

function maskPhone(phone: string) {
  const normalized = normalizePhone(phone);
  if (normalized.length <= 4) {
    return "****";
  }

  return `${"*".repeat(Math.max(normalized.length - 4, 0))}${normalized.slice(-4)}`;
}

function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

function publicStudent(student: {
  id: string;
  registrationNumber: string;
  name: string;
  phone?: string;
  department: string | null;
  year: number | null;
}) {
  return {
    id: student.id,
    registrationNumber: student.registrationNumber,
    name: student.name,
    phone: student.phone ? maskPhone(student.phone) : undefined,
    department: student.department,
    year: student.year
  };
}

function publicRequest(request: {
  id: string;
  status: RoommateRequestStatus;
  createdAt: Date;
  verifiedAt: Date | null;
  requesterStudent: Parameters<typeof publicStudent>[0];
  roommateStudent: Parameters<typeof publicStudent>[0];
  room?: {
    id: string;
    roomNumber: string;
    hostelBlock: { id: string; name: string };
  } | null;
  otpVerifications?: Array<{
    expiresAt: Date;
    attempts: number;
    verifiedAt: Date | null;
    createdAt: Date;
  }>;
}) {
  const latestOtp = request.otpVerifications?.[0];

  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    verifiedAt: request.verifiedAt,
    requesterStudent: publicStudent(request.requesterStudent),
    roommateStudent: publicStudent(request.roommateStudent),
    room: request.room
      ? {
          id: request.room.id,
          roomNumber: request.room.roomNumber,
          hostelBlock: request.room.hostelBlock
        }
      : null,
    otp: latestOtp
      ? {
          expiresAt: latestOtp.expiresAt,
          attemptsRemaining: Math.max(MAX_VERIFY_ATTEMPTS - latestOtp.attempts, 0),
          isVerified: Boolean(latestOtp.verifiedAt)
        }
      : null
  };
}

const requestInclude = {
  requesterStudent: {
    select: {
      id: true,
      registrationNumber: true,
      name: true,
      department: true,
      year: true
    }
  },
  roommateStudent: {
    select: {
      id: true,
      registrationNumber: true,
      name: true,
      phone: true,
      department: true,
      year: true
    }
  },
  room: {
    select: {
      id: true,
      roomNumber: true,
      hostelBlock: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  otpVerifications: {
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      expiresAt: true,
      attempts: true,
      verifiedAt: true,
      createdAt: true
    }
  }
} satisfies Prisma.RoommateRequestInclude;

async function createOtp(roommateRequestId: string, phone: string) {
  const otp = generateOtp();
  const otpHash = await hashPassword(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const verification = await prisma.otpVerification.create({
    data: {
      roommateRequestId,
      phone,
      otpHash,
      expiresAt,
      purpose: OtpPurpose.ROOMMATE_VERIFICATION
    },
    select: {
      expiresAt: true
    }
  });

  logger.info(
    {
      roommateRequestId,
      maskedPhone: maskPhone(phone),
      devOtp: env.NODE_ENV === "production" ? undefined : otp
    },
    "Roommate OTP generated"
  );

  return {
    otp,
    expiresAt: verification.expiresAt
  };
}

export async function createRoommateRequest(input: {
  userId: string;
  registrationNumber: string;
  phone: string;
  roomId?: string;
}) {
  const requester = await prisma.student.findUnique({
    where: { userId: input.userId },
    select: {
      id: true,
      registrationNumber: true,
      gender: true,
      isAllocated: true
    }
  });

  if (!requester) {
    throw new HttpError(404, "Student profile not found");
  }

  const roommate = await prisma.student.findUnique({
    where: {
      registrationNumber: normalizeRegistrationNumber(input.registrationNumber)
    },
    select: {
      id: true,
      registrationNumber: true,
      phone: true,
      gender: true,
      isAllocated: true
    }
  });

  if (!roommate) {
    throw new HttpError(404, "Roommate student not found");
  }

  if (roommate.id === requester.id) {
    throw new HttpError(400, "You cannot add yourself as a roommate");
  }

  if (requester.isAllocated || roommate.isAllocated) {
    throw new HttpError(409, "Allocated students cannot create roommate requests");
  }

  if (requester.gender && roommate.gender && requester.gender !== roommate.gender) {
    throw new HttpError(400, "Roommate must match your hostel category");
  }

  if (normalizePhone(roommate.phone) !== normalizePhone(input.phone)) {
    throw new HttpError(403, "Phone number does not match the roommate record");
  }

  if (input.roomId) {
    const room = await prisma.room.findUnique({
      where: { id: input.roomId },
      include: {
        hostelBlock: {
          select: {
            gender: true,
            isActive: true
          }
        }
      }
    });

    if (!room) {
      throw new HttpError(404, "Room not found");
    }

    if (!room.isAvailable || room.currentOccupancy >= room.capacity) {
      throw new HttpError(409, "Selected room is no longer available");
    }

    if (!room.hostelBlock.isActive) {
      throw new HttpError(400, "Selected hostel block is not active");
    }

    if (room.hostelBlock.gender && requester.gender && room.hostelBlock.gender !== requester.gender) {
      throw new HttpError(400, "Selected room is not available for your hostel category");
    }
  }

  const existingVerified = await prisma.roommateRequest.findFirst({
    where: {
      requesterStudentId: requester.id,
      roommateStudentId: roommate.id,
      status: RoommateRequestStatus.VERIFIED
    }
  });

  if (existingVerified) {
    throw new HttpError(409, "This roommate is already verified");
  }

  const pendingRequest = await prisma.roommateRequest.findFirst({
    where: {
      requesterStudentId: requester.id,
      roommateStudentId: roommate.id,
      status: RoommateRequestStatus.PENDING
    },
    include: {
      otpVerifications: {
        orderBy: { createdAt: "desc" },
        take: MAX_OTP_SENDS_PER_REQUEST
      }
    }
  });

  let requestId = pendingRequest?.id;

  if (pendingRequest) {
    if (pendingRequest.otpVerifications.length >= MAX_OTP_SENDS_PER_REQUEST) {
      throw new HttpError(429, "OTP retry limit reached for this roommate request");
    }
  } else {
    const created = await prisma.roommateRequest.create({
      data: {
        requesterStudentId: requester.id,
        roommateStudentId: roommate.id,
        roomId: input.roomId
      },
      select: {
        id: true
      }
    });
    requestId = created.id;
  }

  const otpDelivery = await createOtp(requestId!, roommate.phone);

  const request = await prisma.roommateRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: requestInclude
  });

  broadcastRealtime("ROOMMATE_REQUEST_CHANGED", { requestId });
  broadcastAdminRealtime("ADMIN_DASHBOARD_CHANGED", { reason: "roommate-request-created" });

  return {
    request: publicRequest(request),
    delivery: {
      maskedPhone: maskPhone(roommate.phone),
      expiresAt: otpDelivery.expiresAt,
      developmentOtp: env.NODE_ENV === "production" ? undefined : otpDelivery.otp
    }
  };
}

export async function verifyRoommateOtp(input: {
  userId: string;
  requestId: string;
  otp: string;
}) {
  const requester = await prisma.student.findUnique({
    where: { userId: input.userId },
    select: {
      id: true
    }
  });

  if (!requester) {
    throw new HttpError(404, "Student profile not found");
  }

  const request = await prisma.roommateRequest.findUnique({
    where: { id: input.requestId },
    include: {
      requesterStudent: {
        select: {
          id: true,
          registrationNumber: true,
          name: true,
          department: true,
          year: true
        }
      },
      roommateStudent: {
        select: {
          id: true,
          registrationNumber: true,
          name: true,
          phone: true,
          department: true,
          year: true
        }
      },
      room: requestInclude.room,
      otpVerifications: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!request) {
    throw new HttpError(404, "Roommate request not found");
  }

  if (request.requesterStudentId !== requester.id) {
    throw new HttpError(403, "You can only verify your own roommate requests");
  }

  if (request.status !== RoommateRequestStatus.PENDING) {
    throw new HttpError(409, "This roommate request is not pending verification");
  }

  const latestOtp = request.otpVerifications[0];

  if (!latestOtp) {
    throw new HttpError(400, "No OTP is available for this request");
  }

  if (latestOtp.verifiedAt) {
    throw new HttpError(409, "OTP is already verified");
  }

  if (latestOtp.expiresAt < new Date()) {
    await prisma.roommateRequest.update({
      where: { id: request.id },
      data: { status: RoommateRequestStatus.EXPIRED }
    });
    throw new HttpError(410, "OTP has expired");
  }

  if (latestOtp.attempts >= MAX_VERIFY_ATTEMPTS) {
    throw new HttpError(429, "OTP verification attempt limit reached");
  }

  const isValidOtp = await verifyPassword(input.otp, latestOtp.otpHash);

  await prisma.otpVerification.update({
    where: { id: latestOtp.id },
    data: {
      attempts: { increment: 1 },
      ...(isValidOtp ? { verifiedAt: new Date() } : {})
    }
  });

  if (!isValidOtp) {
    throw new HttpError(400, "Invalid OTP");
  }

  const verifiedRequest = await prisma.roommateRequest.update({
    where: { id: request.id },
    data: {
      status: RoommateRequestStatus.VERIFIED,
      verifiedAt: new Date()
    },
    include: requestInclude
  });

  const result = publicRequest(verifiedRequest);
  broadcastRealtime("ROOMMATE_REQUEST_CHANGED", { requestId: result.id, status: result.status });
  broadcastAdminRealtime("ADMIN_DASHBOARD_CHANGED", { reason: "roommate-request-verified" });

  return result;
}

export async function listMyRoommateRequests(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: {
      id: true
    }
  });

  if (!student) {
    throw new HttpError(404, "Student profile not found");
  }

  const requests = await prisma.roommateRequest.findMany({
    where: {
      OR: [
        { requesterStudentId: student.id },
        { roommateStudentId: student.id }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: requestInclude
  });

  return requests.map(publicRequest);
}

export async function cancelRoommateRequest(input: {
  userId: string;
  requestId: string;
}) {
  const student = await prisma.student.findUnique({
    where: { userId: input.userId },
    select: {
      id: true
    }
  });

  if (!student) {
    throw new HttpError(404, "Student profile not found");
  }

  const request = await prisma.roommateRequest.findUnique({
    where: { id: input.requestId }
  });

  if (!request) {
    throw new HttpError(404, "Roommate request not found");
  }

  if (request.requesterStudentId !== student.id) {
    throw new HttpError(403, "You can only cancel your own roommate requests");
  }

  if (request.status !== RoommateRequestStatus.PENDING) {
    throw new HttpError(409, "Only pending roommate requests can be cancelled");
  }

  const cancelled = await prisma.roommateRequest.update({
    where: { id: input.requestId },
    data: { status: RoommateRequestStatus.CANCELLED },
    include: requestInclude
  });

  const result = publicRequest(cancelled);
  broadcastRealtime("ROOMMATE_REQUEST_CHANGED", { requestId: result.id, status: result.status });
  broadcastAdminRealtime("ADMIN_DASHBOARD_CHANGED", { reason: "roommate-request-cancelled" });

  return result;
}
