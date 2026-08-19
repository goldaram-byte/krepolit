import "dotenv/config";
import { prisma } from "@/lib/db";
import { parseYmlFeed } from "./yml";
import { parseXlsxFeed, parseCsvFeed } from "./xlsx-csv";
import { upsertOffers } from "./upsert";
import { formatImportReport, sendImportReport } from "./report";
import type { ColumnMapping, NormalizedOffer } from "./types";

function parseArgs(argv: string[]): { supplierId: string; downloadImages: boolean } {
  const supplierArg = argv.find((arg) => arg.startsWith("--supplier="));
  const supplierId = supplierArg?.slice("--supplier=".length);
  if (!supplierId) {
    throw new Error("Usage: npm run import -- --supplier=<id> [--no-images]");
  }
  return { supplierId, downloadImages: !argv.includes("--no-images") };
}

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

async function main() {
  const { supplierId, downloadImages } = parseArgs(process.argv.slice(2));

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new Error(`Supplier not found: ${supplierId}`);
  }

  console.log(`Importing from supplier "${supplier.name}" (${supplier.feedType ?? "unknown format"})...`);

  const offers = await loadOffers(
    supplier.feedType,
    supplier.feedUrl,
    asColumnMapping(supplier.columnMapping),
  );

  console.log(`Parsed ${offers.length} offers, upserting...`);

  const stats = await upsertOffers(prisma, supplier, offers, { downloadImages });

  console.log(formatImportReport(stats));
  await sendImportReport(stats);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
