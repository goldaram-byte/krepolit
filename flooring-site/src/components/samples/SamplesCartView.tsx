"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearSampleCart,
  getSampleCart,
  onSampleCartChange,
  removeFromSampleCart,
} from "@/lib/sample-cart";
import { SAMPLE_DELIVERY_PRICE } from "@/lib/samples";
import { formatPrice } from "@/lib/format";
import { formatRuPhone } from "@/lib/phone-mask";
import { readUtmFromLocation } from "@/lib/utm";
import { reachGoal } from "@/lib/metrika";

type CartProduct = {
  slug: string;
  name: string;
  decorName: string;
  images: string[];
  brand: { name: string };
};

type SubmitState = "idle" | "submitting" | "error";

export function SamplesCartView() {
  const router = useRouter();
  const [slugs, setSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSlugs(getSampleCart());
    return onSampleCartChange(setSlugs);
  }, []);

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/products/by-slugs?slugs=${slugs.join(",")}`)
      .then((r) => r.json())
      .then((data: CartProduct[]) => setProducts(data))
      .finally(() => setLoading(false));
  }, [slugs]);

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
      const response = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address,
          consent,
          website,
          productSlugs: slugs,
          pageUrl: window.location.href,
          utm: readUtmFromLocation(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Не удалось отправить заявку, попробуйте ещё раз");
        setState("error");
        return;
      }

      reachGoal("lead_samples");
      clearSampleCart();
      router.push("/thanks?type=samples");
    } catch {
      setError("Не удалось отправить заявку, проверьте соединение");
      setState("error");
    }
  }

  if (loading) return null;

  if (slugs.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 p-8 text-center">
        <p className="text-stone-600">Список образцов пуст.</p>
        <Link href="/catalog" className="mt-4 inline-block font-medium text-blue-600 hover:underline">
          Перейти в каталог →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.slug} className="flex items-center gap-4 rounded-lg border border-stone-200 p-3">
            <div className="relative h-16 w-16 flex-shrink-0 rounded-md bg-stone-100">
              {product.images[0] && (
                <Image src={product.images[0]} alt={product.decorName} fill sizes="64px" className="rounded-md object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-stone-500">{product.brand.name}</p>
              <p className="font-medium text-stone-900">{product.decorName}</p>
            </div>
            <button
              type="button"
              onClick={() => removeFromSampleCart(product.slug)}
              className="text-sm text-stone-500 hover:text-red-600"
            >
              Убрать
            </button>
          </div>
        ))}
        <p className="pt-2 text-sm text-stone-600">
          Доставка образцов: {formatPrice(SAMPLE_DELIVERY_PRICE)} — засчитывается в итоговый заказ
          покрытия.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="h-fit space-y-4 rounded-lg border border-stone-200 p-6">
        <div>
          <label htmlFor="samples-name" className="block text-sm font-medium text-stone-700">
            Имя
          </label>
          <input
            id="samples-name"
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="samples-phone" className="block text-sm font-medium text-stone-700">
            Телефон
          </label>
          <input
            id="samples-phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="+7 (___) ___-__-__"
            value={phone}
            onChange={(e) => setPhone(formatRuPhone(e.target.value))}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="samples-address" className="block text-sm font-medium text-stone-700">
            Адрес доставки
          </label>
          <textarea
            id="samples-address"
            required
            minLength={5}
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Москва, ул. ..., д. ..., кв. ..."
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor="samples-website">Website</label>
          <input id="samples-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="samples-consent"
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-600"
          />
          <label htmlFor="samples-consent" className="text-sm text-stone-600">
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
          {state === "submitting" ? "Отправка…" : "Заказать образцы"}
        </button>
      </form>
    </div>
  );
}
