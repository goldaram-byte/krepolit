"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export async function togglePublishAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const isPublished = formData.get("isPublished") === "true";
  if (!id) return;

  await prisma.product.update({ where: { id }, data: { isPublished: !isPublished } });
  revalidatePath("/admin/products");
}

export async function updateProductAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const isPublished = formData.get("isPublished") === "on";
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const priceRaw = String(formData.get("ourPrice") ?? "").trim();
  const overridePrice = formData.get("overridePrice") === "on";

  const data: Prisma.ProductUpdateInput = {
    isPublished,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
  };

  if (overridePrice && priceRaw) {
    // The RRC floor (SPEC.md §3) is not a client-side hint — enforce it
    // here too, since a manual override is exactly the place a price could
    // otherwise slip below it.
    const product = await prisma.product.findUnique({ where: { id }, select: { rrcPrice: true } });
    let price = new Prisma.Decimal(priceRaw);
    if (product?.rrcPrice && price.lessThan(product.rrcPrice)) {
      price = product.rrcPrice;
    }
    data.ourPrice = price;
    data.priceOverridden = true;
  } else if (!overridePrice) {
    data.priceOverridden = false;
  }

  await prisma.product.update({ where: { id }, data });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  redirect("/admin/products");
}
