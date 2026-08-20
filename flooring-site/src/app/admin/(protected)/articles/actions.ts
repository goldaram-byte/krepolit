"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "article";
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await prisma.article.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function createArticleAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const body = String(formData.get("body") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const publish = formData.get("publish") === "on";

  const article = await prisma.article.create({
    data: {
      title,
      slug: await uniqueSlug(title),
      body,
      excerpt: excerpt || null,
      publishedAt: publish ? new Date() : null,
    },
  });

  revalidatePath("/admin/articles");
  revalidatePath("/blog");
  redirect(`/admin/articles/${article.id}`);
}

export async function updateArticleAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;

  const body = String(formData.get("body") ?? "");
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const seoTitle = String(formData.get("seoTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const publish = formData.get("publish") === "on";

  const existing = await prisma.article.findUnique({
    where: { id },
    select: { publishedAt: true, slug: true },
  });

  await prisma.article.update({
    where: { id },
    data: {
      title,
      body,
      excerpt: excerpt || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      publishedAt: publish ? (existing?.publishedAt ?? new Date()) : null,
    },
  });

  revalidatePath("/admin/articles");
  revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/blog");
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
  redirect("/admin/articles");
}
