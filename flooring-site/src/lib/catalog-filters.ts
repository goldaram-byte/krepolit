import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { DecorType, InstallType } from "@/generated/prisma/enums";

export type SortOption = "price_asc" | "price_desc" | "new";

export type CatalogSearchParams = {
  brand?: string;
  thickness?: string;
  wearLayer?: string;
  wearClass?: string;
  decorType?: string;
  installType?: string;
  waterproof?: string;
  warmFloor?: string;
  priceMin?: string;
  priceMax?: string;
  inStock?: string;
  sort?: string;
  page?: string;
};

const isDecorType = (value: string): value is DecorType =>
  (Object.values(DecorType) as string[]).includes(value);

const isInstallType = (value: string): value is InstallType =>
  (Object.values(InstallType) as string[]).includes(value);

export function buildProductWhere(
  categoryId: string,
  params: CatalogSearchParams,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    categoryId,
    isPublished: true,
  };

  if (params.brand) where.brand = { slug: params.brand };
  if (params.thickness) where.thicknessMm = new Prisma.Decimal(params.thickness);
  if (params.wearLayer) where.wearLayerMm = new Prisma.Decimal(params.wearLayer);
  if (params.wearClass) where.wearClass = params.wearClass;
  if (params.decorType && isDecorType(params.decorType)) where.decorType = params.decorType;
  if (params.installType && isInstallType(params.installType)) {
    where.collection = { installType: params.installType };
  }
  if (params.waterproof === "1") where.waterproof = true;
  if (params.warmFloor === "1") where.warmFloorCompatible = true;
  if (params.inStock === "1") where.stockStatus = "in_stock";

  const priceMin = params.priceMin ? Number.parseFloat(params.priceMin) : null;
  const priceMax = params.priceMax ? Number.parseFloat(params.priceMax) : null;
  if (priceMin != null || priceMax != null) {
    where.ourPrice = {
      ...(priceMin != null ? { gte: priceMin } : {}),
      ...(priceMax != null ? { lte: priceMax } : {}),
    };
  }

  return where;
}

export function buildOrderBy(sort: string | undefined): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { ourPrice: "asc" };
    case "price_desc":
      return { ourPrice: "desc" };
    case "new":
    default:
      return { createdAt: "desc" };
  }
}

export const PAGE_SIZE = 24;

export function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export type CategoryFacets = {
  brands: { slug: string; name: string }[];
  thicknesses: number[];
  wearClasses: string[];
  decorTypes: DecorType[];
  priceRange: { min: number; max: number } | null;
};

// Only offer filter options that actually occur among this category's
// published products — an empty-result filter is worse than no filter.
export async function getCategoryFacets(
  prisma: PrismaClient,
  categoryId: string,
): Promise<CategoryFacets> {
  const products = await prisma.product.findMany({
    where: { categoryId, isPublished: true },
    select: {
      thicknessMm: true,
      wearClass: true,
      decorType: true,
      ourPrice: true,
      brand: { select: { slug: true, name: true } },
    },
  });

  const brandMap = new Map(products.map((p) => [p.brand.slug, p.brand.name]));
  const thicknesses = [...new Set(products.map((p) => p.thicknessMm.toNumber()))].sort(
    (a, b) => a - b,
  );
  const wearClasses = [...new Set(products.map((p) => p.wearClass).filter((v) => !!v))] as string[];
  const decorTypes = [...new Set(products.map((p) => p.decorType))];
  const prices = products.map((p) => p.ourPrice.toNumber());

  return {
    brands: [...brandMap.entries()].map(([slug, name]) => ({ slug, name })),
    thicknesses,
    wearClasses,
    decorTypes,
    priceRange: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  };
}
