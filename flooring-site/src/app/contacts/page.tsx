import type { Metadata } from "next";
import { LeadForm } from "@/components/forms/LeadForm";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Свяжитесь с нами: телефон, мессенджеры, обратный звонок.",
};

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">Контакты</h1>

      <div className="mt-6 grid gap-10 sm:grid-cols-2">
        <div className="space-y-3 text-stone-700">
          {/* TODO: replace placeholders with real contact details */}
          <p>
            <span className="font-medium text-stone-900">Телефон:</span>{" "}
            <a href="tel:+70000000000" className="hover:underline">
              +7 (000) 000-00-00
            </a>
          </p>
          <p>
            <span className="font-medium text-stone-900">Email:</span>{" "}
            <a href="mailto:info@example.com" className="hover:underline">
              info@example.com
            </a>
          </p>
          <p>
            <span className="font-medium text-stone-900">Мессенджеры:</span>{" "}
            <a
              href="https://wa.me/70000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              WhatsApp
            </a>
            {", "}
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Telegram
            </a>
          </p>
          <p>
            <span className="font-medium text-stone-900">Зона доставки:</span> Москва и
            Московская область
          </p>
          <p>
            <span className="font-medium text-stone-900">Режим работы:</span> ежедневно,
            9:00–20:00
          </p>
        </div>

        <div>
          <LeadForm
            type="callback"
            title="Заказать обратный звонок"
            submitLabel="Заказать звонок"
            className="rounded-lg border border-stone-200 p-6"
          />
        </div>
      </div>
    </div>
  );
}
