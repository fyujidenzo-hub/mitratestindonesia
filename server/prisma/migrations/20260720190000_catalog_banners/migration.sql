-- Store customer carousel artwork independently from catalog and task records.
CREATE TABLE "CatalogBanner" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "altText" VARCHAR(240) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogBanner_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogBanner_code_key" ON "CatalogBanner"("code");
CREATE INDEX "CatalogBanner_active_sortOrder_idx" ON "CatalogBanner"("active", "sortOrder");

INSERT INTO "CatalogBanner" (
    "id", "code", "title", "altText", "imageUrl", "sortOrder", "active", "createdAt", "updatedAt"
) VALUES
    ('banner-001', 'BANNER-001', 'Say It With Love', 'Shopee Say It With Love promotion', '/assets/catalog-banners/09-say-it-with-love-enhanced.jpg', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-002', 'BANNER-002', 'SPayLater', 'Shopee SPayLater installment promotion', '/assets/catalog-banners/10-spaylater-enhanced.jpg', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-003', 'BANNER-003', 'SPinjam Fest', 'Shopee SPinjam Fest promotion', '/assets/catalog-banners/11-spinjam-fest-enhanced.jpg', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-004', 'BANNER-004', 'Hisense Super Brand Day', 'Hisense Super Brand Day promotion', '/assets/catalog-banners/01-hisense-enhanced.jpg', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-005', 'BANNER-005', 'Baseus Brand Day', 'Baseus Brand Day promotion', '/assets/catalog-banners/02-baseus-enhanced.jpg', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-006', 'BANNER-006', 'Puma Super Brand Day', 'Puma Super Brand Day promotion', '/assets/catalog-banners/03-puma-enhanced.jpg', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-007', 'BANNER-007', 'Beauty Brand Day', 'Olay, Pantene, and Downy Brand Day promotion', '/assets/catalog-banners/04-olay-pantene-downy-enhanced.jpg', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-008', 'BANNER-008', 'Great Mid-Year Sale', 'Shopee 7.7 Great Mid-Year Sale promotion in orange', '/assets/catalog-banners/05-sale-orange-enhanced.jpg', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-009', 'BANNER-009', 'Midnight Sale', 'Shopee 7.7 Great Mid-Year Sale promotion in blue', '/assets/catalog-banners/06-sale-blue-enhanced.jpg', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-010', 'BANNER-010', 'Adidas Super Brand Day', 'Adidas Super Brand Day promotion', '/assets/catalog-banners/07-adidas-enhanced.jpg', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('banner-011', 'BANNER-011', 'Belanja Instant', 'Shopee instant shopping promotion', '/assets/catalog-banners/08-belanja-instant-enhanced.jpg', 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
