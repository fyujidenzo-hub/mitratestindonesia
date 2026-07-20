-- Create a display-only catalog that has no relation to task Product or OrderItem.
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "description" TEXT,
    "price" BIGINT NOT NULL,
    "category" VARCHAR(80) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogProduct_code_key" ON "CatalogProduct"("code");
CREATE INDEX "CatalogProduct_category_active_idx" ON "CatalogProduct"("category", "active");
CREATE INDEX "CatalogProduct_active_price_idx" ON "CatalogProduct"("active", "price");

-- Preserve the current visible catalog as initial display data. Prefixing ids
-- makes the display-only boundary explicit even if an id reaches the wrong API.
INSERT INTO "CatalogProduct" (
    "id", "code", "name", "description", "price", "category", "imageUrl",
    "active", "createdAt", "updatedAt"
)
SELECT
    'catalog_' || "id", "code", "name", "description", "price", "category", "imageUrl",
    "active", "createdAt", "updatedAt"
FROM "Product";
