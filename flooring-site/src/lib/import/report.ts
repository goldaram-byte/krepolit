import { sendTelegramMessage } from "@/lib/telegram";
import type { ImportStats } from "./types";

export function formatImportReport(stats: ImportStats): string {
  return [
    `Импорт каталога: ${stats.supplierName}`,
    `Товаров в фиде: ${stats.totalInFeed}`,
    `Создано: ${stats.created}`,
    `Обновлено: ${stats.updated}`,
    `Ушло в «нет в наличии»: ${stats.wentOutOfStock}`,
    `Цена изменилась > 10%: ${stats.priceChangedOver10Percent}`,
    `Цена ниже РРЦ (флаг на проверку): ${stats.belowRrc}`,
    `Пропущено (невалидные строки): ${stats.skippedInvalid}`,
  ].join("\n");
}

export async function sendImportReport(stats: ImportStats): Promise<void> {
  await sendTelegramMessage(formatImportReport(stats));
}
