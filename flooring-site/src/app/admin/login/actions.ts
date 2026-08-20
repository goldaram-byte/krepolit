"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/server/password";
import { createSession } from "@/server/auth";
import { isRateLimited } from "@/lib/rate-limit";

export type LoginState = { error?: string };

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? "unknown";
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await getClientIp();
  if (isRateLimited(`admin-login:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 })) {
    return { error: "Слишком много попыток входа. Попробуйте позже." };
  }

  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { login } });
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    return { error: "Неверный логин или пароль" };
  }

  await createSession(user.id);
  redirect("/admin");
}
