"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { FeedType } from "@/generated/prisma/enums";
import { runImport } from "@/lib/import/run-import";

function parseFeedType(value: string): FeedType | null {
  return (Object.values(FeedType) as string[]).includes(value) ? (value as FeedType) : null;
}

function parseColumnMapping(raw: string): Prisma.InputJsonValue | undefined {
  if (!raw.trim()) return undefined;
  try {
    return JSON.parse(raw) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

export async function createSupplierAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const markupPercent = String(formData.get("markupPercent") ?? "0");
  if (!name) return;

  const supplier = await prisma.supplier.create({
    data: { name, markupPercent: new Prisma.Decimal(markupPercent) },
  });

  revalidatePath("/admin/suppliers");
  redirect(`/admin/suppliers/${supplier.id}`);
}

export async function updateSupplierAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const name = String(formData.get("name") ?? "").trim();
  const feedUrl = String(formData.get("feedUrl") ?? "").trim();
  const feedType = parseFeedType(String(formData.get("feedType") ?? ""));
  const markupPercent = String(formData.get("markupPercent") ?? "0");
  const deliveryTerms = String(formData.get("deliveryTerms") ?? "").trim();
  const columnMapping = parseColumnMapping(String(formData.get("columnMapping") ?? ""));

  await prisma.supplier.update({
    where: { id },
    data: {
      name,
      feedUrl: feedUrl || null,
      feedType,
      markupPercent: new Prisma.Decimal(markupPercent),
      deliveryTerms: deliveryTerms || null,
      columnMapping,
    },
  });

  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
}

export async function runImportAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const downloadImages = formData.get("downloadImages") === "on";
  if (!id) return;

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return;

  await runImport(prisma, supplier, { downloadImages });

  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
  revalidatePath("/admin");
}
