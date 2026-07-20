import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, jsonSafe } from "../lib/http.js";

const router = Router();

router.get(
  "/bootstrap",
  asyncHandler(async (_request, response) => {
    const [catalogProducts, banks, settings] = await Promise.all([
      prisma.catalogProduct.findMany({ where: { active: true }, orderBy: [{ price: "asc" }, { name: "asc" }] }),
      prisma.bank.findMany({ where: { active: true }, orderBy: { bankName: "asc" } }),
      prisma.siteSetting.findMany(),
    ]);
    response.json(
      jsonSafe({
        catalogProducts,
        banks,
        settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
      }),
    );
  }),
);

export default router;
