import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Mongoose validation error
  if (err?.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({ error: messages.join(", ") || "Validation failed" });
    return;
  }

  // Mongoose bad ObjectId cast
  if (err?.name === "CastError") {
    res.status(400).json({ error: "Invalid id format" });
    return;
  }

  // Duplicate key (e.g. unique email/slug/code)
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    res.status(409).json({ error: `${field} already in use` });
    return;
  }

  const status = err?.status || err?.statusCode || 500;
  const message = err?.message || "Internal server error";

  if (status >= 500) {
    logger.error({ err }, "Unhandled error");
  }

  res.status(status).json({ error: message });
}
