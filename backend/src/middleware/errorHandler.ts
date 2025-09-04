import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = error;

  // Log del error
  logger.error({
    error: {
      message,
      stack,
      statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
  });

  // Respuesta de error
  const errorResponse = {
    error: {
      message: statusCode === 500 ? "Internal Server Error" : message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // En desarrollo, incluir el stack trace
  if (process.env.NODE_ENV === "development") {
    (errorResponse.error as any).stack = stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const createError = (
  message: string,
  statusCode: number = 500
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
