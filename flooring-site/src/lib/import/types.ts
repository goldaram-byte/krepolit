import type { DecorType } from "@/generated/prisma/enums";

// Feed-agnostic shape produced by both the YML and XLSX/CSV parsers, so the
// upsert logic in upsert.ts doesn't need to know which format it came from.
export type NormalizedOffer = {
  sku: string;
  name: string;
  /** Root-to-leaf category names, e.g. ["Ламинат", "32 класс"]. The last
   * entry is the Product's categoryId; earlier entries become its ancestors. */
  categoryPath: string[] | null;
  vendor: string | null;
  decorName: string;
  decorType: DecorType | null;
  lengthMm: number | null;
  widthMm: number | null;
  thicknessMm: number | null;
  wearLayerMm: number | null;
  wearClass: string | null;
  m2PerPack: number | null;
  packsPerPallet: number | null;
  weightKg: number | null;
  waterproof: boolean;
  warmFloorCompatible: boolean;
  purchasePrice: number;
  oldPrice: number | null;
  rrcPrice: number | null;
  stockQty: number | null;
  available: boolean;
  imageUrls: string[];
};

// Keys match NormalizedOffer fields (minus categoryPath, which is built from
// `categoryName`); values are the column header text in the supplier's file.
// Stored as Supplier.columnMapping (JSON) and configured per supplier.
export type ColumnMapping = Partial<{
  sku: string;
  name: string;
  categoryName: string;
  vendor: string;
  decorName: string;
  decorType: string;
  lengthMm: string;
  widthMm: string;
  thicknessMm: string;
  wearLayerMm: string;
  wearClass: string;
  m2PerPack: string;
  packsPerPallet: string;
  weightKg: string;
  waterproof: string;
  warmFloorCompatible: string;
  purchasePrice: string;
  oldPrice: string;
  rrcPrice: string;
  stockQty: string;
  available: string;
  imageUrls: string;
}>;

export type ImportStats = {
  supplierName: string;
  created: number;
  updated: number;
  wentOutOfStock: number;
  priceChangedOver10Percent: number;
  belowRrc: number;
  skippedInvalid: number;
  totalInFeed: number;
};
