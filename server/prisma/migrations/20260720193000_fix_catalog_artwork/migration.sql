-- Replace a retired remote image with bundled artwork so the gallery remains visual.
UPDATE "CatalogProduct"
SET "imageUrl" = '/assets/catalog-banners/08-belanja-instant-enhanced.jpg',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'SHP-FOD-06';
