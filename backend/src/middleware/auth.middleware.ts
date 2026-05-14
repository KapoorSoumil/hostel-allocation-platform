import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error";
import { verifyAccessToken } from "../utils/tokens";

export type AuthUser = {
  id: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "SUPER_ADMIN";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Authentication token is required"));
  }

  try {
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired authentication token"));
  }
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication is required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
}
