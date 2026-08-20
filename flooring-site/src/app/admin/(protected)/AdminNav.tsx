import Link from "next/link";
import { logoutAction } from "./actions";

const nav = [
  { href: "/admin", label: "Дашборд" },
  { href: "/admin/leads", label: "Лиды" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/suppliers", label: "Поставщики" },
  { href: "/admin/articles", label: "Статьи" },
];

export function AdminNav() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <nav className="flex flex-wrap gap-4 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-stone-600 hover:text-stone-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-stone-500 hover:text-red-600">
            Выйти
          </button>
        </form>
      </div>
    </header>
  );
}
