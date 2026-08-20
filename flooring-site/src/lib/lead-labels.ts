import type { LeadTypeValue } from "@/lib/validation";

export const leadTypeLabels: Record<LeadTypeValue, string> = {
  samples: "Заказ образцов",
  estimate: "Расчёт метража и сметы",
  site_visit: "Выезд специалиста",
  consultation: "Консультация",
  callback: "Обратный звонок",
  partner: "Партнёрская заявка",
};
