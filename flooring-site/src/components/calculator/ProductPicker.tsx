"use client";

import { useEffect, useRef, useState } from "react";

export type PickableProduct = {
  slug: string;
  name: string;
  decorName: string;
  m2PerPack: number;
  ourPrice: number;
};

export function ProductPicker({ onSelect }: { onSelect: (product: PickableProduct) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickableProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as PickableProduct[];
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="relative">
      <label htmlFor="product-search" className="block text-sm font-medium text-stone-700">
        Найдите товар
      </label>
      <input
        id="product-search"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Например, Дуб Античный"
        className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />

      {loading && <p className="mt-1 text-xs text-stone-500">Поиск…</p>}

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-stone-200 bg-white shadow-lg">
          {results.map((product) => (
            <li key={product.slug}>
              <button
                type="button"
                onClick={() => {
                  onSelect(product);
                  setQuery(product.name);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-stone-50"
              >
                {product.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
