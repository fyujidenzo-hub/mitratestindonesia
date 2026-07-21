import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import multer from "multer";
import path from "node:path";
import { z } from "zod";
import { OrderStatus, TransactionStatus, TransactionType, UserRole } from "@prisma/client";
import { authenticateCustomer, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError, jsonSafe, requestNumber } from "../lib/http.js";

const router = Router();
const activeStatuses = [OrderStatus.WAITING_ASSIGNMENT, OrderStatus.PRODUCT_ASSIGNED, OrderStatus.WAITING_SHIPMENT, OrderStatus.PENDING_DELIVERY];
const securityLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
const taskRewardMilestones = new Map<number, bigint>([
  [5, 25_000n],
  [7, 50_000n],
  [10, 75_000n],
  [12, 150_000n],
  [15, 200_000n],
]);

function ordinal(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return `${value}th`;
  return `${value}${value % 10 === 1 ? "st" : value % 10 === 2 ? "nd" : value % 10 === 3 ? "rd" : "th"}`;
}

router.use(authenticateCustomer);
router.use(asyncHandler(async (request: AuthRequest, _response, next) => {
  const activeCustomer = await prisma.user.findFirst({ where: { id: request.auth!.id, role: UserRole.CUSTOMER, isActive: true }, select: { id: true } });
  if (!activeCustomer) throw new HttpError(401, "This member account has been deactivated.");
  next();
}));

const upload = multer({
  storage: multer.diskStorage({
    destination: path.resolve("uploads"),
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname).replace(/[^.a-zA-Z0-9]/g, "").slice(0, 8) || ".jpg";
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => callback(null, file.mimetype.startsWith("image/")),
});

router.get(
  "/overview",
  asyncHandler(async (request: AuthRequest, response) => {
    const [user, transactions, orders] = await Promise.all([
      prisma.user.findUnique({ where: { id: request.auth!.id }, include: { referrer: { select: { displayName: true } } } }),
      prisma.transaction.findMany({ where: { userId: request.auth!.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.order.findMany({
        where: { userId: request.auth!.id },
        include: {
          items: { include: { product: { select: { imageUrl: true } } } },
          events: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    if (!user) throw new HttpError(404, "Account not found.");
    const { passwordHash: _passwordHash, withdrawalPasswordHash: _withdrawalPasswordHash, ...safeUser } = user;
    response.json(jsonSafe({ user: safeUser, transactions, orders }));
  }),
);

router.patch(
  "/security/password",
  securityLimiter,
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({
      currentPassword: z.string().min(4).max(100),
      newPassword: z.string().min(8).max(100),
    }).parse(request.body);
    const user = await prisma.user.findFirst({ where: { id: request.auth!.id, role: UserRole.CUSTOMER, isActive: true }, select: { id: true, passwordHash: true } });
    if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new HttpError(400, "The current account password is incorrect.");
    }
    if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
      throw new HttpError(400, "Choose a new password that is different from your current password.");
    }
    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      prisma.auditLog.create({ data: { actorId: user.id, action: "ACCOUNT_PASSWORD_RESET", entityType: "User", entityId: user.id } }),
    ]);
    response.status(204).end();
  }),
);

router.patch(
  "/security/withdrawal-password",
  securityLimiter,
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({
      accountPassword: z.string().min(4).max(100),
      newWithdrawalPassword: z.string().regex(/^\d{6}$/, "Use a 6 digit withdrawal PIN."),
    }).parse(request.body);
    const user = await prisma.user.findFirst({ where: { id: request.auth!.id, role: UserRole.CUSTOMER, isActive: true }, select: { id: true, passwordHash: true, withdrawalPasswordHash: true } });
    if (!user || !(await bcrypt.compare(input.accountPassword, user.passwordHash))) {
      throw new HttpError(400, "The account password is incorrect.");
    }
    if (user.withdrawalPasswordHash && await bcrypt.compare(input.newWithdrawalPassword, user.withdrawalPasswordHash)) {
      throw new HttpError(400, "Choose a withdrawal PIN that is different from your current PIN.");
    }
    const withdrawalPasswordHash = await bcrypt.hash(input.newWithdrawalPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { withdrawalPasswordHash } }),
      prisma.auditLog.create({ data: { actorId: user.id, action: "WITHDRAWAL_PASSWORD_RESET", entityType: "User", entityId: user.id } }),
    ]);
    response.status(204).end();
  }),
);

router.post(
  "/topups",
  upload.single("proof"),
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({ amount: z.coerce.number().int().min(10000).max(100000000), senderName: z.string().trim().min(2).max(120) }).parse(request.body);
    if (!request.file) throw new HttpError(400, "A payment proof image is required.");
    const transaction = await prisma.transaction.create({
      data: {
        requestNumber: requestNumber("TU"),
        userId: request.auth!.id,
        type: TransactionType.TOPUP,
        amount: BigInt(input.amount),
        senderName: input.senderName,
        proofPath: request.file.filename,
        proofOriginalName: request.file.originalname,
      },
    });
    response.status(201).json(jsonSafe({ transaction }));
  }),
);

router.post(
  "/withdrawals",
  asyncHandler(async (request: AuthRequest, response) => {
    const input = z.object({
      amount: z.number().int().min(100000),
      bankName: z.string().trim().min(2).max(100),
      accountName: z.string().trim().min(2).max(120),
      accountNumber: z.string().trim().min(4).max(80),
      withdrawalPassword: z.string().min(4).max(32),
    }).parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: request.auth!.id } });
    if (!user || !user.withdrawalPasswordHash) throw new HttpError(400, "A withdrawal PIN has not been configured.");
    if (!(await bcrypt.compare(input.withdrawalPassword, user.withdrawalPasswordHash))) throw new HttpError(400, "The withdrawal PIN is incorrect.");
    if (user.withdrawalLocked) throw new HttpError(400, user.withdrawalRemarks || "Withdrawals are locked for this account.");

    const activeTask = await prisma.order.count({ where: { userId: user.id, status: { in: activeStatuses } } });
    if (activeTask) throw new HttpError(400, "Complete your active task before requesting a withdrawal.");

    const transaction = await prisma.$transaction(async (database) => {
      const debit = await database.user.updateMany({
        where: { id: user.id, balance: { gte: BigInt(input.amount) }, withdrawalLocked: false },
        data: { balance: { decrement: BigInt(input.amount) } },
      });
      if (debit.count !== 1) throw new HttpError(400, "Insufficient balance.");
      return database.transaction.create({
        data: {
          requestNumber: requestNumber("WD"),
          userId: user.id,
          type: TransactionType.WITHDRAWAL,
          amount: BigInt(input.amount),
          status: TransactionStatus.PENDING,
          withdrawalBankName: input.bankName,
          withdrawalAccountName: input.accountName,
          withdrawalAccountNumber: input.accountNumber,
          balanceDeductedAt: new Date(),
        },
      });
    });
    response.status(201).json(jsonSafe({ transaction }));
  }),
);

router.post(
  "/orders",
  asyncHandler(async (request: AuthRequest, response) => {
    z.object({}).strict().parse(request.body ?? {});
    const activeOrder = await prisma.order.findFirst({ where: { userId: request.auth!.id, status: { in: activeStatuses } } });
    if (activeOrder) throw new HttpError(409, "You still have an active task.");

    const order = await prisma.order.create({
      data: {
        referenceNumber: requestNumber("PSN"),
        userId: request.auth!.id,
        status: OrderStatus.WAITING_ASSIGNMENT,
        totalValue: 0n,
        commission: 0n,
        requiredBalance: 0n,
        events: { create: [{ actorId: request.auth!.id, toStatus: OrderStatus.WAITING_ASSIGNMENT, note: "Task accepted by the customer." }] },
      },
      include: { items: true, events: true },
    });
    response.status(201).json(jsonSafe({ order }));
  }),
);

router.post(
  "/orders/:id/action",
  asyncHandler(async (request: AuthRequest, response) => {
    z.object({ action: z.literal("accept") }).parse(request.body);
    const order = await prisma.order.findFirst({ where: { id: String(request.params.id), userId: request.auth!.id }, include: { items: true } });
    if (!order) throw new HttpError(404, "Order not found.");
    const completableStatuses: OrderStatus[] = [OrderStatus.PRODUCT_ASSIGNED, OrderStatus.WAITING_SHIPMENT, OrderStatus.PENDING_DELIVERY];
    if (!completableStatuses.includes(order.status)) throw new HttpError(409, "The order is not ready to be accepted.");

    const updated = await prisma.$transaction(async (database) => {
      const completion = await database.order.updateMany({
        where: { id: order.id, userId: request.auth!.id, status: { in: completableStatuses }, commissionCreditedAt: null },
        data: { status: OrderStatus.DELIVERED, requiresCustomerApproval: false, completedAt: new Date(), commissionCreditedAt: new Date() },
      });
      if (completion.count !== 1) throw new HttpError(409, "The commission for this order has already been credited.");
      const completedUser = await database.user.update({
        where: { id: request.auth!.id },
        data: { balance: { increment: order.commission }, totalOrders: { increment: 1 } },
        select: { totalOrders: true },
      });
      const rewardAmount = taskRewardMilestones.get(completedUser.totalOrders) ?? 0n;
      if (rewardAmount > 0n) {
        await database.user.update({ where: { id: request.auth!.id }, data: { balance: { increment: rewardAmount } } });
        await database.transaction.create({
          data: {
            requestNumber: requestNumber("TR"),
            userId: request.auth!.id,
            type: TransactionType.REWARD,
            amount: rewardAmount,
            status: TransactionStatus.APPROVED,
            senderName: `Bonus Reward for Completing the ${ordinal(completedUser.totalOrders)} Task`,
            creditedAt: new Date(),
            reviewedAt: new Date(),
          },
        });
      }
      await database.orderEvent.create({ data: { orderId: order.id, actorId: request.auth!.id, fromStatus: order.status, toStatus: OrderStatus.DELIVERED, note: "Product accepted; task completed and commission credited." } });
      const completedOrder = await database.order.findUnique({ where: { id: order.id }, include: { items: true, events: true } });
      return {
        order: completedOrder,
        completedTasks: completedUser.totalOrders,
        milestoneReward: rewardAmount > 0n ? { task: completedUser.totalOrders, amount: rewardAmount } : null,
      };
    });
    response.json(jsonSafe(updated));
  }),
);

export default router;
