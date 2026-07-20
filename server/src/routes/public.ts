import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, jsonSafe } from "../lib/http.js";

const router = Router();

router.get(
  "/bootstrap",
  asyncHandler(async (_request, response) => {
    const [products, banks, settings] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { createdAt: "desc" }] }),
      prisma.bank.findMany({ where: { active: true }, orderBy: { bankName: "asc" } }),
      prisma.siteSetting.findMany(),
    ]);
    response.json(
      jsonSafe({
        products,
        banks,
        settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
      }),
    );
  }),
);

export default router;
