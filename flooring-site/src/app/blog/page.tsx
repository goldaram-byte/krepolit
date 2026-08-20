import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Блог",
  description: "Статьи о выборе напольных покрытий: кварцвинил, ламинат, укладка на тёплый пол.",
};

export const revalidate = 3600;

export default async function BlogPage() {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, excerpt: true, publishedAt: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-2xl font-bold text-stone-900">Блог</h1>

      {articles.length === 0 ? (
        <p className="mt-6 text-stone-500">Статей пока нет.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {articles.map((article) => (
            <article key={article.slug} className="border-b border-stone-200 pb-8">
              <p className="text-xs text-stone-400">
                {article.publishedAt?.toLocaleDateString("ru-RU")}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-stone-900">
                <Link href={`/blog/${article.slug}`} className="hover:text-blue-600">
                  {article.title}
                </Link>
              </h2>
              {article.excerpt && <p className="mt-2 text-stone-600">{article.excerpt}</p>}
              <Link
                href={`/blog/${article.slug}`}
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                Читать →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
