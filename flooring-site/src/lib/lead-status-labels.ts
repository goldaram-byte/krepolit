import { LeadStatus } from "@/generated/prisma/enums";

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Завершена",
  rejected: "Отклонена",
};

export const leadStatusValues = Object.values(LeadStatus);
