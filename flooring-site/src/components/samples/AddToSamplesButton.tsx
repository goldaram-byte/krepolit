"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addToSampleCart, getSampleCart, onSampleCartChange } from "@/lib/sample-cart";
import { MAX_SAMPLE_ITEMS } from "@/lib/samples";

export function AddToSamplesButton({ slug }: { slug: string }) {
  const [cart, setCart] = useState<string[]>([]);

  useEffect(() => {
    setCart(getSampleCart());
    return onSampleCartChange(setCart);
  }, []);

  const inCart = cart.includes(slug);
  const isFull = cart.length >= MAX_SAMPLE_ITEMS && !inCart;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={inCart || isFull}
        onClick={() => addToSampleCart(slug)}
        className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {inCart ? "В списке образцов" : "Заказать образец"}
      </button>

      {isFull && <span className="text-sm text-stone-500">Можно выбрать не более {MAX_SAMPLE_ITEMS} образцов</span>}

      {cart.length > 0 && (
        <Link href="/samples" className="text-sm font-medium text-blue-600 hover:underline">
          Перейти к образцам ({cart.length})
        </Link>
      )}
    </div>
  );
}
