import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";
import { sampleOrderSchema } from "@/lib/validation";
import { SAMPLE_DELIVERY_PRICE } from "@/lib/samples";

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Слишком много заявок. Попробуйте позже." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const parsed = sampleOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте правильность заполнения формы", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot tripped: pretend success so bots don't learn to avoid the field.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: data.productSlugs }, isPublished: true },
    select: { id: true, name: true },
  });

  if (products.length === 0) {
    return NextResponse.json(
      { error: "Выбранные образцы не найдены, обновите страницу и попробуйте снова" },
      { status: 400 },
    );
  }

  const { lead, sampleOrder } = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        type: "samples",
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: `Адрес доставки: ${data.address}`,
        pageUrl: data.pageUrl || null,
        utm: data.utm ?? undefined,
      },
    });

    const sampleOrder = await tx.sampleOrder.create({
      data: {
        leadId: lead.id,
        productIds: products.map((p) => p.id),
        address: data.address,
        deliveryPrice: SAMPLE_DELIVERY_PRICE,
      },
    });

    return { lead, sampleOrder };
  });

  const message = [
    "Новая заявка: заказ образцов",
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    `Образцы: ${products.map((p) => p.name).join(", ")}`,
    `Адрес: ${sampleOrder.address}`,
    `Стоимость доставки: ${SAMPLE_DELIVERY_PRICE} ₽ (зачитывается в заказ)`,
    lead.pageUrl ? `Страница: ${lead.pageUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendTelegramMessage(message);

  return NextResponse.json({ ok: true });
}
