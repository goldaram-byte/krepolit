import type { LeadTypeValue } from "@/lib/validation";

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void;
  }
}

// No real counter exists yet — set NEXT_PUBLIC_YANDEX_METRIKA_ID on the VPS
// once one is created. Everything here is a no-op until then.
export const YANDEX_METRIKA_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

// One goal per target action (SPEC.md §1/§2 — "цели на каждое целевое действие").
export type MetrikaGoal =
  | "lead_samples"
  | "lead_estimate"
  | "lead_site_visit"
  | "lead_consultation"
  | "lead_callback"
  | "lead_partner";

export const leadTypeToGoal: Record<LeadTypeValue, MetrikaGoal> = {
  samples: "lead_samples",
  estimate: "lead_estimate",
  site_visit: "lead_site_visit",
  consultation: "lead_consultation",
  callback: "lead_callback",
  partner: "lead_partner",
};

export function reachGoal(goal: MetrikaGoal): void {
  if (typeof window === "undefined" || !YANDEX_METRIKA_ID || !window.ym) return;
  window.ym(Number(YANDEX_METRIKA_ID), "reachGoal", goal);
}
