import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/catalog/ProductCard";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import {
  buildOrderBy,
  buildProductWhere,
  getCategoryFacets,
  parsePage,
  PAGE_SIZE,
  type CatalogSearchParams,
} from "@/lib/catalog-filters";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<CatalogSearchParams>;
};

async function getCategory(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { parent: { include: { parent: true } } },
  });
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};

  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description || undefined,
    alternates: { canonical: `/catalog/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: slug } = await params;
  const query = await searchParams;

  const category = await getCategory(slug);
  if (!category) notFound();

  const facets = await getCategoryFacets(prisma, category.id);
  const where = buildProductWhere(category.id, query);
  const orderBy = buildOrderBy(query.sort);
  const page = parsePage(query.page);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        slug: true,
        name: true,
        decorName: true,
        images: true,
        ourPrice: true,
        m2PerPack: true,
        stockStatus: true,
        brand: { select: { name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const breadcrumbs = [category.parent?.parent, category.parent, category].filter(
    (c): c is NonNullable<typeof c> => !!c,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-stone-500">
        <Link href="/catalog" className="hover:text-stone-900">
          Каталог
        </Link>
        {breadcrumbs.map((c) => (
          <span key={c.id}>
            {" / "}
            <Link href={`/catalog/${c.slug}`} className="hover:text-stone-900">
              {c.name}
            </Link>
          </span>
        ))}
      </nav>

      <h1 className="text-2xl font-bold text-stone-900">{category.name}</h1>
      <p className="mt-1 text-sm text-stone-500">{total} товаров</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <FilterPanel facets={facets} current={query} />

        <div>
          {products.length === 0 ? (
            <p className="text-stone-600">
              По заданным фильтрам ничего не найдено. Попробуйте изменить условия.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Пагинация" className="mt-8 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams(query as Record<string, string>);
                params.set("page", String(p));
                return (
                  <Link
                    key={p}
                    href={`?${params.toString()}`}
                    className={`rounded-md px-3 py-1.5 text-sm ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "border border-stone-300 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
