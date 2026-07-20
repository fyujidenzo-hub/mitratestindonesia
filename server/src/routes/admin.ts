import { Router } from "express";
import path from "node:path";
import { OrderStatus, TransactionStatus, TransactionType, UserRole } from "@prisma/client";
import { z } from "zod";
import { authenticateAdmin, type AuthRequest, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, jsonSafe, requestNumber } from "../lib/http.js";

const router = Router();
const staffRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EMPLOYEE];

const catalogProductInputSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only.").transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(5000).optional().default(""),
  price: z.number().int().positive().max(1_000_000_000_000),
  category: z.string().trim().min(2).max(80),
  imageUrl: z.string().trim().url().max(2000).refine((value) => value.startsWith("https://"), "Use a secure https:// image URL."),
  active: z.boolean(),
});

router.use(authenticateAdmin, requireRole(...staffRoles));

router.get(
  "/overview",
  asyncHandler(async (request: AuthRequest, response) => {
    const scopedUserIds = request.auth!.role === UserRole.SUPER_ADMIN
      ? undefined
      : (await prisma.user.findMany({ where: { referrerId: request.auth!.id }, select: { id: true } })).map((user) => user.id);
    const userFilter = scopedUserIds ? { id: { in: scopedUserIds } } : { role: UserRole.CUSTOMER };
    const transactionFilter = scopedUserIds ? { userId: { in: scopedUserIds } } : {};
    const orderFilter = scopedUserIds ? { userId: { in: scopedUserIds } } : {};

    const [members, transactions, orders, taskProducts, catalogProducts, banks, staff] = await Promise.all([
      prisma.user.findMany({ where: userFilter, select: { id: true, username: true, displayName: true, phone: true, balance: true, level: true, totalOrders: true, withdrawalLocked: true, withdrawalRemarks: true, createdAt: true, referrer: { select: { displayName: true } } }, orderBy: { createdAt: "desc" } }),
      prisma.transaction.findMany({ where: transactionFilter, include: { user: { select: { username: true, displayName: true } }, reviewer: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.order.findMany({ where: orderFilter, include: { user: { select: { username: true, displayName: true, balance: true } }, items: true }, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.catalogProduct.findMany({ orderBy: [{ price: "asc" }, { name: "asc" }] }),
      prisma.bank.findMany({ orderBy: { createdAt: "desc" } }),
      request.auth!.role === UserRole.SUPER_ADMIN
        ? prisma.user.findMany({ where: { role: { in: staffRoles } }, select: { id: true, username: true, displayName: true, role: true, invitationCode: true, adminCode: true, registrationBonus: true, isActive: true } })
        : Promise.resolve([]),
    ]);
    response.json(jsonSafe({ members, transactions, orders, taskProducts, catalogProducts, banks, staff }));
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
    if (order.status !== OrderStatus.WAITING_ASSIGNMENT && order.status !== OrderStatus.PRODUCT_ASSIGNED) throw new HttpError(409, "This order cannot be assigned right now.");
    const products = await prisma.product.findMany({ where: { id: { in: input.items.map((item) => item.productId) }, active: true } });
    if (products.length !== new Set(input.items.map((item) => item.productId)).size) throw new HttpError(400, "One or more products could not be found.");

    const rows = input.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      return { productId: product.id, productCode: product.code, productName: product.name, price: product.price, commission: product.commission, quantity: item.quantity, total: product.price * BigInt(item.quantity) };
    });
    const totalValue = rows.reduce((sum, row) => sum + row.total, 0n);
    const commission = rows.reduce((sum, row) => sum + row.commission * BigInt(row.quantity), 0n);
    const currentSelection = order.items.map((item) => `${item.productId}:${item.quantity}`).sort().join("|");
    const nextSelection = input.items.map((item) => `${item.productId}:${item.quantity}`).sort().join("|");
    const changingSelection = order.items.length > 0 && currentSelection !== nextSelection;

    const updated = await prisma.$transaction(async (database) => {
      await database.orderItem.deleteMany({ where: { orderId: order.id } });
      await database.orderItem.createMany({ data: rows.map((row) => ({ ...row, orderId: order.id })) });
      await database.order.update({ where: { id: order.id }, data: { adminId: request.auth!.id, status: OrderStatus.PRODUCT_ASSIGNED, totalValue, commission, requiredBalance: totalValue, assignedAt: new Date(), requiresCustomerApproval: changingSelection } });
      await database.orderEvent.create({ data: { orderId: order.id, actorId: request.auth!.id, fromStatus: order.status, toStatus: OrderStatus.PRODUCT_ASSIGNED, note: changingSelection ? "The administrator changed the product selection; customer approval is required." : "Product assigned by the administrator." } });
      return database.order.findUnique({ where: { id: order.id }, include: { items: true, user: { select: { username: true, displayName: true } } } });
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
  "/members/:id/withdrawal-lock",
  requireRole(UserRole.SUPER_ADMIN),
  asyncHandler(async (request, response) => {
    const input = z.object({ locked: z.boolean(), remarks: z.string().trim().max(500).optional() }).parse(request.body);
    const user = await prisma.user.update({ where: { id: String(request.params.id) }, data: { withdrawalLocked: input.locked, withdrawalRemarks: input.remarks || null } });
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

export default router;
