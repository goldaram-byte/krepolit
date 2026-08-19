import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Каталог напольных покрытий",
  description: "Кварцвинил, ламинат, керамогранит и паркетная доска — весь каталог по категориям.",
};

export default async function CatalogRootPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isPublished: true } } } },
      children: {
        include: { _count: { select: { products: { where: { isPublished: true } } } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Каталог</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div key={category.id} className="rounded-lg border border-stone-200 p-5">
            <Link
              href={`/catalog/${category.slug}`}
              className="text-lg font-semibold text-stone-900 hover:text-blue-600"
            >
              {category.name}
            </Link>
            <p className="mt-1 text-sm text-stone-500">{category._count.products} товаров</p>

            {category.children.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link href={`/catalog/${child.slug}`} className="text-stone-600 hover:text-blue-600">
                      {child.name} ({child._count.products})
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
