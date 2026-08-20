import type { Metadata } from "next";
import { SamplesCartView } from "@/components/samples/SamplesCartView";

export const metadata: Metadata = {
  title: "Заказ образцов",
  description: "Закажите бесплатные образцы декора с доставкой — стоимость доставки зачитывается в заказ.",
};

export default function SamplesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">Заказ образцов</h1>
      <p className="mt-2 text-stone-600">
        До 5 образцов декора с доставкой. Стоимость доставки засчитывается в итоговый заказ
        покрытия.
      </p>

      <div className="mt-8">
        <SamplesCartView />
      </div>
    </div>
  );
}
