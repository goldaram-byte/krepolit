import Link from "next/link";
import { prisma } from "@/lib/db";
import { leadTypeLabels } from "@/lib/lead-labels";
import { formatPrice } from "@/lib/format";
import type { LeadTypeValue } from "@/lib/validation";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function getLeadCountsByType(since: Date) {
  const rows = await prisma.lead.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });
  return rows as { type: LeadTypeValue; _count: { _all: number } }[];
}

export default async function AdminDashboardPage() {
  const [leads7d, leads30d, belowRrcProducts, lastImportRun] = await Promise.all([
    getLeadCountsByType(daysAgo(7)),
    getLeadCountsByType(daysAgo(30)),
    prisma.product.findMany({
      where: { belowRrcFlag: true },
      take: 20,
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, sku: true, ourPrice: true, rrcPrice: true },
    }),
    prisma.importRun.findFirst({
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { name: true } } },
    }),
  ]);

  const stats = lastImportRun?.stats as Record<string, unknown> | undefined;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-stone-900">Дашборд</h1>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">Лиды</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <LeadCountsTable title="За 7 дней" rows={leads7d} />
          <LeadCountsTable title="За 30 дней" rows={leads30d} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">
          Товары с ценой ниже РРЦ ({belowRrcProducts.length})
        </h2>
        {belowRrcProducts.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Нет товаров, требующих проверки.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="py-2">Товар</th>
                <th className="py-2">Наша цена</th>
                <th className="py-2">РРЦ</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {belowRrcProducts.map((p) => (
                <tr key={p.id} className="border-b border-stone-100">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{formatPrice(p.ourPrice)}</td>
                  <td className="py-2">{p.rrcPrice ? formatPrice(p.rrcPrice) : "—"}</td>
                  <td className="py-2 text-right">
                    <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-stone-900">Последний импорт</h2>
        {!lastImportRun ? (
          <p className="mt-2 text-sm text-stone-500">Импорт ещё не запускался.</p>
        ) : (
          <div className="mt-2 rounded-lg border border-stone-200 p-4 text-sm">
            <p className="font-medium text-stone-900">
              {lastImportRun.supplier.name} — {lastImportRun.createdAt.toLocaleString("ru-RU")}
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-1 text-stone-600 sm:grid-cols-4">
              {stats &&
                Object.entries(stats).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-stone-400">{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}

function LeadCountsTable({
  title,
  rows,
}: {
  title: string;
  rows: { type: LeadTypeValue; _count: { _all: number } }[];
}) {
  const total = rows.reduce((sum, r) => sum + r._count._all, 0);

  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <h3 className="font-medium text-stone-900">
        {title} — всего {total}
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-stone-600">
        {rows.map((r) => (
          <li key={r.type} className="flex justify-between">
            <span>{leadTypeLabels[r.type]}</span>
            <span className="font-medium text-stone-900">{r._count._all}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-stone-400">Нет заявок</li>}
      </ul>
    </div>
  );
}
