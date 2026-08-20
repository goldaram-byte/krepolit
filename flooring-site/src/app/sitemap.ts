import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// Prisma reads aren't tracked by Next's fetch cache, so without an explicit
// revalidate window this would only ever regenerate once, at build time —
// stale the moment a product gets published or unpublished.
export const revalidate = 3600;

const staticPages = [
  { path: "/", priority: 1, changeFrequency: "daily" as const },
  { path: "/catalog", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/calculator", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/pro", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/delivery", priority: 0.4, changeFrequency: "yearly" as const },
  { path: "/contacts", priority: 0.4, changeFrequency: "yearly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...staticPages.map((page) => ({
      url: `${SITE_URL}${page.path}`,
      priority: page.priority,
      changeFrequency: page.changeFrequency,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}/catalog/${category.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
