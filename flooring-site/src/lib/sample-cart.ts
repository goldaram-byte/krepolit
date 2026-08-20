// Client-only localStorage cart of product slugs for the sample-order flow
// (SPEC.md §5: "Корзина образцов до 5 штук"). No server session exists, so
// the cart lives entirely in the browser until /samples submits it as a lead.
import { MAX_SAMPLE_ITEMS } from "@/lib/samples";

const STORAGE_KEY = "sampleCart";
const CHANGE_EVENT = "samplecart:change";

function readCart(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeCart(slugs: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: slugs }));
}

export function getSampleCart(): string[] {
  return readCart();
}

export function addToSampleCart(slug: string): string[] {
  const current = readCart();
  if (current.includes(slug) || current.length >= MAX_SAMPLE_ITEMS) return current;
  const next = [...current, slug];
  writeCart(next);
  return next;
}

export function removeFromSampleCart(slug: string): string[] {
  const next = readCart().filter((s) => s !== slug);
  writeCart(next);
  return next;
}

export function clearSampleCart(): void {
  writeCart([]);
}

export function onSampleCartChange(listener: (slugs: string[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => listener((event as CustomEvent<string[]>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
