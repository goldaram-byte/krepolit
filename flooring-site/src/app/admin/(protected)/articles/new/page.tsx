import { createArticleAction } from "../actions";

export default function AdminNewArticlePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900">Новая статья</h1>

      <form action={createArticleAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-stone-700">
            Заголовок
          </label>
          <input
            id="title"
            type="text"
            name="title"
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
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-stone-700">
            Текст (Markdown, заголовки разделов — <code>## Заголовок</code>)
          </label>
          <textarea
            id="body"
            name="body"
            rows={16}
            className="mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input id="publish" type="checkbox" name="publish" className="h-4 w-4 rounded border-stone-300" />
          <label htmlFor="publish" className="text-sm text-stone-700">
            Опубликовать сразу
          </label>
        </div>

        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Создать
        </button>
      </form>
    </div>
  );
}
