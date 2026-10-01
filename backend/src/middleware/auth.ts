import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../errors.js";
import type { AuthTokenPayload, Role } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "eyecare-dev-secret";

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
    throw new HttpError(401, "Invalid token");
  }
  return {
    sub: String(decoded.sub),
    role: decoded.role as Role,
    email: String(decoded.email ?? ""),
  };
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required"));
    return;
  }
  try {
    req.auth = verifyToken(header.slice("Bearer ".length));
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};

export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new HttpError(401, "Authentication required"));
      return;
    }
    if (req.auth.role !== role) {
      next(new HttpError(403, "You do not have access to this resource"));
      return;
    }
    next();
  };
}
