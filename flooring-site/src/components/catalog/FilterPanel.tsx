import type { CategoryFacets, CatalogSearchParams } from "@/lib/catalog-filters";

const decorTypeLabels: Record<string, string> = {
  wood: "Дерево",
  stone: "Камень",
  tile: "Плитка",
  herringbone: "Ёлочка",
};

// Plain GET <form>: filters live entirely in the URL query string, no JS
// required (SPEC.md §5 — "Фильтры — в URL как query-параметры, серверный рендер").
export function FilterPanel({
  facets,
  current,
}: {
  facets: CategoryFacets;
  current: CatalogSearchParams;
}) {
  return (
    <form method="get" className="space-y-5 rounded-lg border border-stone-200 p-4">
      {facets.brands.length > 1 && (
        <FilterSelect
          name="brand"
          label="Бренд"
          current={current.brand}
          options={facets.brands.map((b) => ({ value: b.slug, label: b.name }))}
        />
      )}

      {facets.thicknesses.length > 1 && (
        <FilterSelect
          name="thickness"
          label="Толщина, мм"
          current={current.thickness}
          options={facets.thicknesses.map((t) => ({ value: String(t), label: `${t} мм` }))}
        />
      )}

      {facets.wearClasses.length > 1 && (
        <FilterSelect
          name="wearClass"
          label="Класс износостойкости"
          current={current.wearClass}
          options={facets.wearClasses.map((w) => ({ value: w, label: w }))}
        />
      )}

      {facets.decorTypes.length > 1 && (
        <FilterSelect
          name="decorType"
          label="Декор"
          current={current.decorType}
          options={facets.decorTypes.map((d) => ({ value: d, label: decorTypeLabels[d] ?? d }))}
        />
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-stone-700">Цена, ₽</legend>
        <div className="flex gap-2">
          <input
            type="number"
            name="priceMin"
            placeholder="От"
            defaultValue={current.priceMin}
            min={0}
            className="w-1/2 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
          />
          <input
            type="number"
            name="priceMax"
            placeholder="До"
            defaultValue={current.priceMax}
            min={0}
            className="w-1/2 rounded-md border border-stone-300 px-2 py-1.5 text-sm"
          />
        </div>
      </fieldset>

      <div className="space-y-2">
        <CheckboxField name="waterproof" label="Водостойкий" defaultChecked={current.waterproof === "1"} />
        <CheckboxField
          name="warmFloor"
          label="Совместим с тёплым полом"
          defaultChecked={current.warmFloor === "1"}
        />
        <CheckboxField name="inStock" label="Только в наличии" defaultChecked={current.inStock === "1"} />
      </div>

      <FilterSelect
        name="sort"
        label="Сортировка"
        current={current.sort ?? "new"}
        options={[
          { value: "new", label: "Сначала новые" },
          { value: "price_asc", label: "Сначала дешевле" },
          { value: "price_desc", label: "Сначала дороже" },
        ]}
      />

      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Применить
      </button>
    </form>
  );
}

function FilterSelect({
  name,
  label,
  current,
  options,
}: {
  name: string;
  label: string;
  current?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={current ?? ""}
        className="mt-1 block w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm"
      >
        <option value="">Любой</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-700">
      <input
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-600"
      />
      {label}
    </label>
  );
}
