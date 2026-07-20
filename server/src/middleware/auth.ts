import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { HttpError } from "../lib/http.js";

export const SESSION_COOKIE = "shopee-work-session";

export type AuthClaims = {
  id: string;
  role: UserRole;
};

export interface AuthRequest extends Request {
  auth?: AuthClaims;
}

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required");
  return value;
}

export function createSessionToken(claims: AuthClaims) {
  return jwt.sign(claims, secret(), { expiresIn: "7d", issuer: "shopee-work-api" });
}

export function authenticate(request: AuthRequest, _response: Response, next: NextFunction) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (!token) return next(new HttpError(401, "Please sign in first."));

  try {
    request.auth = jwt.verify(token, secret(), { issuer: "shopee-work-api" }) as AuthClaims;
    next();
  } catch {
    next(new HttpError(401, "Your session has expired. Please sign in again."));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: AuthRequest, _response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}
