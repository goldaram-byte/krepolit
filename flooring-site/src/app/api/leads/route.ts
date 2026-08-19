import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isRateLimited } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";
import { leadFormSchema } from "@/lib/validation";
import { leadTypeLabels } from "@/lib/lead-labels";

function getClientIp(request: NextRequest): string {
  // Behind nginx (see SPEC.md §2 / deploy/nginx.conf), the real client IP
  // arrives via X-Forwarded-For; take the first (client) hop.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function buildTelegramMessage(
  lead: { name: string; phone: string; email: string | null; message: string | null; pageUrl: string | null },
  typeLabel: string,
): string {
  const lines = [
    `Новая заявка: ${typeLabel}`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
  ];
  if (lead.email) lines.push(`Email: ${lead.email}`);
  if (lead.message) lines.push(`Сообщение: ${lead.message}`);
  if (lead.pageUrl) lines.push(`Страница: ${lead.pageUrl}`);
  return lines.join("\n");
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

  const parsed = leadFormSchema.safeParse(json);
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

  try {
    const lead = await prisma.lead.create({
      data: {
        type: data.type,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message || null,
        pageUrl: data.pageUrl || null,
        utm: data.utm ?? undefined,
      },
    });

    // Notification failures are logged inside sendTelegramMessage and must
    // not fail the request — the lead is already saved at this point.
    await sendTelegramMessage(buildTelegramMessage(lead, leadTypeLabels[data.type]));
  } catch (error) {
    console.error("Failed to save lead:", error);
    return NextResponse.json(
      { error: "Не удалось сохранить заявку, попробуйте позже" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
