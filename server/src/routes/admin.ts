import { Router } from "express";
import path from "node:path";
import bcrypt from "bcryptjs";
import { OrderStatus, TransactionStatus, TransactionType, UserLevel, UserRole } from "@prisma/client";
import { z } from "zod";
import { authenticateAdmin, type AuthRequest, requireRole } from "../middleware/auth.js";
import { calculateCommission } from "../lib/commission.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, jsonSafe, requestNumber } from "../lib/http.js";

const router = Router();
const staffRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE];

const catalogProductInputSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only.").transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional().default(""),
  price: z.number().int().positive().max(1_000_000_000_000),
  category: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().max(2000).refine((value) => value.startsWith("https://") || value.startsWith("/assets/"), "Use a secure https:// URL or a local /assets/ path."),
  active: z.boolean(),
});

const catalogBannerInputSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only.").transform((value) => value.toUpperCase()),
  title: z.string().trim().min(2).max(160),
  altText: z.string().trim().min(2).max(240),
  imageUrl: z.string().trim().max(2000).refine((value) => value.startsWith("https://") || value.startsWith("/assets/"), "Use a secure https:// URL or a local /assets/ path."),
  sortOrder: z.number().int().min(0).max(10_000),
  active: z.boolean(),
});

const supportSettingsInputSchema = z.object({
  supportUrl: z.string().trim().url().max(500).refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "t.me" || hostname === "telegram.me";
  }, "Use a valid Telegram t.me link."),
});

const staffRoleSchema = z.enum([UserRole.ADMIN, UserRole.EMPLOYEE]);
const optionalPhoneSchema = z.union([z.string().trim().min(8).max(32), z.literal("")]).optional().transform((value) => value || undefined);
const staffBaseInputSchema = z.object({
  username: z.string().trim().min(3).max(64).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only.").transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(100),
  phone: optionalPhoneSchema,
  role: staffRoleSchema,
  adminCode: z.string().trim().min(4).max(32).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only.").transform((value) => value.toUpperCase()),
  invitationCode: z.string().trim().min(4).max(32).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only.").transform((value) => value.toUpperCase()),
  registrationBonus: z.number().int().min(0).max(1_000_000_000),
});
const createStaffInputSchema = staffBaseInputSchema.extend({ password: z.string().min(8).max(100) });
const updateStaffInputSchema = staffBaseInputSchema.extend({ password: z.union([z.string().min(8).max(100), z.literal("")]).optional() });
const staffSelect = {
  id: true,
  username: true,
  displayName: true,
  phone: true,
  role: true,
  invitationCode: true,
  adminCode: true,
  registrationBonus: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

async function ensureStaffIdentifiersAvailable(input: { username: string; phone?: string; adminCode: string; invitationCode: string }, excludeId?: string) {
  const existing = await prisma.user.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [
        { username: input.username },
        ...(input.phone ? [{ phone: input.phone }] : []),
        { adminCode: input.adminCode },
        { invitationCode: input.invitationCode },
      ],
    },
    select: { username: true, phone: true, adminCode: true, invitationCode: true },
  });
  if (!existing) return;
  if (existing.username === input.username) throw new HttpError(409, "That username is already in use.");
  if (input.phone && existing.phone === input.phone) throw new HttpError(409, "That phone number is already in use.");
  if (existing.adminCode === input.adminCode) throw new HttpError(409, "That admin code is already in use.");
  throw new HttpError(409, "That invitation code is already in use.");
}

router.use(authenticateAdmin, requireRole(...staffRoles));
router.use(asyncHandler(async (request: AuthRequest, _response, next) => {
  const activeStaff = await prisma.user.findFirst({
    where: { id: request.auth!.id, role: { in: staffRoles }, isActive: true },
    select: { id: true },
  });
  if (!activeStaff) throw new HttpError(401, "This administrator account has been deactivated.");
  next();
}));

router.get(
  "/overview",
  asyncHandler(async (request: AuthRequest, response) => {
    const scopedUserIds = request.auth!.role === UserRole.SUPER_ADMIN
      ? undefined
      : (await prisma.user.findMany({ where: { referrerId: request.auth!.id }, select: { id: true } })).map((user) => user.id);
    const userFilter = scopedUserIds ? { id: { in: scopedUserIds } } : { role: UserRole.CUSTOMER };
    const transactionFilter = scopedUserIds ? { userId: { in: scopedUserIds } } : {};
    const orderFilter = scopedUserIds ? { userId: { in: scopedUserIds } } : {};

    const [members, transactions, orders, taskProducts, catalogProducts, catalogBanners, banks, staff, settings] = await Promise.all([
      prisma.user.findMany({ where: userFilter, select: { id: true, username: true, displayName: true, phone: true, balance: true, level: true, totalOrders: true, withdrawalLocked: true, withdrawalRemarks: true, isActive: true, createdAt: true, lastLoginAt: true, referrer: { select: { displayName: true, invitationCode: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.transaction.findMany({ where: transactionFilter, include: { user: { select: { username: true, displayName: true } }, reviewer: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.order.findMany({ where: orderFilter, include: { user: { select: { username: true, displayName: true, balance: true, totalOrders: true, level: true } }, items: true }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.catalogProduct.findMany({ orderBy: [{ price: "asc" }, { name: "asc" }] }),
      prisma.catalogBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      prisma.bank.findMany({ orderBy: { createdAt: "desc" } }),
      request.auth!.role === UserRole.SUPER_ADMIN
        ? prisma.user.findMany({ where: { role: { in: staffRoles } }, select: staffSelect, orderBy: [{ isActive: "desc" }, { createdAt: "asc" }] })
        : Promise.resolve([]),
      prisma.siteSetting.findMany(),
    ]);
    response.json(jsonSafe({ members, transactions, orders, taskProducts, catalogProducts, catalogBanners, banks, staff, settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])) }));
  }),
);

router.patch(
  "/settings/support",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = supportSettingsInputSchema.parse(request.body);
    const setting = await prisma.$transaction(async (database) => {
      const updated = await database.siteSetting.upsert({
        where: { key: "supportUrl" },
        create: { key: "supportUrl", value: input.supportUrl },
        update: { value: input.supportUrl },
      });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "SUPPORT_LINK_UPDATE",
          entityType: "SiteSetting",
          entityId: "supportUrl",
          details: { supportUrl: input.supportUrl },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ setting }));
  }),
);

router.post(
  "/staff",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = createStaffInputSchema.parse(request.body);
    await ensureStaffIdentifiersAvailable(input);
    const passwordHash = await bcrypt.hash(input.password, 12);
    const staff = await prisma.$transaction(async (database) => {
      const created = await database.user.create({
        data: {
          username: input.username,
          displayName: input.displayName,
          phone: input.phone,
          passwordHash,
          role: input.role,
          adminCode: input.adminCode,
          invitationCode: input.invitationCode,
          registrationBonus: BigInt(input.registrationBonus),
          isActive: true,
        },
        select: staffSelect,
      });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "STAFF_CREATED",
          entityType: "User",
          entityId: created.id,
          details: { username: created.username, role: created.role, adminCode: created.adminCode },
        },
      });
      return created;
    });
    response.status(201).json(jsonSafe({ staff }));
  }),
);

router.patch(
  "/staff/:id",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const staffId = String(request.params.id);
    const input = updateStaffInputSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { id: staffId }, select: { id: true, role: true, username: true } });
    if (!existing || !staffRoles.includes(existing.role)) throw new HttpError(404, "Administrator account not found.");
    if (existing.role === UserRole.SUPER_ADMIN) throw new HttpError(403, "The Super Admin account is protected and cannot be edited here.");
    await ensureStaffIdentifiersAvailable(input, staffId);
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : undefined;
    const staff = await prisma.$transaction(async (database) => {
      const updated = await database.user.update({
        where: { id: staffId },
        data: {
          username: input.username,
          displayName: input.displayName,
          phone: input.phone || null,
          role: input.role,
          adminCode: input.adminCode,
          invitationCode: input.invitationCode,
          registrationBonus: BigInt(input.registrationBonus),
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: staffSelect,
      });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "STAFF_UPDATED",
          entityType: "User",
          entityId: updated.id,
          details: { username: updated.username, previousUsername: existing.username, role: updated.role, passwordChanged: Boolean(passwordHash) },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ staff }));
  }),
);

router.patch(
  "/staff/:id/status",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const staffId = String(request.params.id);
    const { active } = z.object({ active: z.boolean() }).parse(request.body);
    const existing = await prisma.user.findUnique({ where: { id: staffId }, select: { id: true, role: true, username: true, isActive: true } });
    if (!existing || !staffRoles.includes(existing.role)) throw new HttpError(404, "Administrator account not found.");
    if (existing.role === UserRole.SUPER_ADMIN) throw new HttpError(403, "The Super Admin account cannot be deactivated.");
    const staff = await prisma.$transaction(async (database) => {
      const updated = await database.user.update({ where: { id: staffId }, data: { isActive: active }, select: staffSelect });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: active ? "STAFF_REACTIVATED" : "STAFF_DEACTIVATED",
          entityType: "User",
          entityId: staffId,
          details: { username: existing.username, previousStatus: existing.isActive },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ staff }));
  }),
);

router.get(
  "/transactions/:id/proof",
  asyncHandler(async (request: AuthRequest, response) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: String(request.params.id) },
      include: { user: { select: { referrerId: true } } },
    });
    if (!transaction?.proofPath) throw new HttpError(404, "Payment proof not found.");
    if (request.auth!.role !== UserRole.SUPER_ADMIN && transaction.user.referrerId !== request.auth!.id) {
      throw new HttpError(403, "This payment proof is outside your member scope.");
    }
    response.sendFile(path.resolve("uploads", transaction.proofPath));
  }),
);

router.post(
  "/transactions/:id/review",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const { status } = z.object({ status: z.enum([TransactionStatus.APPROVED, TransactionStatus.REJECTED]) }).parse(request.body);
    const existing = await prisma.transaction.findUnique({ where: { id: String(request.params.id) } });
    if (!existing || existing.status !== TransactionStatus.PENDING) throw new HttpError(409, "The request was already reviewed or could not be found.");

    const transaction = await prisma.$transaction(async (database) => {
      const reviewed = await database.transaction.updateMany({
        where: { id: existing.id, status: TransactionStatus.PENDING },
        data: { status, reviewerId: request.auth!.id, reviewedAt: new Date(), creditedAt: status === TransactionStatus.APPROVED ? new Date() : undefined },
      });
      if (reviewed.count !== 1) throw new HttpError(409, "The request has already been reviewed.");

      if (status === TransactionStatus.APPROVED && existing.type === TransactionType.TOPUP) {
        await database.user.update({ where: { id: existing.userId }, data: { balance: { increment: existing.amount } } });
      }
      if (status === TransactionStatus.REJECTED && existing.type === TransactionType.WITHDRAWAL && existing.balanceDeductedAt) {
        await database.user.update({ where: { id: existing.userId }, data: { balance: { increment: existing.amount } } });
      }
      await database.auditLog.create({ data: { actorId: request.auth!.id, action: `TRANSACTION_${status}`, entityType: "Transaction", entityId: existing.id, details: { requestNumber: existing.requestNumber, amount: Number(existing.amount) } } });
      return database.transaction.findUnique({ where: { id: existing.id }, include: { user: { select: { username: true, displayName: true } } } });
    });
    response.json(jsonSafe({ transaction }));
  }),
);

router.post(
  "/orders/:id/assign",
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({ items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1).max(99) })).min(1) }).parse(request.body);
    const order = await prisma.order.findUnique({ where: { id: String(request.params.id) }, include: { items: true } });
    if (!order) throw new HttpError(404, "Order not found.");
    if (request.auth!.role !== UserRole.SUPER_ADMIN) {
      const member = await prisma.user.findFirst({ where: { id: order.userId, referrerId: request.auth!.id }, select: { id: true } });
      if (!member) throw new HttpError(403, "This order is outside your member scope.");
    }
    if (order.status !== OrderStatus.WAITING_ASSIGNMENT || order.items.length > 0) throw new HttpError(409, "This order has already been assigned.");
    const products = await prisma.product.findMany({ where: { id: { in: input.items.map((item) => item.productId) }, active: true } });
    if (products.length !== new Set(input.items.map((item) => item.productId)).size) throw new HttpError(400, "One or more products could not be found.");

    const selectedRows = input.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      return { productId: product.id, productCode: product.code, productName: product.name, price: product.price, quantity: item.quantity, total: product.price * BigInt(item.quantity) };
    });
    const totalValue = selectedRows.reduce((sum, row) => sum + row.total, 0n);

    const updated = await prisma.$transaction(async (database) => {
      // Serialize assignments for this member so two different waiting orders
      // cannot be assigned concurrently to the same account.
      await database.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
      const member = await database.user.findUnique({ where: { id: order.userId }, select: { level: true } });
      if (!member) throw new HttpError(404, "Member account not found.");
      const rows = selectedRows.map((row) => ({ ...row, commission: calculateCommission(row.price, member.level) }));
      const commission = rows.reduce((sum, row) => sum + row.commission * BigInt(row.quantity), 0n);
      const activeTask = await database.order.findFirst({
        where: {
          id: { not: order.id },
          userId: order.userId,
          status: { in: [OrderStatus.PRODUCT_ASSIGNED, OrderStatus.WAITING_SHIPMENT, OrderStatus.PENDING_DELIVERY] },
        },
        select: { id: true },
      });
      if (activeTask) throw new HttpError(409, "This member already has an active assigned task. Complete it before assigning another order.");

      const assignment = await database.order.updateMany({
        where: { id: order.id, status: OrderStatus.WAITING_ASSIGNMENT },
        data: { adminId: request.auth!.id, status: OrderStatus.PRODUCT_ASSIGNED, totalValue, commission, requiredBalance: totalValue, assignedAt: new Date(), requiresCustomerApproval: false },
      });
      if (assignment.count !== 1) throw new HttpError(409, "This order has already been assigned.");
      await database.orderItem.createMany({ data: rows.map((row) => ({ ...row, orderId: order.id })) });
      await database.orderEvent.create({ data: { orderId: order.id, actorId: request.auth!.id, fromStatus: OrderStatus.WAITING_ASSIGNMENT, toStatus: OrderStatus.PRODUCT_ASSIGNED, note: "Product assigned by the administrator." } });
      return database.order.findUnique({ where: { id: order.id }, include: { items: true, user: { select: { username: true, displayName: true, level: true } } } });
    });
    response.json(jsonSafe({ order: updated }));
  }),
);

router.post(
  "/members/:id/reward",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({ amount: z.number().int().positive().max(100000000), note: z.string().trim().max(240).optional() }).parse(request.body);
    const result = await prisma.$transaction(async (database) => {
      const user = await database.user.update({ where: { id: String(request.params.id) }, data: { balance: { increment: BigInt(input.amount) } } });
      const transaction = await database.transaction.create({ data: { requestNumber: requestNumber("RW"), userId: user.id, reviewerId: request.auth!.id, type: TransactionType.REWARD, amount: BigInt(input.amount), status: TransactionStatus.APPROVED, senderName: input.note || "Super Admin Bonus", creditedAt: new Date(), reviewedAt: new Date() } });
      return { user, transaction };
    });
    response.json(jsonSafe(result));
  }),
);

router.patch(
  "/members/:id/access",
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({
      level: z.enum(UserLevel),
      active: z.boolean(),
      withdrawalLocked: z.boolean().optional(),
      accountPassword: z.union([z.string().min(8).max(100), z.literal("")]).optional().default(""),
      withdrawalPassword: z.union([z.string().regex(/^\d{6}$/, "Use a 6 digit withdrawal PIN."), z.literal("")]).optional().default(""),
      remarks: z.string().trim().max(500).optional().default(""),
    }).refine(
      (value) => !(value.accountPassword || value.withdrawalPassword) || value.remarks.length >= 3,
      { message: "Add a short remark explaining the password reset.", path: ["remarks"] },
    ).parse(request.body);
    const memberId = String(request.params.id);
    const existing = await prisma.user.findFirst({
      where: {
        id: memberId,
        role: UserRole.CUSTOMER,
        ...(request.auth!.role === UserRole.SUPER_ADMIN ? {} : { referrerId: request.auth!.id }),
      },
      select: { id: true, username: true, level: true, isActive: true, withdrawalLocked: true },
    });
    if (!existing) throw new HttpError(404, "Member account not found.");
    if (request.auth!.role !== UserRole.SUPER_ADMIN && (input.level !== existing.level || input.active !== existing.isActive)) {
      throw new HttpError(403, "Only a Super Admin can change membership level or account access.");
    }

    const accountPasswordHash = input.accountPassword ? await bcrypt.hash(input.accountPassword, 12) : undefined;
    const withdrawalPasswordHash = input.withdrawalPassword ? await bcrypt.hash(input.withdrawalPassword, 12) : undefined;

    const member = await prisma.$transaction(async (database) => {
      const updated = await database.user.update({
        where: { id: memberId },
        data: {
          level: input.level,
          isActive: input.active,
          withdrawalLocked: input.withdrawalLocked ?? existing.withdrawalLocked,
          ...(accountPasswordHash ? { passwordHash: accountPasswordHash } : {}),
          ...(withdrawalPasswordHash ? { withdrawalPasswordHash } : {}),
        },
      });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: accountPasswordHash || withdrawalPasswordHash ? "MEMBER_SECURITY_UPDATED" : "MEMBER_ACCESS_UPDATED",
          entityType: "User",
          entityId: memberId,
          details: {
            username: existing.username,
            previousLevel: existing.level,
            level: input.level,
            previousActive: existing.isActive,
            active: input.active,
            previousWithdrawalLocked: existing.withdrawalLocked,
            withdrawalLocked: input.withdrawalLocked ?? existing.withdrawalLocked,
            accountPasswordReset: Boolean(accountPasswordHash),
            withdrawalPasswordReset: Boolean(withdrawalPasswordHash),
            remarks: input.remarks || null,
          },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ member }));
  }),
);

router.patch(
  "/members/:id/withdrawal-lock",
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({ locked: z.boolean(), remarks: z.string().trim().max(500).optional() }).parse(request.body);
    const memberId = String(request.params.id);
    const existing = await prisma.user.findFirst({
      where: {
        id: memberId,
        role: UserRole.CUSTOMER,
        ...(request.auth!.role === UserRole.SUPER_ADMIN ? {} : { referrerId: request.auth!.id }),
      },
      select: { id: true, username: true, withdrawalLocked: true },
    });
    if (!existing) throw new HttpError(404, "Member account not found.");

    const user = await prisma.$transaction(async (database) => {
      const updated = await database.user.update({ where: { id: memberId }, data: { withdrawalLocked: input.locked, withdrawalRemarks: input.remarks || null } });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: input.locked ? "MEMBER_WITHDRAWALS_CLOSED" : "MEMBER_WITHDRAWALS_OPENED",
          entityType: "User",
          entityId: memberId,
          details: { username: existing.username, previousLocked: existing.withdrawalLocked, locked: input.locked, remarks: input.remarks || null },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ user }));
  }),
);

router.post(
  "/catalog-products",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = catalogProductInputSchema.parse(request.body);
    const product = await prisma.$transaction(async (database) => {
      const created = await database.catalogProduct.create({
        data: {
          ...input,
          description: input.description || null,
          price: BigInt(input.price),
        },
      });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "CATALOG_PRODUCT_CREATED",
          entityType: "CatalogProduct",
          entityId: created.id,
          details: { code: created.code, name: created.name },
        },
      });
      return created;
    });
    response.status(201).json(jsonSafe({ product }));
  }),
);

router.patch(
  "/catalog-products/:id",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = catalogProductInputSchema.parse(request.body);
    const existing = await prisma.catalogProduct.findUnique({ where: { id: String(request.params.id) } });
    if (!existing) throw new HttpError(404, "Catalog product not found.");

    const product = await prisma.$transaction(async (database) => {
      const updated = await database.catalogProduct.update({
        where: { id: existing.id },
        data: {
          ...input,
          description: input.description || null,
          price: BigInt(input.price),
        },
      });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "CATALOG_PRODUCT_UPDATED",
          entityType: "CatalogProduct",
          entityId: updated.id,
          details: { code: updated.code, name: updated.name, previousCode: existing.code },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ product }));
  }),
);

router.delete(
  "/catalog-products/:id",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const existing = await prisma.catalogProduct.findUnique({ where: { id: String(request.params.id) } });
    if (!existing) throw new HttpError(404, "Catalog product not found.");

    await prisma.$transaction(async (database) => {
      await database.catalogProduct.delete({ where: { id: existing.id } });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "CATALOG_PRODUCT_DELETED",
          entityType: "CatalogProduct",
          entityId: existing.id,
          details: { code: existing.code, name: existing.name },
        },
      });
    });
    response.status(204).end();
  }),
);

router.post(
  "/catalog-banners",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = catalogBannerInputSchema.parse(request.body);
    const banner = await prisma.$transaction(async (database) => {
      const created = await database.catalogBanner.create({ data: input });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "CATALOG_BANNER_CREATED",
          entityType: "CatalogBanner",
          entityId: created.id,
          details: { code: created.code, title: created.title },
        },
      });
      return created;
    });
    response.status(201).json(jsonSafe({ banner }));
  }),
);

router.patch(
  "/catalog-banners/:id",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = catalogBannerInputSchema.parse(request.body);
    const existing = await prisma.catalogBanner.findUnique({ where: { id: String(request.params.id) } });
    if (!existing) throw new HttpError(404, "Catalog banner not found.");
    const banner = await prisma.$transaction(async (database) => {
      const updated = await database.catalogBanner.update({ where: { id: existing.id }, data: input });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "CATALOG_BANNER_UPDATED",
          entityType: "CatalogBanner",
          entityId: updated.id,
          details: { code: updated.code, title: updated.title, previousCode: existing.code },
        },
      });
      return updated;
    });
    response.json(jsonSafe({ banner }));
  }),
);

router.delete(
  "/catalog-banners/:id",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request: AuthRequest, response) => {
    const existing = await prisma.catalogBanner.findUnique({ where: { id: String(request.params.id) } });
    if (!existing) throw new HttpError(404, "Catalog banner not found.");
    await prisma.$transaction(async (database) => {
      await database.catalogBanner.delete({ where: { id: existing.id } });
      await database.auditLog.create({
        data: {
          actorId: request.auth!.id,
          action: "CATALOG_BANNER_DELETED",
          entityType: "CatalogBanner",
          entityId: existing.id,
          details: { code: existing.code, title: existing.title },
        },
      });
    });
    response.status(204).end();
  }),
);

export default router;
