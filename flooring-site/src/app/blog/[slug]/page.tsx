import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { renderArticle, extractFaq } from "@/lib/markdown";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";

export const revalidate = 3600;

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

async function getArticle(slug: string) {
  return prisma.article.findUnique({ where: { slug } });
}

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true },
  });
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || !article.publishedAt) return {};

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || undefined,
    alternates: { canonical: `/blog/${article.slug}` },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || !article.publishedAt) notFound();

  const { html, headings } = renderArticle(article.body);
  const faq = extractFaq(article.body);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <BreadcrumbJsonLd
        items={[
          { name: "Блог", path: "/blog" },
          { name: article.title, path: `/blog/${article.slug}` },
        ]}
      />
      {faq.length > 0 && <FaqJsonLd items={faq} />}

      <nav aria-label="Хлебные крошки" className="mb-4 text-sm text-stone-500">
        <Link href="/blog" className="hover:text-stone-900">
          Блог
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-stone-900">{article.title}</h1>
      <p className="mt-1 text-sm text-stone-400">
        {article.publishedAt.toLocaleDateString("ru-RU")}
      </p>

      {headings.length > 1 && (
        <nav aria-label="Оглавление" className="mt-6 rounded-lg border border-stone-200 p-4">
          <p className="text-sm font-medium text-stone-900">Содержание</p>
          <ul className="mt-2 space-y-1 text-sm">
            {headings.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="text-blue-600 hover:underline">
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
