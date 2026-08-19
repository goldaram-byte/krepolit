import Link from "next/link";
import { LeadForm } from "@/components/forms/LeadForm";

const actionCards = [
  {
    title: "Заказать образцы",
    description: "Пришлём до 5 образцов декора с доставкой, стоимость зачитываем в заказ.",
  },
  {
    title: "Бесплатный расчёт метража",
    description: "Посчитаем количество упаковок и итоговую сумму под вашу планировку.",
  },
  {
    title: "Выезд специалиста",
    description: "Привезём образцы на объект и посмотрим на месте.",
  },
];

const objections = [
  {
    title: "Нет шоурума — это минус?",
    text: "Мы работаем как дилер напрямую со складов поставщиков: без наценки за аренду шоурума и без пересортицы. Заказ и оплата — нам, отгрузка — прямо на ваш адрес.",
  },
  {
    title: "Как понять цвет и качество без осмотра?",
    text: "Присылаем образцы декора с доставкой — можно сравнить с полом, мебелью, дверьми на месте, при своём освещении.",
  },
  {
    title: "А если не угадаю с количеством?",
    text: "Специалист рассчитает метраж с запасом на подрезку и подскажет по сопутствующим материалам — подложке, плинтусу, порогам.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
            Напольные покрытия для дома и офиса — с доставкой по Москве и МО
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-stone-600">
            Кварцвинил, ламинат, керамогранит и паркетная доска. Поможем выбрать декор,
            посчитаем метраж и привезём образцы, прежде чем вы примете решение.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#request"
              className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Оставить заявку
            </a>
            <a
              href="tel:+70000000000"
              className="rounded-md border border-stone-300 bg-white px-6 py-3 font-medium text-stone-900 hover:bg-stone-100"
            >
              Позвонить
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-semibold text-stone-900">С чего начать</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {actionCards.map((card) => (
            <a
              key={card.title}
              href="#request"
              className="block rounded-lg border border-stone-200 p-6 transition hover:border-blue-600 hover:shadow-sm"
            >
              <h3 className="font-semibold text-stone-900">{card.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{card.description}</p>
            </a>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-stone-500">
          Или короткий вопрос — напишите в{" "}
          <a
            href="https://wa.me/70000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-900"
          >
            WhatsApp
          </a>{" "}
          или{" "}
          <a
            href="https://t.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-stone-900"
          >
            Telegram
          </a>
          .
        </p>
      </section>

      <section className="bg-stone-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-xl font-semibold text-stone-900">Как мы работаем без шоурума</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {objections.map((item) => (
              <div key={item.title} className="rounded-lg bg-white p-6">
                <h3 className="font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-xl font-semibold text-stone-900">Дизайнерам и бригадам</h2>
        <p className="mt-3 max-w-2xl text-stone-600">
          Работаем с партнёрами на отдельных условиях: процент со сделки, приоритетная
          обработка заявок, отдельный канал связи.
        </p>
        <Link
          href="/contacts"
          className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-700"
        >
          Узнать условия →
        </Link>
      </section>

      <section id="request" className="border-t border-stone-200 bg-stone-50 py-14">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-xl font-semibold text-stone-900">Оставить заявку</h2>
          <p className="mt-2 text-sm text-stone-600">
            Выберите, что вам нужно — перезвоним в течение рабочего дня.
          </p>
          <LeadForm
            type={["samples", "estimate", "site_visit", "consultation"]}
            showMessage
            className="mt-6 rounded-lg bg-white p-6 shadow-sm"
          />
        </div>
      </section>
    </>
  );
}
