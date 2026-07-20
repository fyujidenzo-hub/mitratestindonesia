import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { HttpError } from "../lib/http.js";

export type SessionArea = "customer" | "admin";

export const SESSION_COOKIES: Record<SessionArea, string> = {
  customer: "shopee-work-customer-session",
  admin: "shopee-work-admin-session",
};

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

export function authenticateSession(area: SessionArea) {
  return (request: AuthRequest, _response: Response, next: NextFunction) => {
    const token = request.cookies?.[SESSION_COOKIES[area]];
    if (!token) return next(new HttpError(401, "Please sign in first."));

    try {
      const claims = jwt.verify(token, secret(), { issuer: "shopee-work-api" }) as AuthClaims;
      const hasCorrectRole = area === "customer"
        ? claims.role === UserRole.CUSTOMER
        : claims.role !== UserRole.CUSTOMER;

      if (!hasCorrectRole) return next(new HttpError(401, "Please sign in to the correct account area."));
      request.auth = claims;
      next();
    } catch (error) {
      if (error instanceof HttpError) return next(error);
      next(new HttpError(401, "Your session has expired. Please sign in again."));
    }
  };
}

export const authenticateCustomer = authenticateSession("customer");
export const authenticateAdmin = authenticateSession("admin");

export function requireRole(...roles: UserRole[]) {
  return (request: AuthRequest, _response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return next(new HttpError(403, "You do not have permission to perform this action."));
    }
    next();
  };
}
