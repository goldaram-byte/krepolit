import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateSupplierAction, runImportAction } from "../actions";

type SupplierEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSupplierEditPage({ params }: SupplierEditPageProps) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { importRuns: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
  if (!supplier) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/suppliers" className="text-sm text-blue-600 hover:underline">
        ← К списку поставщиков
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{supplier.name}</h1>

      <form action={updateSupplierAction} className="mt-6 space-y-4 rounded-lg border border-stone-200 p-4">
        <input type="hidden" name="id" value={supplier.id} />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
            Название
          </label>
          <input
            id="name"
            type="text"
            name="name"
            defaultValue={supplier.name}
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="feedType" className="block text-sm font-medium text-stone-700">
              Формат фида
            </label>
            <select
              id="feedType"
              name="feedType"
              defaultValue={supplier.feedType ?? ""}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
            >
              <option value="">Не задан</option>
              <option value="yml">YML</option>
              <option value="xlsx">XLSX</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          <div>
            <label htmlFor="markupPercent" className="block text-sm font-medium text-stone-700">
              Наценка, %
            </label>
            <input
              id="markupPercent"
              type="number"
              name="markupPercent"
              step="0.01"
              defaultValue={supplier.markupPercent.toString()}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label htmlFor="feedUrl" className="block text-sm font-medium text-stone-700">
            Адрес фида (URL или локальный путь)
          </label>
          <input
            id="feedUrl"
            type="text"
            name="feedUrl"
            defaultValue={supplier.feedUrl ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="columnMapping" className="block text-sm font-medium text-stone-700">
            Маппинг колонок (JSON, только для XLSX/CSV)
          </label>
          <textarea
            id="columnMapping"
            name="columnMapping"
            rows={6}
            defaultValue={
              supplier.columnMapping ? JSON.stringify(supplier.columnMapping, null, 2) : ""
            }
            placeholder='{"sku": "Артикул", "name": "Наименование", "purchasePrice": "Цена"}'
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="deliveryTerms" className="block text-sm font-medium text-stone-700">
            Условия доставки
          </label>
          <input
            id="deliveryTerms"
            type="text"
            name="deliveryTerms"
            defaultValue={supplier.deliveryTerms ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Сохранить
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-stone-200 p-4">
        <h2 className="font-medium text-stone-900">Запуск импорта</h2>
        <form action={runImportAction} className="mt-3 flex items-center gap-4">
          <input type="hidden" name="id" value={supplier.id} />
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="downloadImages" defaultChecked className="h-4 w-4 rounded border-stone-300" />
            Скачивать фото
          </label>
          <button type="submit" className="rounded-md bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-900">
            Запустить импорт сейчас
          </button>
        </form>

        {supplier.importRuns.length > 0 && (
          <div className="mt-4 space-y-2 text-sm">
            {supplier.importRuns.map((run) => (
              <div key={run.id} className="rounded border border-stone-100 p-2 text-stone-600">
                <span className="text-stone-400">{run.createdAt.toLocaleString("ru-RU")}</span>{" "}
                {JSON.stringify(run.stats)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
