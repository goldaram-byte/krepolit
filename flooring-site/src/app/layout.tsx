import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { YandexMetrika } from "@/components/analytics/YandexMetrika";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
        <OrganizationJsonLd />
        <YandexMetrika />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
