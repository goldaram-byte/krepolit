import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { parseYmlFeed } from "./yml";
import { parseXlsxFeed, parseCsvFeed } from "./xlsx-csv";
import { upsertOffers } from "./upsert";
import type { ColumnMapping, ImportStats, NormalizedOffer } from "./types";

export type ImportableSupplier = {
  id: string;
  name: string;
  markupPercent: Prisma.Decimal;
  feedType: string | null;
  feedUrl: string | null;
  columnMapping: unknown;
};

function asColumnMapping(value: unknown): ColumnMapping {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ColumnMapping)
    : {};
}

async function loadOffers(
  feedType: string | null,
  feedUrl: string | null,
  columnMapping: ColumnMapping,
): Promise<NormalizedOffer[]> {
  if (!feedUrl) throw new Error("Supplier has no feedUrl configured");

  switch (feedType) {
    case "yml":
      return parseYmlFeed(feedUrl);
    case "xlsx":
      return parseXlsxFeed(feedUrl, columnMapping);
    case "csv":
      return parseCsvFeed(feedUrl, columnMapping);
    default:
      throw new Error(`Unsupported or missing feedType: ${feedType}`);
  }
}

// Shared by the CLI (scripts/import/index.ts, cron-driven) and the admin
// "run import" button — one code path, so both trigger the exact same
// parsing/pricing/upsert logic and both get logged to ImportRun.
export async function runImport(
  prisma: PrismaClient,
  supplier: ImportableSupplier,
  options: { downloadImages: boolean },
): Promise<ImportStats> {
  const offers = await loadOffers(
    supplier.feedType,
    supplier.feedUrl,
    asColumnMapping(supplier.columnMapping),
  );

  const stats = await upsertOffers(prisma, supplier, offers, options);

  await prisma.importRun.create({
    data: { supplierId: supplier.id, stats: stats as unknown as Prisma.InputJsonValue },
  });

  return stats;
}
