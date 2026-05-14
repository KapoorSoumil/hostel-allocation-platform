import type { NextFunction, Request, Response } from "express";
import {
  adminLoginSchema,
  refreshTokenSchema,
  studentLoginSchema
} from "./auth.validation";
import {
  getCurrentUser,
  loginAdmin,
  loginStudent,
  refreshAuthToken
} from "./auth.service";

export async function studentLoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = studentLoginSchema.parse(req.body);
    const result = await loginStudent(input);

    return res.json({
      success: true,
      message: "Student login successful",
      data: result
    });
  } catch (error) {
    return next(error);
  }
}

export async function adminLoginController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = adminLoginSchema.parse(req.body);
    const result = await loginAdmin(input);

    return res.json({
      success: true,
      message: "Admin login successful",
      data: result
    });
  } catch (error) {
    return next(error);
  }
}

export async function refreshTokenController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const input = refreshTokenSchema.parse(req.body);
    const result = await refreshAuthToken(input.refreshToken);

    return res.json({
      success: true,
      message: "Token refreshed successfully",
      data: result
    });
  } catch (error) {
    return next(error);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getCurrentUser(req.user!.id);

    return res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    return next(error);
  }
}
