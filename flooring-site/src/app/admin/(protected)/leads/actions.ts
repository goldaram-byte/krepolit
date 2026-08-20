"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { LeadStatus } from "@/generated/prisma/enums";

export async function updateLeadAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!id || !(Object.values(LeadStatus) as string[]).includes(status)) return;

  await prisma.lead.update({
    where: { id },
    data: { status: status as LeadStatus, note: note || null },
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}
