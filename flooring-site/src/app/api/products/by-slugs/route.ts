import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const slugsParam = request.nextUrl.searchParams.get("slugs");
  const slugs = slugsParam ? slugsParam.split(",").filter(Boolean) : [];
  if (slugs.length === 0) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isPublished: true },
    select: {
      slug: true,
      name: true,
      decorName: true,
      images: true,
      brand: { select: { name: true } },
    },
  });

  return NextResponse.json(products);
}
