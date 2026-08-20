import { createSupplierAction } from "../actions";

export default function AdminNewSupplierPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-stone-900">Новый поставщик</h1>

      <form action={createSupplierAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-stone-700">
            Название
          </label>
          <input
            id="name"
            type="text"
            name="name"
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
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
            defaultValue="30"
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Создать
        </button>
      </form>
    </div>
  );
}
