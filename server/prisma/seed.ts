import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [adminPassword, customerPassword, withdrawalPassword] = await Promise.all([
    bcrypt.hash("Admin123!", 12),
    bcrypt.hash("Customer123!", 12),
    bcrypt.hash("123456", 12),
  ]);

  const superAdmin = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      displayName: "Super Admin",
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMIN,
      invitationCode: "900001",
      adminCode: "000001",
      registrationBonus: 150000n,
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: "admin.shopee" },
    update: {},
    create: {
      username: "admin.shopee",
      displayName: "Admin Shopee 1",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      invitationCode: "991888",
      adminCode: "001888",
      registrationBonus: 100000n,
    },
  });

  await prisma.user.upsert({
    where: { username: "demo.customer" },
    update: {},
    create: {
      username: "demo.customer",
      displayName: "Alya Putri",
      phone: "081234567890",
      passwordHash: customerPassword,
      withdrawalPasswordHash: withdrawalPassword,
      role: UserRole.CUSTOMER,
      balance: 350000n,
      referrerId: admin.id,
    },
  });

  const products = [
    { code: "SHP-LAP-01", name: "Laptop Gaming ROG 15", price: 7457500n, commission: 372875n, requiredBalance: 0n, quantity: 25, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80" },
    { code: "SHP-PHN-02", name: "Smartphone Pro 5G 256GB", price: 4899000n, commission: 244950n, requiredBalance: 0n, quantity: 60, category: "Electronics", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80" },
    { code: "SHP-HME-03", name: "Smart Home Essential Set", price: 1299000n, commission: 129900n, requiredBalance: 0n, quantity: 80, category: "Home", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80" },
    { code: "SHP-FSN-04", name: "Daily Fashion Bundle", price: 329000n, commission: 49350n, requiredBalance: 0n, quantity: 120, category: "Fashion", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80" },
    { code: "SHP-BTY-05", name: "Skincare Glow Collection", price: 489000n, commission: 73350n, requiredBalance: 0n, quantity: 90, category: "Beauty", imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80" },
    { code: "SHP-FOD-06", name: "Indonesian Snack Box", price: 189000n, commission: 28350n, requiredBalance: 0n, quantity: 150, category: "Food", imageUrl: "https://images.unsplash.com/photo-1621939514649-280e2aa9454f?auto=format&fit=crop&w=900&q=80" },
  ];

  for (const product of products) {
    await prisma.product.upsert({ where: { code: product.code }, update: product, create: product });
    const catalogProduct = {
      code: product.code,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      active: true,
    };
    await prisma.catalogProduct.upsert({ where: { code: product.code }, update: {}, create: catalogProduct });
  }

  if ((await prisma.bank.count()) === 0) {
    await prisma.bank.createMany({
      data: [
        { bankName: "BCA", accountName: "Shopee Work Indonesia", accountNumber: "881044552100", minimumDeposit: 100000n, active: true },
        { bankName: "Mandiri", accountName: "Shopee Work Indonesia", accountNumber: "133099004432", minimumDeposit: 100000n, active: true },
      ],
    });
  }

  const settings = {
    siteName: "Shopee Work Indonesia",
    supportUrl: "https://t.me/shopee_support",
    campaignTitle: "9.9 Super Shopping Day",
    campaignSubtitle: "Up to 90% off & free shipping",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  console.log(`Seed complete. Super admin: ${superAdmin.username} / Admin123!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
