import Image from "next/image";
import Link from "next/link";
import { formatPrice, pricePerM2 } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export type ProductCardData = {
  slug: string;
  name: string;
  decorName: string;
  images: string[];
  ourPrice: Prisma.Decimal;
  m2PerPack: Prisma.Decimal;
  stockStatus: string;
  brand: { name: string };
};

const stockLabels: Record<string, string> = {
  in_stock: "В наличии",
  on_order: "Под заказ",
  out_of_stock: "Нет в наличии",
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-stone-200 transition hover:border-blue-600 hover:shadow-sm"
    >
      <div className="relative aspect-square bg-stone-100">
        {image ? (
          <Image
            src={image}
            alt={product.decorName}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            Фото скоро появится
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-stone-500">{product.brand.name}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-stone-900">
          {product.decorName}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-semibold text-stone-900">{formatPrice(product.ourPrice)}</span>
          <span className="text-xs text-stone-500">за упак.</span>
        </div>
        <p className="text-xs text-stone-500">
          {new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
            pricePerM2(product.ourPrice, product.m2PerPack),
          )}{" "}
          ₽/м²
        </p>
        <p className="mt-1 text-xs text-stone-500">{stockLabels[product.stockStatus] ?? ""}</p>
      </div>
    </Link>
  );
}
