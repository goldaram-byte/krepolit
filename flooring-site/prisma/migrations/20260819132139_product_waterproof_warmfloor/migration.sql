-- AlterTable
ALTER TABLE "products" ADD COLUMN     "warmFloorCompatible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "waterproof" BOOLEAN NOT NULL DEFAULT false;
