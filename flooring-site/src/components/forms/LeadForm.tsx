"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatRuPhone } from "@/lib/phone-mask";
import { readUtmFromLocation } from "@/lib/utm";
import { leadTypeLabels } from "@/lib/lead-labels";
import { leadTypeToGoal, reachGoal } from "@/lib/metrika";
import type { LeadTypeValue } from "@/lib/validation";

type LeadFormProps = {
  /** Fixed lead type for a dedicated page (e.g. /samples), or a list of
   * types to offer as a dropdown (e.g. a general-purpose homepage form). */
  type: LeadTypeValue | readonly LeadTypeValue[];
  title?: string;
  submitLabel?: string;
  showMessage?: boolean;
  /** Prefills (and keeps in sync with) the message field — e.g. a
   * calculator result summary that updates as inputs change. */
  defaultMessage?: string;
  className?: string;
};

type SubmitState = "idle" | "submitting" | "error";

export function LeadForm({
  type,
  title,
  submitLabel = "Отправить заявку",
  showMessage = false,
  defaultMessage,
  className,
}: LeadFormProps) {
  const router = useRouter();
  const typeOptions: readonly LeadTypeValue[] | null = Array.isArray(type)
    ? type
    : null;
  const [selectedType, setSelectedType] = useState<LeadTypeValue>(
    typeOptions ? typeOptions[0] : (type as LeadTypeValue),
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage ?? "");
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (defaultMessage != null) setMessage(defaultMessage);
  }, [defaultMessage]);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!consent) {
      setError("Нужно согласие на обработку персональных данных");
      return;
    }

    setState("submitting");

    const formData = new FormData(event.currentTarget);
    const website = String(formData.get("website") ?? "");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          name,
          phone,
          message: showMessage ? message : undefined,
          consent,
          website,
          pageUrl: window.location.href,
          utm: readUtmFromLocation(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "Не удалось отправить заявку, попробуйте ещё раз");
        setState("error");
        return;
      }

      reachGoal(leadTypeToGoal[selectedType]);
      router.push(`/thanks?type=${selectedType}`);
    } catch {
      setError("Не удалось отправить заявку, проверьте соединение");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {title && <h3 className="text-lg font-semibold text-stone-900">{title}</h3>}

      <div className="mt-4 space-y-4">
        {typeOptions && (
          <div>
            <label htmlFor="lead-type" className="block text-sm font-medium text-stone-700">
              Тип заявки
            </label>
            <select
              id="lead-type"
              name="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as LeadTypeValue)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {leadTypeLabels[option]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor={`${selectedType}-name`} className="block text-sm font-medium text-stone-700">
            Имя
          </label>
          <input
            id={`${selectedType}-name`}
            name="name"
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor={`${selectedType}-phone`} className="block text-sm font-medium text-stone-700">
            Телефон
          </label>
          <input
            id={`${selectedType}-phone`}
            name="phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={(e) => setPhone(formatRuPhone(e.target.value))}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {showMessage && (
          <div>
            <label htmlFor={`${selectedType}-message`} className="block text-sm font-medium text-stone-700">
              Сообщение
            </label>
            <textarea
              id={`${selectedType}-message`}
              name="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        )}

        {/* Honeypot: hidden from real visitors, left empty by them. */}
        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor={`${selectedType}-website`}>Website</label>
          <input
            id={`${selectedType}-website`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id={`${selectedType}-consent`}
            name="consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-600"
          />
          <label htmlFor={`${selectedType}-consent`} className="text-sm text-stone-600">
            Согласен на обработку персональных данных в соответствии с{" "}
            <a href="/privacy" className="underline hover:text-stone-900">
              политикой конфиденциальности
            </a>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={state === "submitting"}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Отправка…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
