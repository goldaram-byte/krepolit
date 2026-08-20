import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateArticleAction } from "../actions";

type ArticleEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminArticleEditPage({ params }: ArticleEditPageProps) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/articles" className="text-sm text-blue-600 hover:underline">
        ← К списку статей
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">{article.title}</h1>
      <p className="text-sm text-stone-500">/blog/{article.slug}</p>

      <form action={updateArticleAction} className="mt-6 space-y-4">
        <input type="hidden" name="id" value={article.id} />

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-stone-700">
            Заголовок
          </label>
          <input
            id="title"
            type="text"
            name="title"
            defaultValue={article.title}
            required
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-stone-700">
            Краткое описание
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={article.excerpt ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-stone-700">
            Текст (Markdown)
          </label>
          <textarea
            id="body"
            name="body"
            rows={20}
            defaultValue={article.body}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="seoTitle" className="block text-sm font-medium text-stone-700">
            SEO-заголовок
          </label>
          <input
            id="seoTitle"
            type="text"
            name="seoTitle"
            defaultValue={article.seoTitle ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="seoDescription" className="block text-sm font-medium text-stone-700">
            SEO-описание
          </label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={2}
            defaultValue={article.seoDescription ?? ""}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="publish"
            type="checkbox"
            name="publish"
            defaultChecked={!!article.publishedAt}
            className="h-4 w-4 rounded border-stone-300"
          />
          <label htmlFor="publish" className="text-sm text-stone-700">
            Опубликована
          </label>
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Сохранить
        </button>
      </form>
    </div>
  );
}
