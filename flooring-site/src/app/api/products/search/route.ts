import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { decorName: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: { slug: true, name: true, decorName: true, m2PerPack: true, ourPrice: true },
  });

  return NextResponse.json(
    products.map((p) => ({
      slug: p.slug,
      name: p.name,
      decorName: p.decorName,
      m2PerPack: p.m2PerPack.toNumber(),
      ourPrice: p.ourPrice.toNumber(),
    })),
  );
}
