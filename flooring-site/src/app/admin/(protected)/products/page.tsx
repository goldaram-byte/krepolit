import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { togglePublishAction } from "./actions";

type ProductsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  const { q } = await searchParams;

  const products = q
    ? await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { decorName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 100,
        orderBy: { updatedAt: "desc" },
        include: { brand: { select: { name: true } } },
      })
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Товары</h1>

      <form method="get" className="mt-4 flex gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Поиск по названию, SKU или декору…"
          className="w-80 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Найти
        </button>
      </form>

      {!q ? (
        <p className="mt-6 text-stone-500">Введите запрос, чтобы найти товары.</p>
      ) : products.length === 0 ? (
        <p className="mt-6 text-stone-500">Ничего не найдено.</p>
      ) : (
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-500">
              <th className="py-2">SKU</th>
              <th className="py-2">Товар</th>
              <th className="py-2">Цена</th>
              <th className="py-2">Публикация</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-stone-100">
                <td className="py-2 text-stone-500">{p.sku}</td>
                <td className="py-2">
                  {p.brand.name} — {p.decorName}
                  {p.priceOverridden && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      цена переопределена
                    </span>
                  )}
                </td>
                <td className="py-2">{formatPrice(p.ourPrice)}</td>
                <td className="py-2">
                  <form action={togglePublishAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="isPublished" value={String(p.isPublished)} />
                    <button
                      type="submit"
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        p.isPublished ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {p.isPublished ? "Опубликован" : "Черновик"}
                    </button>
                  </form>
                </td>
                <td className="py-2 text-right">
                  <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline">
                    Редактировать
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
