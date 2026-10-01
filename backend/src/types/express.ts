import type { AuthTokenPayload } from "../types.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
      requestId?: string;
    }
  }
}

export {};
