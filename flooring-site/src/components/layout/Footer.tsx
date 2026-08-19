import Link from "next/link";

const nav = [
  { href: "/about", label: "О компании" },
  { href: "/delivery", label: "Доставка и оплата" },
  { href: "/contacts", label: "Контакты" },
  { href: "/privacy", label: "Политика конфиденциальности" },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-600">
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-stone-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 text-stone-500">
          © {new Date().getFullYear()} Онлайн-дилер напольных покрытий. Москва и МО.
        </p>
      </div>
    </footer>
  );
}
