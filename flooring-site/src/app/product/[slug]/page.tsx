import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatArea, formatPrice, pricePerM2 } from "@/lib/format";
import { AreaCalculator } from "@/components/calculator/AreaCalculator";
import { ProductCard } from "@/components/catalog/ProductCard";
import { AddToSamplesButton } from "@/components/samples/AddToSamplesButton";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";

export const revalidate = 3600;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const stockLabels: Record<string, string> = {
  in_stock: "В наличии",
  on_order: "Под заказ",
  out_of_stock: "Нет в наличии",
};

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: { brand: true, category: true, collection: true, supplier: false },
  });
}

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.isPublished) return {};

  const title = product.seoTitle || `${product.brand.name} ${product.decorName} купить — ${formatPrice(product.ourPrice)}`;
  const description =
    product.seoDescription ||
    `${product.name}: ${product.brand.name}, декор «${product.decorName}», ${formatPrice(product.ourPrice)} за упаковку. Доставка по Москве и МО.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product || !product.isPublished) notFound();

  const similar = await prisma.product.findMany({
    where: {
      isPublished: true,
      categoryId: product.categoryId,
      decorType: product.decorType,
      id: { not: product.id },
    },
    take: 4,
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
  });

  const pricePerMeter = pricePerM2(product.ourPrice, product.m2PerPack);
  const isAvailable = product.stockStatus !== "out_of_stock";

  const specs: [string, string][] = [
    ["Бренд", product.brand.name],
    ["Декор", product.decorName],
    ["Размер", `${product.lengthMm} × ${product.widthMm} мм`],
    ["Толщина", `${product.thicknessMm} мм`],
    ...(product.wearLayerMm ? ([["Толщина защитного слоя", `${product.wearLayerMm} мм`]] as [string, string][]) : []),
    ...(product.wearClass ? ([["Класс износостойкости", product.wearClass]] as [string, string][]) : []),
    ["м² в упаковке", `${product.m2PerPack} м²`],
    ...(product.packsPerPallet ? ([["Упаковок на паллете", String(product.packsPerPallet)]] as [string, string][]) : []),
    ...(product.weightKg ? ([["Вес упаковки", `${product.weightKg} кг`]] as [string, string][]) : []),
    ["Водостойкость", product.waterproof ? "Да" : "Нет"],
    ["Совместим с тёплым полом", product.warmFloorCompatible ? "Да" : "Нет"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Каталог", path: "/catalog" },
          { name: product.category.name, path: `/catalog/${product.category.slug}` },
          { name: product.name, path: `/product/${product.slug}` },
        ]}
      />
      <ProductJsonLd
        product={{
          slug: product.slug,
          name: product.name,
          decorName: product.decorName,
          images: product.images,
          sku: product.sku,
          brandName: product.brand.name,
          price: product.ourPrice.toNumber(),
          stockStatus: product.stockStatus,
        }}
      />

      <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-stone-500">
        <Link href="/catalog" className="hover:text-stone-900">
          Каталог
        </Link>
        {" / "}
        <Link href={`/catalog/${product.category.slug}`} className="hover:text-stone-900">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square rounded-lg bg-stone-100">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.decorName}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="rounded-lg object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400">
                Фото скоро появится
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(1).map((src) => (
                <div key={src} className="relative aspect-square rounded-md bg-stone-100">
                  <Image src={src} alt={product.decorName} fill sizes="150px" className="rounded-md object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-stone-500">{product.brand.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-stone-900">{product.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-stone-900">{formatPrice(product.ourPrice)}</span>
            <span className="text-stone-500">за упаковку</span>
          </div>
          <p className="text-stone-600">
            {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(pricePerMeter)} ₽/м² ·{" "}
            {formatArea(product.m2PerPack)} в упаковке
          </p>

          <p className={`mt-2 font-medium ${isAvailable ? "text-green-700" : "text-red-600"}`}>
            {stockLabels[product.stockStatus]}
          </p>

          {isAvailable ? (
            <div className="mt-6">
              <AddToSamplesButton slug={product.slug} />
            </div>
          ) : (
            <p className="mt-6 text-stone-600">
              Этот декор сейчас недоступен — посмотрите похожие варианты ниже или оставьте заявку,
              мы подскажем аналог.
            </p>
          )}

          <table className="mt-8 w-full text-sm">
            <tbody>
              {specs.map(([label, value]) => (
                <tr key={label} className="border-b border-stone-100">
                  <td className="py-2 text-stone-500">{label}</td>
                  <td className="py-2 text-right font-medium text-stone-900">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="mt-14 border-t border-stone-200 pt-10">
        <h2 className="text-xl font-semibold text-stone-900">Калькулятор метража</h2>
        <div className="mt-6 max-w-xl">
          <AreaCalculator
            product={{
              slug: product.slug,
              name: product.name,
              decorName: product.decorName,
              m2PerPack: product.m2PerPack.toNumber(),
              ourPrice: product.ourPrice.toNumber(),
            }}
          />
        </div>
      </section>

      {similar.length > 0 && (
        <section className="mt-14 border-t border-stone-200 pt-10">
          <h2 className="text-xl font-semibold text-stone-900">Похожие декоры</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
