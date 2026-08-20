import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { escapeXml } from "@/lib/xml";

// YML (Yandex Market) feed of our own published catalog, for Yandex Direct
// and the товарная галерея (SPEC.md §6). Prices are always `ourPrice` —
// already RRC-safe, so this feed can never advertise a dumped price.
export const revalidate = 3600;

function formatFeedDate(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export async function GET() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, parentId: true } }),
    prisma.product.findMany({
      where: { isPublished: true },
      select: {
        sku: true,
        slug: true,
        name: true,
        categoryId: true,
        images: true,
        ourPrice: true,
        stockStatus: true,
        brand: { select: { name: true } },
      },
    }),
  ]);

  const categoriesXml = categories
    .map(
      (c) =>
        `    <category id="${escapeXml(c.id)}"${c.parentId ? ` parentId="${escapeXml(c.parentId)}"` : ""}>${escapeXml(c.name)}</category>`,
    )
    .join("\n");

  const offersXml = products
    .map((p) => {
      const url = `${SITE_URL}/product/${p.slug}`;
      const pictures = p.images
        .slice(0, 10)
        .map((src) => `      <picture>${escapeXml(`${SITE_URL}${src}`)}</picture>`)
        .join("\n");
      const available = p.stockStatus !== "out_of_stock";

      return [
        `    <offer id="${escapeXml(p.sku)}" available="${available}">`,
        `      <url>${escapeXml(url)}</url>`,
        `      <price>${p.ourPrice.toNumber()}</price>`,
        `      <currencyId>RUR</currencyId>`,
        `      <categoryId>${escapeXml(p.categoryId)}</categoryId>`,
        pictures,
        `      <name>${escapeXml(p.name)}</name>`,
        `      <vendor>${escapeXml(p.brand.name)}</vendor>`,
        `    </offer>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${formatFeedDate(new Date())}">
  <shop>
    <name>${escapeXml(SITE_NAME)}</name>
    <company>${escapeXml(SITE_NAME)}</company>
    <url>${escapeXml(SITE_URL)}</url>
    <currencies>
      <currency id="RUR" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>
`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
