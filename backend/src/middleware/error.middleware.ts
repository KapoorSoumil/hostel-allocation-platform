import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";
import { logger } from "../utils/logger";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  logger.error(error);

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      message: "Database request failed",
      code: error.code
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten().fieldErrors
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    stack: env.NODE_ENV === "development" ? error.stack : undefined
  });
};
