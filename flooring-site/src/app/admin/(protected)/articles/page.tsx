import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Статьи</h1>
        <Link href="/admin/articles/new" className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
          Новая статья
        </Link>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2">Заголовок</th>
            <th className="py-2">Статус</th>
            <th className="py-2">Обновлена</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id} className="border-b border-stone-100">
              <td className="py-2">{a.title}</td>
              <td className="py-2">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    a.publishedAt ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {a.publishedAt ? "Опубликована" : "Черновик"}
                </span>
              </td>
              <td className="py-2 text-stone-500">{a.updatedAt.toLocaleDateString("ru-RU")}</td>
              <td className="py-2 text-right">
                <Link href={`/admin/articles/${a.id}`} className="text-blue-600 hover:underline">
                  Редактировать
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
