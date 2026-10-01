import type { RequestHandler } from "express";
import { HttpError } from "../errors.js";

const attempts = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimit(maxAttempts = 30, windowMs = 15 * 60 * 1000): RequestHandler {
  return (req, _res, next) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > maxAttempts) {
      next(new HttpError(429, "Too many login attempts. Try again later"));
      return;
    }
    next();
  };
}
