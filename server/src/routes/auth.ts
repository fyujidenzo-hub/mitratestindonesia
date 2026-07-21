import { Router, type NextFunction, type Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, jsonSafe } from "../lib/http.js";
import {
  authenticateSession,
  createSessionToken,
  type AuthRequest,
  type SessionArea,
  SESSION_COOKIES,
} from "../middleware/auth.js";

const router = Router();

const loginSchema = z.object({
  identifier: z.string().trim().min(2),
  password: z.string().min(4),
  area: z.enum(["customer", "admin"]).default("customer"),
});

const registerSchema = z.object({
  username: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/),
  displayName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(32),
  invitationCode: z.string().trim().min(4).max(32),
  password: z.string().min(6).max(100),
  withdrawalPassword: z.string().min(4).max(32),
});

const sessionAreaSchema = z.enum(["customer", "admin"]);
const logoutSchema = z.object({ area: sessionAreaSchema.default("customer") });

function publicUser(user: Record<string, unknown>) {
  const { passwordHash: _passwordHash, withdrawalPasswordHash: _withdrawalPasswordHash, ...safe } = user;
  return jsonSafe(safe);
}

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // The Hostinger frontend and Render API are different sites. Production
  // sessions therefore need an explicitly cross-site, secure cookie.
  sameSite: process.env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  path: "/",
};

function setSession(response: Response, area: SessionArea, id: string, role: UserRole) {
  response.cookie(SESSION_COOKIES[area], createSessionToken({ id, role }), {
    ...sessionCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Remove the legacy shared cookie so it can no longer confuse older sessions.
  response.clearCookie("shopee-work-session", sessionCookieOptions);
}

function authenticateRequestedArea(request: AuthRequest, response: Response, next: NextFunction) {
  const area = sessionAreaSchema.parse(request.query.area ?? "customer");
  return authenticateSession(area)(request, response, next);
}

router.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = loginSchema.parse(request.body);
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [{ username: input.identifier }, { phone: input.identifier }],
      },
      include: { referrer: { select: { id: true, displayName: true } } },
    });

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "The username, phone number, or password is incorrect.");
    }
    if (input.area === "admin" && user.role === UserRole.CUSTOMER) {
      throw new HttpError(403, "This account does not have administrator access.");
    }
    if (input.area === "customer" && user.role !== UserRole.CUSTOMER) {
      throw new HttpError(403, "Use the administrator sign-in page for this account.");
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    setSession(response, input.area, user.id, user.role);
    response.json({ user: publicUser(user) });
  }),
);

router.post(
  "/register",
  asyncHandler(async (request, response) => {
    const input = registerSchema.parse(request.body);
    const referrer = await prisma.user.findFirst({
      where: {
        invitationCode: input.invitationCode,
        isActive: true,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE] },
      },
    });
    if (!referrer) throw new HttpError(400, "The invitation code is invalid.");

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: input.username }, { phone: input.phone }] },
    });
    if (existing) throw new HttpError(409, "The username or phone number is already in use.");

    const [passwordHash, withdrawalPasswordHash] = await Promise.all([
      bcrypt.hash(input.password, 12),
      bcrypt.hash(input.withdrawalPassword, 12),
    ]);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        phone: input.phone,
        passwordHash,
        withdrawalPasswordHash,
        role: UserRole.CUSTOMER,
        balance: referrer.registrationBonus,
        referrerId: referrer.id,
      },
      include: { referrer: { select: { id: true, displayName: true } } },
    });

    setSession(response, "customer", user.id, user.role);
    response.status(201).json({ user: publicUser(user) });
  }),
);

router.get(
  "/me",
  authenticateRequestedArea,
  asyncHandler(async (request: AuthRequest, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.id },
      include: { referrer: { select: { id: true, displayName: true } } },
    });
    if (!user || !user.isActive) throw new HttpError(401, "Account not found.");
    response.json({ user: publicUser(user) });
  }),
);

router.post("/logout", (request, response) => {
  const { area } = logoutSchema.parse(request.body ?? {});
  response.clearCookie(SESSION_COOKIES[area], sessionCookieOptions);
  response.clearCookie("shopee-work-session", sessionCookieOptions);
  response.status(204).end();
});

export default router;
