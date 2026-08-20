import { prisma } from "@/lib/db";
import { leadTypeLabels } from "@/lib/lead-labels";
import { leadStatusLabels, leadStatusValues } from "@/lib/lead-status-labels";
import { leadTypeValues } from "@/lib/validation";
import { updateLeadAction } from "./actions";

type LeadsPageProps = {
  searchParams: Promise<{ type?: string; status?: string }>;
};

export default async function AdminLeadsPage({ searchParams }: LeadsPageProps) {
  const query = await searchParams;

  const leads = await prisma.lead.findMany({
    where: {
      ...(query.type ? { type: query.type as (typeof leadTypeValues)[number] } : {}),
      ...(query.status ? { status: query.status as (typeof leadStatusValues)[number] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { sampleOrder: { select: { address: true, productIds: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Лиды</h1>

      <form method="get" className="mt-4 flex flex-wrap gap-3">
        <select
          name="type"
          defaultValue={query.type ?? ""}
          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Все типы</option>
          {leadTypeValues.map((t) => (
            <option key={t} value={t}>
              {leadTypeLabels[t]}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="rounded-md border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Все статусы</option>
          {leadStatusValues.map((s) => (
            <option key={s} value={s}>
              {leadStatusLabels[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">
          Применить
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {leads.length === 0 && <p className="text-stone-500">Заявок не найдено.</p>}
        {leads.map((lead) => (
          <div key={lead.id} className="rounded-lg border border-stone-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-medium text-stone-900">{lead.name}</span>{" "}
                <span className="text-stone-500">· {lead.phone}</span>
                {lead.email && <span className="text-stone-500"> · {lead.email}</span>}
              </div>
              <span className="text-xs text-stone-400">
                {lead.createdAt.toLocaleString("ru-RU")}
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-600">
              {leadTypeLabels[lead.type]}
              {lead.pageUrl && <span className="text-stone-400"> · {lead.pageUrl}</span>}
            </p>
            {lead.message && <p className="mt-1 text-sm text-stone-700">{lead.message}</p>}
            {lead.sampleOrder && (
              <p className="mt-1 text-sm text-stone-700">
                Образцы ({lead.sampleOrder.productIds.length}) → {lead.sampleOrder.address}
              </p>
            )}

            <form action={updateLeadAction} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={lead.id} />
              <div>
                <label className="block text-xs text-stone-500">Статус</label>
                <select
                  name="status"
                  defaultValue={lead.status}
                  className="mt-1 rounded-md border border-stone-300 px-2 py-1 text-sm"
                >
                  {leadStatusValues.map((s) => (
                    <option key={s} value={s}>
                      {leadStatusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-stone-500">Заметка</label>
                <input
                  type="text"
                  name="note"
                  defaultValue={lead.note ?? ""}
                  className="mt-1 block w-full rounded-md border border-stone-300 px-2 py-1 text-sm"
                />
              </div>
              <button type="submit" className="rounded-md bg-stone-800 px-3 py-1.5 text-sm text-white hover:bg-stone-900">
                Сохранить
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
