import type { Metadata } from "next";
import { LeadForm } from "@/components/forms/LeadForm";

export const metadata: Metadata = {
  title: "Дизайнерам и бригадам",
  description: "Партнёрская программа для дизайнеров интерьеров и бригад: процент со сделки, приоритетная обработка заявок.",
};

const terms = [
  {
    title: "Процент со сделки",
    text: "Фиксированное вознаграждение с каждого заказа клиента, которого вы привели — независимо от суммы чека.",
  },
  {
    title: "Отдельный канал связи",
    text: "Заявки партнёров не смешиваются с розницей — отвечаем быстрее и обсуждаем именно партнёрские условия.",
  },
  {
    title: "Приоритетная обработка",
    text: "Расчёт метража, образцы и вопросы по проекту — в первую очередь, без общей очереди.",
  },
];

export default function ProPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">Дизайнерам и бригадам</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Работаем с дизайнерами интерьеров и монтажными бригадами на отдельных условиях —
        это не розница.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {terms.map((term) => (
          <div key={term.title} className="rounded-lg border border-stone-200 p-5">
            <h2 className="font-semibold text-stone-900">{term.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{term.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 max-w-md">
        <LeadForm
          type="partner"
          title="Зарегистрироваться как партнёр"
          submitLabel="Отправить заявку"
          showMessage
        />
      </div>
    </div>
  );
}
