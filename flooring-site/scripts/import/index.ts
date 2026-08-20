import "dotenv/config";
import { prisma } from "@/lib/db";
import { runImport } from "@/lib/import/run-import";
import { formatImportReport, sendImportReport } from "@/lib/import/report";

function parseArgs(argv: string[]): { supplierId: string; downloadImages: boolean } {
  const supplierArg = argv.find((arg) => arg.startsWith("--supplier="));
  const supplierId = supplierArg?.slice("--supplier=".length);
  if (!supplierId) {
    throw new Error("Usage: npm run import -- --supplier=<id> [--no-images]");
  }
  return { supplierId, downloadImages: !argv.includes("--no-images") };
}

async function main() {
  const { supplierId, downloadImages } = parseArgs(process.argv.slice(2));

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new Error(`Supplier not found: ${supplierId}`);
  }

  console.log(`Importing from supplier "${supplier.name}" (${supplier.feedType ?? "unknown format"})...`);

  const stats = await runImport(prisma, supplier, { downloadImages });

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
