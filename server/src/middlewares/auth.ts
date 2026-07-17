import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Like requireAuth, but doesn't fail the request when no/invalid token is present. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, env.jwtSecret) as AuthPayload;
  } catch {
    // ignore invalid token, treat as anonymous
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function signTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, env.jwtSecret, {
    expiresIn: env.jwtAccessExpires,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ userId, role }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}
