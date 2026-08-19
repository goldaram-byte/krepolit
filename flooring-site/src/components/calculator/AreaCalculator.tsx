"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  calculatePackages,
  layingPatternLabels,
  type LayingPattern,
} from "@/lib/calculator";
import { formatPrice } from "@/lib/format";
import { LeadForm } from "@/components/forms/LeadForm";
import { ProductPicker, type PickableProduct } from "@/components/calculator/ProductPicker";

type AreaMode = "area" | "dimensions";

export function AreaCalculator({ product }: { product?: PickableProduct }) {
  const [selected, setSelected] = useState<PickableProduct | null>(product ?? null);
  const [mode, setMode] = useState<AreaMode>("area");
  const [area, setArea] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [pattern, setPattern] = useState<LayingPattern>("straight");

  const areaM2 = useMemo(() => {
    if (mode === "area") return Number.parseFloat(area) || 0;
    return (Number.parseFloat(length) || 0) * (Number.parseFloat(width) || 0);
  }, [mode, area, length, width]);

  const result = useMemo(() => {
    if (!selected || areaM2 <= 0) return null;
    return calculatePackages(areaM2, pattern, selected.m2PerPack);
  }, [selected, areaM2, pattern]);

  const totalPrice = result && selected ? result.packsNeeded * selected.ourPrice : null;

  const summaryMessage = useMemo(() => {
    if (!selected || !result) return undefined;
    return [
      `Товар: ${selected.name}`,
      `Площадь: ${areaM2} м² (${layingPatternLabels[pattern]})`,
      `Нужно упаковок: ${result.packsNeeded} (${result.totalAreaPurchased} м²)`,
      totalPrice != null ? `Сумма: ${formatPrice(totalPrice)}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }, [selected, result, areaM2, pattern, totalPrice]);

  return (
    <div className="space-y-6">
      {!product && (
        <ProductPicker
          onSelect={(p) => {
            setSelected(p);
          }}
        />
      )}

      {selected && (
        <>
          {!product && (
            <p className="text-sm text-stone-600">
              Выбрано:{" "}
              <Link href={`/product/${selected.slug}`} className="font-medium text-blue-600 hover:underline">
                {selected.name}
              </Link>
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("area")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "area" ? "bg-blue-600 text-white" : "border border-stone-300"}`}
            >
              Знаю площадь
            </button>
            <button
              type="button"
              onClick={() => setMode("dimensions")}
              className={`rounded-md px-3 py-1.5 text-sm ${mode === "dimensions" ? "bg-blue-600 text-white" : "border border-stone-300"}`}
            >
              Знаю размеры комнаты
            </button>
          </div>

          {mode === "area" ? (
            <div>
              <label htmlFor="calc-area" className="block text-sm font-medium text-stone-700">
                Площадь помещения, м²
              </label>
              <input
                id="calc-area"
                type="number"
                min={0}
                step="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="mt-1 block w-full max-w-xs rounded-md border border-stone-300 px-3 py-2"
              />
            </div>
          ) : (
            <div className="flex gap-3">
              <div>
                <label htmlFor="calc-length" className="block text-sm font-medium text-stone-700">
                  Длина, м
                </label>
                <input
                  id="calc-length"
                  type="number"
                  min={0}
                  step="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="mt-1 block w-32 rounded-md border border-stone-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="calc-width" className="block text-sm font-medium text-stone-700">
                  Ширина, м
                </label>
                <input
                  id="calc-width"
                  type="number"
                  min={0}
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="mt-1 block w-32 rounded-md border border-stone-300 px-3 py-2"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="calc-pattern" className="block text-sm font-medium text-stone-700">
              Тип укладки
            </label>
            <select
              id="calc-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value as LayingPattern)}
              className="mt-1 block w-full max-w-xs rounded-md border border-stone-300 px-3 py-2"
            >
              {Object.entries(layingPatternLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {result && result.packsNeeded > 0 && (
            <div className="rounded-lg bg-stone-50 p-4">
              <p className="text-sm text-stone-600">
                С запасом на подрезку: {result.areaWithWaste} м²
              </p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                Нужно упаковок: {result.packsNeeded} ({result.totalAreaPurchased} м²)
              </p>
              {totalPrice != null && (
                <p className="mt-1 text-lg font-semibold text-blue-600">
                  Сумма: {formatPrice(totalPrice)}
                </p>
              )}

              <div className="mt-6">
                <LeadForm
                  type="estimate"
                  title="Отправить расчёт себе в мессенджер"
                  submitLabel="Отправить расчёт"
                  showMessage
                  defaultMessage={summaryMessage}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
