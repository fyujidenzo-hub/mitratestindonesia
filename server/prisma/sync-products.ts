import "dotenv/config";
import { PrismaClient, UserLevel } from "@prisma/client";
import { calculateCommission } from "../src/lib/commission.js";

const prisma = new PrismaClient();

function catalogProductToTaskProductData(catalogProduct: {
  code: string;
  name: string;
  description: string | null;
  price: bigint;
  category: string;
  imageUrl: string;
  active: boolean;
}) {
  return {
    code: catalogProduct.code,
    name: catalogProduct.name,
    description: catalogProduct.description,
    price: catalogProduct.price,
    commission: calculateCommission(catalogProduct.price, UserLevel.STARTER),
    requiredBalance: catalogProduct.price,
    category: catalogProduct.category,
    imageUrl: catalogProduct.imageUrl,
    active: catalogProduct.active,
  };
}

async function main() {
  const catalogProducts = await prisma.catalogProduct.findMany({
    orderBy: { createdAt: "asc" },
  });

  for (const catalogProduct of catalogProducts) {
    const taskProductData = catalogProductToTaskProductData(catalogProduct);
    await prisma.product.upsert({
      where: { code: catalogProduct.code },
      // Deliberately omit quantity: a repeat run must never overwrite stock.
      update: taskProductData,
      create: { ...taskProductData, quantity: 100 },
    });
  }

  console.log(`Synchronized ${catalogProducts.length} catalog product${catalogProducts.length === 1 ? "" : "s"} into task products.`);
}

main()
  .catch((error) => {
    console.error("Catalog product synchronization failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
