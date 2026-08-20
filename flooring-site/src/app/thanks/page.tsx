import Link from "next/link";
import type { Metadata } from "next";
import { leadTypeLabels } from "@/lib/lead-labels";
import type { LeadTypeValue } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Заявка отправлена",
  robots: { index: false, follow: false },
};

function isLeadType(value: string | undefined): value is LeadTypeValue {
  return !!value && value in leadTypeLabels;
}

type ThanksPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function ThanksPage({ searchParams }: ThanksPageProps) {
  const { type } = await searchParams;
  const label = isLeadType(type) ? leadTypeLabels[type] : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Заявка отправлена</h1>
      <p className="mt-4 text-stone-600">
        {label
          ? `Мы получили вашу заявку («${label}») и свяжемся с вами в течение рабочего дня.`
          : "Мы получили вашу заявку и свяжемся с вами в течение рабочего дня."}
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-blue-600 px-6 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        На главную
      </Link>
    </div>
  );
}
