import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { StockStatus } from "@/generated/prisma/enums";
import { slugify } from "@/lib/slugify";
import { computeOurPrice } from "@/lib/pricing";
import { downloadProductImages } from "./images";
import type { ImportStats, NormalizedOffer } from "./types";

type SupplierRow = {
  id: string;
  name: string;
  markupPercent: Prisma.Decimal;
};

// Category tree resolution is cached per import run (categoryPath -> our
// Category.id), so a path shared by many offers is only upserted once.
async function resolveCategoryId(
  prisma: PrismaClient,
  categoryPath: string[] | null,
  cache: Map<string, string>,
): Promise<string | null> {
  if (!categoryPath || categoryPath.length === 0) return null;

  const cacheKey = categoryPath.join(">");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let parentId: string | null = null;
  let currentId: string | null = null;
  let pathSoFar = "";

  for (const name of categoryPath) {
    pathSoFar = pathSoFar ? `${pathSoFar}>${name}` : name;
    const pathCached = cache.get(pathSoFar);
    if (pathCached) {
      currentId = pathCached;
      parentId = pathCached;
      continue;
    }

    const slug = slugify(name) || slugify(`category-${pathSoFar}`);
    const category: { id: string } = await prisma.category.upsert({
      where: { slug },
      create: { slug, name, parentId },
      update: { name, parentId: parentId ?? undefined },
      select: { id: true },
    });

    cache.set(pathSoFar, category.id);
    currentId = category.id;
    parentId = category.id;
  }

  return currentId;
}

async function resolveBrandId(
  prisma: PrismaClient,
  vendor: string | null,
  cache: Map<string, string>,
): Promise<string | null> {
  if (!vendor) return null;
  const cached = cache.get(vendor);
  if (cached) return cached;

  const slug = slugify(vendor);
  const brand = await prisma.brand.upsert({
    where: { slug },
    create: { slug, name: vendor },
    update: { name: vendor },
    select: { id: true },
  });

  cache.set(vendor, brand.id);
  return brand.id;
}

function isValid(offer: NormalizedOffer): boolean {
  return (
    !!offer.sku &&
    !!offer.name &&
    !!offer.decorType &&
    offer.purchasePrice > 0
  );
}

export async function upsertOffers(
  prisma: PrismaClient,
  supplier: SupplierRow,
  offers: NormalizedOffer[],
  options: { downloadImages: boolean },
): Promise<ImportStats> {
  const stats: ImportStats = {
    supplierName: supplier.name,
    created: 0,
    updated: 0,
    wentOutOfStock: 0,
    priceChangedOver10Percent: 0,
    belowRrc: 0,
    skippedInvalid: 0,
    totalInFeed: offers.length,
  };

  const categoryCache = new Map<string, string>();
  const brandCache = new Map<string, string>();
  const seenSkus = new Set<string>();

  for (const offer of offers) {
    if (!isValid(offer)) {
      stats.skippedInvalid += 1;
      continue;
    }

    seenSkus.add(offer.sku);

    const categoryId = await resolveCategoryId(prisma, offer.categoryPath, categoryCache);
    const brandId = await resolveBrandId(prisma, offer.vendor, brandCache);
    if (!categoryId || !brandId) {
      // Without a resolvable category or brand we can't satisfy the
      // required relations — skip rather than invent placeholders.
      stats.skippedInvalid += 1;
      continue;
    }

    const { ourPrice, belowRrcFlag } = computeOurPrice({
      purchasePrice: offer.purchasePrice,
      markupPercent: supplier.markupPercent,
      rrcPrice: offer.rrcPrice,
    });
    if (belowRrcFlag) stats.belowRrc += 1;

    const stockStatus = !offer.available
      ? StockStatus.out_of_stock
      : (offer.stockQty ?? 1) > 0
        ? StockStatus.in_stock
        : StockStatus.on_order;

    const existing = await prisma.product.findUnique({
      where: { sku: offer.sku },
      select: { id: true, ourPrice: true, images: true, priceOverridden: true },
    });

    const images =
      options.downloadImages && offer.imageUrls.length > 0
        ? await downloadProductImages(offer.sku, offer.imageUrls)
        : (existing?.images ?? []);

    const data = {
      name: offer.name,
      collectionId: null,
      brandId,
      categoryId,
      decorName: offer.decorName,
      decorType: offer.decorType!,
      lengthMm: offer.lengthMm ?? 0,
      widthMm: offer.widthMm ?? 0,
      thicknessMm: new Prisma.Decimal(offer.thicknessMm ?? 0),
      wearLayerMm: offer.wearLayerMm != null ? new Prisma.Decimal(offer.wearLayerMm) : null,
      wearClass: offer.wearClass,
      m2PerPack: new Prisma.Decimal(offer.m2PerPack ?? 0),
      packsPerPallet: offer.packsPerPallet,
      weightKg: offer.weightKg != null ? new Prisma.Decimal(offer.weightKg) : null,
      waterproof: offer.waterproof,
      warmFloorCompatible: offer.warmFloorCompatible,
      purchasePrice: new Prisma.Decimal(offer.purchasePrice),
      rrcPrice: offer.rrcPrice != null ? new Prisma.Decimal(offer.rrcPrice) : null,
      ourPrice,
      belowRrcFlag,
      oldPrice: offer.oldPrice != null ? new Prisma.Decimal(offer.oldPrice) : null,
      stockQty: offer.stockQty ?? 0,
      stockStatus,
      supplierId: supplier.id,
      images,
    };

    if (existing) {
      if (
        existing.ourPrice.gt(0) &&
        ourPrice.sub(existing.ourPrice).abs().div(existing.ourPrice).gt(0.1)
      ) {
        stats.priceChangedOver10Percent += 1;
      }

      // An admin-overridden price (SPEC.md §8) survives re-imports — the
      // feed's purchasePrice/rrcPrice above still stay current, but the
      // derived ourPrice/belowRrcFlag are left untouched.
      const updateData = existing.priceOverridden
        ? { ...data, ourPrice: undefined, belowRrcFlag: undefined }
        : data;

      await prisma.product.update({ where: { id: existing.id }, data: updateData });
      stats.updated += 1;
    } else {
      const slug = await uniqueProductSlug(prisma, offer.name, offer.sku);
      await prisma.product.create({
        data: { ...data, sku: offer.sku, slug, isPublished: false },
      });
      stats.created += 1;
    }
  }

  // Anything published previously but missing from this feed run goes out
  // of stock — the URL stays alive (SPEC.md §4/§6), it's just not sellable.
  const missing = await prisma.product.updateMany({
    where: {
      supplierId: supplier.id,
      sku: { notIn: Array.from(seenSkus) },
      stockStatus: { not: StockStatus.out_of_stock },
    },
    data: { stockStatus: StockStatus.out_of_stock, stockQty: 0 },
  });
  stats.wentOutOfStock = missing.count;

  return stats;
}

async function uniqueProductSlug(
  prisma: PrismaClient,
  name: string,
  sku: string,
): Promise<string> {
  const base = slugify(name) || slugify(sku);
  const existing = await prisma.product.findUnique({ where: { slug: base }, select: { id: true } });
  return existing ? `${base}-${slugify(sku)}` : base;
}
