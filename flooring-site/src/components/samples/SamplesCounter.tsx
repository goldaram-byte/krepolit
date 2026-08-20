"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSampleCart, onSampleCartChange } from "@/lib/sample-cart";

export function SamplesCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getSampleCart().length);
    return onSampleCartChange((slugs) => setCount(slugs.length));
  }, []);

  if (count === 0) return null;

  return (
    <Link
      href="/samples"
      className="rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
    >
      Образцы ({count})
    </Link>
  );
}
