import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "Напольные покрытия оптом и в розницу — Москва и МО",
    template: "%s — напольные покрытия",
  },
  description:
    "Онлайн-дилер напольных покрытий в Москве и МО: кварцвинил, ламинат, керамогранит. Расчёт метража, образцы с доставкой, выезд специалиста.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} flex min-h-screen flex-col antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
