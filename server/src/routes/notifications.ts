import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { authenticateSession, type AuthRequest, type SessionArea } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, jsonSafe } from "../lib/http.js";
import { webPushPublicKey } from "../lib/notifications.js";

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(20).max(255),
    auth: z.string().min(8).max(255),
  }),
});

export function notificationRoutes(area: SessionArea) {
  const router = Router();
  router.use(authenticateSession(area));
  router.use(asyncHandler(async (request: AuthRequest, _response, next) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.id },
      select: { role: true, isActive: true },
    });
    const correctArea = area === "customer" ? user?.role === UserRole.CUSTOMER : user?.role !== UserRole.CUSTOMER;
    if (!user?.isActive || !correctArea) throw new HttpError(401, "This account is no longer active.");
    next();
  }));

  router.get(
    "/",
    asyncHandler(async (request: AuthRequest, response) => {
      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { recipientId: request.auth!.id, clearedAt: null },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.notification.count({
          where: { recipientId: request.auth!.id, readAt: null, clearedAt: null },
        }),
      ]);
      response.set("Cache-Control", "private, no-store").json(jsonSafe({ notifications, unreadCount }));
    }),
  );

  router.get(
    "/push-config",
    asyncHandler(async (_request, response) => {
      response.set("Cache-Control", "private, max-age=300").json({
        enabled: true,
        publicKey: await webPushPublicKey(),
      });
    }),
  );

  router.patch(
    "/:id/read",
    asyncHandler(async (request: AuthRequest, response) => {
      await prisma.notification.updateMany({
        where: { id: String(request.params.id), recipientId: request.auth!.id, clearedAt: null, readAt: null },
        data: { readAt: new Date() },
      });
      response.status(204).end();
    }),
  );

  router.post(
    "/read-all",
    asyncHandler(async (request: AuthRequest, response) => {
      z.object({}).strict().parse(request.body ?? {});
      await prisma.notification.updateMany({
        where: { recipientId: request.auth!.id, clearedAt: null, readAt: null },
        data: { readAt: new Date() },
      });
      response.status(204).end();
    }),
  );

  router.delete(
    "/:id",
    asyncHandler(async (request: AuthRequest, response) => {
      await prisma.notification.updateMany({
        where: { id: String(request.params.id), recipientId: request.auth!.id, clearedAt: null },
        data: { readAt: new Date(), clearedAt: new Date() },
      });
      response.status(204).end();
    }),
  );

  router.delete(
    "/",
    asyncHandler(async (request: AuthRequest, response) => {
      const now = new Date();
      await prisma.notification.updateMany({
        where: { recipientId: request.auth!.id, clearedAt: null },
        data: { readAt: now, clearedAt: now },
      });
      response.status(204).end();
    }),
  );

  router.post(
    "/subscriptions",
    asyncHandler(async (request: AuthRequest, response) => {
      const input = subscriptionSchema.parse(request.body);
      const subscription = await prisma.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: {
          userId: request.auth!.id,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: request.get("user-agent")?.slice(0, 500),
        },
        create: {
          userId: request.auth!.id,
          endpoint: input.endpoint,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent: request.get("user-agent")?.slice(0, 500),
        },
        select: { id: true },
      });
      response.status(201).json(subscription);
    }),
  );

  router.delete(
    "/subscriptions/current",
    asyncHandler(async (request: AuthRequest, response) => {
      const { endpoint } = z.object({ endpoint: z.string().url().max(2048) }).parse(request.body);
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: request.auth!.id },
      });
      response.status(204).end();
    }),
  );

  return router;
}
