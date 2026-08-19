import type { Metadata } from "next";
import { AreaCalculator } from "@/components/calculator/AreaCalculator";

export const metadata: Metadata = {
  title: "Калькулятор метража",
  description: "Посчитайте, сколько упаковок напольного покрытия нужно на вашу комнату.",
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">Калькулятор метража</h1>
      <p className="mt-2 text-stone-600">
        Найдите товар, укажите площадь или размеры комнаты — посчитаем количество
        упаковок с запасом на подрезку и итоговую сумму.
      </p>

      <div className="mt-8">
        <AreaCalculator />
      </div>
    </div>
  );
}
