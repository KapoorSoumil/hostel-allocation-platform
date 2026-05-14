import { UserRole } from "@prisma/client";
import { prisma } from "../../config/database";
import { HttpError } from "../../utils/http-error";
import { createAuthTokens, verifyRefreshToken } from "../../utils/tokens";
import { verifyPassword } from "../../utils/password";
import { normalizeEmail, normalizeRegistrationNumber } from "../../utils/database";

function publicUser(user: {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  student?: {
    id: string;
    registrationNumber: string;
    name: string;
    rank: number | null;
    isAllocated: boolean;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    student: user.student
      ? {
          id: user.student.id,
          registrationNumber: user.student.registrationNumber,
          name: user.student.name,
          rank: user.student.rank,
          isAllocated: user.student.isAllocated
        }
      : undefined
  };
}

function issueTokensForUser(user: { id: string; email: string; role: UserRole }) {
  return createAuthTokens({
    id: user.id,
    email: user.email,
    role: user.role
  });
}

export async function loginStudent(input: {
  registrationNumber?: string;
  email?: string;
  password: string;
}) {
  const user = await prisma.user.findFirst({
    where: {
      role: UserRole.STUDENT,
      ...(input.email
        ? { email: normalizeEmail(input.email) }
        : {
            student: {
              registrationNumber: normalizeRegistrationNumber(input.registrationNumber ?? "")
            }
          })
    },
    include: {
      student: true
    }
  });

  if (!user || !user.student) {
    throw new HttpError(401, "Invalid student credentials");
  }

  if (!user.isActive) {
    throw new HttpError(403, "This student account is inactive");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid student credentials");
  }

  return {
    user: publicUser(user),
    tokens: issueTokensForUser(user)
  };
}

export async function loginAdmin(input: { email: string; password: string }) {
  const user = await prisma.user.findFirst({
    where: {
      email: normalizeEmail(input.email),
      role: {
        in: [UserRole.ADMIN, UserRole.SUPER_ADMIN]
      }
    }
  });

  if (!user) {
    throw new HttpError(401, "Invalid admin credentials");
  }

  if (!user.isActive) {
    throw new HttpError(403, "This admin account is inactive");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid admin credentials");
  }

  return {
    user: publicUser(user),
    tokens: issueTokensForUser(user)
  };
}

export async function refreshAuthToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { student: true }
    });

    if (!user || !user.isActive) {
      throw new HttpError(401, "Invalid refresh token");
    }

    return {
      user: publicUser(user),
      tokens: issueTokensForUser(user)
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(401, "Invalid or expired refresh token");
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { student: true }
  });

  if (!user || !user.isActive) {
    throw new HttpError(401, "Authenticated user no longer exists");
  }

  return publicUser(user);
}
