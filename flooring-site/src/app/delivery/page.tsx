import type { Metadata } from "next";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Условия доставки и оплаты напольных покрытий в Москве и МО.",
};

const faq = [
  {
    question: "Можно ли оплатить картой онлайн?",
    answer:
      "Нет, онлайн-оплаты на сайте нет. После подтверждения заявки менеджер согласует счёт — оплата наличными курьеру, картой при получении или банковским переводом для юридических лиц.",
  },
  {
    question: "Сколько стоит доставка образцов?",
    answer:
      "Доставка образцов платная, но её стоимость полностью засчитывается в итоговый заказ напольного покрытия.",
  },
  {
    question: "Можно ли забрать заказ самостоятельно?",
    answer:
      "У нас нет собственного склада или шоурума — самовывоза нет, отгрузка всегда идёт со склада поставщика курьером или транспортной компанией на ваш адрес.",
  },
];

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

        <section>
          <h2 className="text-lg font-semibold text-stone-900">Частые вопросы</h2>
          <dl className="mt-2 space-y-4">
            {faq.map((item) => (
              <div key={item.question}>
                <dt className="font-medium text-stone-900">{item.question}</dt>
                <dd className="mt-1">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <FaqJsonLd items={faq} />
    </div>
  );
}
