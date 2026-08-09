import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient, UserRole } from "@prisma/client";
import webpush from "web-push";
import { prisma } from "./prisma.js";

type DatabaseClient = PrismaClient | Prisma.TransactionClient;

export type NotificationInput = {
  type: string;
  title: string;
  body: string;
  path: string;
  entityType?: string;
  entityId?: string;
  dedupeKey: string;
};

let configuredVapidKey = "";

async function vapidKeys() {
  const environmentPublicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const environmentPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (environmentPublicKey && environmentPrivateKey) {
    return { publicKey: environmentPublicKey, privateKey: environmentPrivateKey };
  }

  const existing = await prisma.pushConfiguration.findUnique({ where: { id: "primary" } });
  if (existing) return existing;
  const generated = webpush.generateVAPIDKeys();
  try {
    return await prisma.pushConfiguration.create({
      data: { id: "primary", publicKey: generated.publicKey, privateKey: generated.privateKey },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return prisma.pushConfiguration.findUniqueOrThrow({ where: { id: "primary" } });
    }
    throw error;
  }
}

export async function webPushPublicKey() {
  return (await vapidKeys()).publicKey;
}

async function configureWebPush() {
  const { publicKey, privateKey } = await vapidKeys();
  if (configuredVapidKey === publicKey) return true;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:notifications@mitratestindonesia.com",
    publicKey,
    privateKey,
  );
  configuredVapidKey = publicKey;
  return true;
}

/**
 * Returns the staff allowed to see activity for a customer: all active Super
 * Admins plus that customer's active referring administrator/employee.
 */
export async function staffRecipientsForCustomer(database: DatabaseClient, customerId: string) {
  const [customer, superAdmins] = await Promise.all([
    database.user.findUnique({
      where: { id: customerId },
      select: { referrerId: true, displayName: true },
    }),
    database.user.findMany({
      where: { role: UserRole.SUPER_ADMIN, isActive: true },
      select: { id: true },
    }),
  ]);

  const recipientIds = new Set(superAdmins.map((user) => user.id));
  if (customer?.referrerId) {
    const referrer = await database.user.findFirst({
      where: {
        id: customer.referrerId,
        isActive: true,
        role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE] },
      },
      select: { id: true },
    });
    if (referrer) recipientIds.add(referrer.id);
  }

  return { recipientIds: [...recipientIds], customerName: customer?.displayName || "A customer" };
}

/** Creates deduplicated inbox rows inside the caller's transaction. */
export async function createNotifications(
  database: DatabaseClient,
  recipientIds: string[],
  input: NotificationInput,
) {
  const uniqueRecipients = [...new Set(recipientIds)];
  if (!uniqueRecipients.length) return [];

  const rows = uniqueRecipients.map((recipientId) => ({
    id: randomUUID(),
    recipientId,
    type: input.type,
    title: input.title,
    body: input.body,
    path: input.path,
    entityType: input.entityType,
    entityId: input.entityId,
    dedupeKey: input.dedupeKey,
  }));
  await database.notification.createMany({ data: rows, skipDuplicates: true });
  const inserted = await database.notification.findMany({
    where: { id: { in: rows.map((row) => row.id) } },
    select: { id: true },
  });
  return inserted.map((notification) => notification.id);
}

function notificationClickPath(path: string, notificationId: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}notificationId=${encodeURIComponent(notificationId)}`;
}

/**
 * Sends Web Push after the business transaction commits. Delivery failures do
 * not undo a submitted top-up/order; expired device endpoints are pruned.
 */
export async function dispatchNotificationIds(notificationIds: string[]) {
  if (!notificationIds.length || !await configureWebPush()) return;
  try {
    const notifications = await prisma.notification.findMany({
      where: { id: { in: notificationIds } },
      include: { recipient: { select: { pushSubscriptions: true } } },
    });

    await Promise.all(notifications.flatMap((notification) =>
      notification.recipient.pushSubscriptions.map(async (subscription) => {
        const payload = JSON.stringify({
          notificationId: notification.id,
          title: notification.title,
          body: notification.body,
          path: notificationClickPath(notification.path, notification.id),
          tag: notification.dedupeKey,
        });
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          }, payload, { TTL: 60 * 60 });
        } catch (error) {
          const statusCode = typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : 0;
          if (statusCode === 404 || statusCode === 410) {
            await prisma.pushSubscription.deleteMany({ where: { id: subscription.id } });
            return;
          }
          console.warn("Web Push delivery failed", { notificationId: notification.id, statusCode });
        }
      }),
    ));
  } catch (error) {
    console.warn("Unable to dispatch Web Push notifications", error);
  }
}
