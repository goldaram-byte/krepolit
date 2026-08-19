import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Условия доставки и оплаты напольных покрытий в Москве и МО.",
};

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">Доставка и оплата</h1>

      <div className="mt-6 space-y-6 text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">Доставка</h2>
          <p className="mt-2">
            Отгрузка идёт со склада поставщика напрямую на адрес клиента в Москве и
            Московской области. Срок и стоимость доставки зависят от товара и адреса —
            уточняем при подтверждении заявки.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">Оплата</h2>
          <p className="mt-2">
            Онлайн-оплата на сайте не предусмотрена. После оформления заявки менеджер
            свяжется с вами, согласует счёт и способ оплаты — наличными курьеру,
            картой при получении или банковским переводом для юридических лиц.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">Образцы</h2>
          <p className="mt-2">
            Заказ образцов — платный, но стоимость доставки образцов засчитывается в
            сумму итогового заказа напольного покрытия.
          </p>
        </section>
      </div>
    </div>
  );
}
