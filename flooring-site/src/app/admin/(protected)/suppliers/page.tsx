import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminSuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
      importRuns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Поставщики</h1>
        <Link href="/admin/suppliers/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Добавить
        </Link>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">Название</th>
            <th className="py-2">Формат</th>
            <th className="py-2">Наценка</th>
            <th className="py-2">Товаров</th>
            <th className="py-2">Последний импорт</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id} className="border-b border-stone-100">
              <td className="py-2">{s.name}</td>
              <td className="py-2 text-stone-500">{s.feedType ?? "—"}</td>
              <td className="py-2">{s.markupPercent.toString()}%</td>
              <td className="py-2">{s._count.products}</td>
              <td className="py-2 text-stone-500">
                {s.importRuns[0] ? s.importRuns[0].createdAt.toLocaleString("ru-RU") : "—"}
              </td>
              <td className="py-2 text-right">
                <Link href={`/admin/suppliers/${s.id}`} className="text-blue-600 hover:underline">
                  Настроить
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
