import { readFile } from "node:fs/promises";
import { parse as parseCsv } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { guessDecorType } from "./param-mapping";
import { isTruthy, parseNumber } from "./parse-utils";
import type { ColumnMapping, NormalizedOffer } from "./types";

async function loadBytes(source: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(source);
}

async function readXlsxRows(bytes: Buffer): Promise<Record<string, string>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) record[header] = String(cell.value ?? "").trim();
    });
    rows.push(record);
  });

  return rows;
}

function readCsvRows(bytes: Buffer): Record<string, string>[] {
  return parseCsv(bytes, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

function toOffer(row: Record<string, string>, mapping: ColumnMapping): NormalizedOffer | null {
  const get = (key: keyof ColumnMapping): string => {
    const column = mapping[key];
    return column ? (row[column] ?? "").trim() : "";
  };

  const sku = get("sku");
  const name = get("name");
  if (!sku || !name) return null;

  const rawDecorType = get("decorType");
  const categoryName = get("categoryName");
  const rawImageUrls = get("imageUrls");
  const rawAvailable = get("available");

  return {
    sku,
    name,
    categoryPath: categoryName ? [categoryName] : null,
    vendor: get("vendor") || null,
    decorName: get("decorName") || name,
    decorType: (rawDecorType && guessDecorType(rawDecorType)) || guessDecorType(name),
    lengthMm: parseNumber(get("lengthMm")),
    widthMm: parseNumber(get("widthMm")),
    thicknessMm: parseNumber(get("thicknessMm")),
    wearLayerMm: parseNumber(get("wearLayerMm")),
    wearClass: get("wearClass") || null,
    m2PerPack: parseNumber(get("m2PerPack")),
    packsPerPallet: parseNumber(get("packsPerPallet")),
    weightKg: parseNumber(get("weightKg")),
    waterproof: isTruthy(get("waterproof")),
    warmFloorCompatible: isTruthy(get("warmFloorCompatible")),
    purchasePrice: parseNumber(get("purchasePrice")) ?? 0,
    oldPrice: parseNumber(get("oldPrice")),
    rrcPrice: parseNumber(get("rrcPrice")),
    stockQty: parseNumber(get("stockQty")),
    available: rawAvailable ? isTruthy(rawAvailable) : true,
    imageUrls: rawImageUrls
      ? rawImageUrls.split(/[,;|]/).map((u) => u.trim()).filter(Boolean)
      : [],
  };
}

export async function parseXlsxFeed(
  source: string,
  mapping: ColumnMapping,
): Promise<NormalizedOffer[]> {
  const rows = await readXlsxRows(await loadBytes(source));
  return rows.map((row) => toOffer(row, mapping)).filter((o) => o !== null);
}

export async function parseCsvFeed(
  source: string,
  mapping: ColumnMapping,
): Promise<NormalizedOffer[]> {
  const rows = readCsvRows(await loadBytes(source));
  return rows.map((row) => toOffer(row, mapping)).filter((o) => o !== null);
}
