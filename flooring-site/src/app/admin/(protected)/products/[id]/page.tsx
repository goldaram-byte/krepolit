import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { updateProductAction } from "../actions";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminProductEditPage({ params }: ProductEditPageProps) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true, category: true },
  });
  if (!product) notFound();

  return (
    <div className="max-w-xl">
      <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
        ← К списку товаров
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-stone-900">{product.name}</h1>
      <p className="text-sm text-stone-500">
        {product.sku} · {product.brand.name} · {product.category.name}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-stone-200 p-4 text-sm">
        <dt className="text-stone-500">Закупочная цена</dt>
        <dd>{formatPrice(product.purchasePrice)}</dd>
        <dt className="text-stone-500">РРЦ</dt>
        <dd>{product.rrcPrice ? formatPrice(product.rrcPrice) : "—"}</dd>
        <dt className="text-stone-500">Расчётная (по наценке) цена ниже РРЦ</dt>
        <dd>{product.belowRrcFlag ? "Да, требует проверки" : "Нет"}</dd>
      </dl>

      <form action={updateProductAction} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={product.id} />

        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            type="checkbox"
            name="isPublished"
            defaultChecked={product.isPublished}
            className="h-4 w-4 rounded border-stone-300 text-blue-600"
          />
          <label htmlFor="isPublished" className="text-sm text-stone-700">
            Опубликован на сайте
          </label>
        </div>

        <div className="rounded-lg border border-stone-200 p-4">
          <div className="flex items-center gap-2">
            <input
              id="overridePrice"
              type="checkbox"
              name="overridePrice"
              defaultChecked={product.priceOverridden}
              className="h-4 w-4 rounded border-stone-300 text-blue-600"
            />
            <label htmlFor="overridePrice" className="text-sm font-medium text-stone-700">
              Переопределить цену вручную
            </label>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Пока включено, импорт не будет пересчитывать цену этого товара по наценке
            поставщика — нельзя опубликовать цену ниже РРЦ бренда.
          </p>
          <div className="mt-2">
            <label htmlFor="ourPrice" className="block text-xs text-stone-500">
              Цена за упаковку, ₽
            </label>
            <input
              id="ourPrice"
              type="number"
              name="ourPrice"
              step="0.01"
              min={product.rrcPrice ? product.rrcPrice.toString() : "0"}
              defaultValue={product.ourPrice.toString()}
              className="mt-1 block w-40 rounded-md border border-stone-300 px-3 py-1.5"
            />
          </div>
        </div>

        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-stone-700">
            SEO-заголовок
          </label>
          <input
            id="seoTitle"
            type="text"
            name="seoTitle"
            defaultValue={product.seoTitle ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-stone-700">
            SEO-описание
          </label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={3}
            defaultValue={product.seoDescription ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Сохранить
        </button>
      </form>
    </div>
  );
}
