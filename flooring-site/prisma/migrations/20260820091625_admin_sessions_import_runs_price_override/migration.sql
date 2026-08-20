-- AlterTable
ALTER TABLE "admin_sessions" ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "priceOverridden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "import_runs" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stats" JSONB NOT NULL,

    CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_runs_supplierId_idx" ON "import_runs"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_tokenHash_key" ON "admin_sessions"("tokenHash");

-- AddForeignKey
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

