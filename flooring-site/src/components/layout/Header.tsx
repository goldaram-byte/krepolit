import Link from "next/link";
import { SamplesCounter } from "@/components/samples/SamplesCounter";

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/pro", label: "Дизайнерам и бригадам" },
  { href: "/about", label: "О компании" },
  { href: "/delivery", label: "Доставка и оплата" },
  { href: "/contacts", label: "Контакты" },
];

export function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {/* TODO: replace with real brand name/logo once decided */}
        <Link href="/" className="text-lg font-semibold text-stone-900">
          Напольные покрытия
        </Link>
        <nav className="hidden gap-6 text-sm text-stone-600 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-stone-900">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <SamplesCounter />
          <a
            href="tel:+70000000000"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Позвонить
          </a>
        </div>
      </div>
    </header>
  );
}
