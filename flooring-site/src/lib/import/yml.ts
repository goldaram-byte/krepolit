import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import { guessDecorType, parseParams } from "./param-mapping";
import type { NormalizedOffer } from "./types";

type RawCategory = {
  "#text": string;
  "@_id": string;
  "@_parentId"?: string;
};

type RawParam = {
  "#text": string;
  "@_name": string;
};

type RawOffer = {
  "@_id": string;
  "@_available"?: string;
  name?: string;
  model?: string;
  vendor?: string;
  price?: number | string;
  oldprice?: number | string;
  categoryId?: number | string;
  picture?: string[];
  param?: RawParam[];
  quantity_in_stock?: number | string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (tagName) => ["category", "offer", "param", "picture"].includes(tagName),
});

async function loadFeedText(source: string): Promise<string> {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }
  return readFile(source, "utf-8");
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const num = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(num) ? num : null;
}

function paramsToRecord(params: RawParam[] | undefined): Record<string, string> {
  const record: Record<string, string> = {};
  for (const param of params ?? []) {
    record[param["@_name"]] = String(param["#text"] ?? "");
  }
  return record;
}

// Resolves a YML categoryId into its root-to-leaf name path by walking
// parentId links (YML categories form a shallow tree, cycles aren't expected
// but are guarded against anyway).
function buildCategoryPathResolver(rawCategories: RawCategory[]) {
  const byId = new Map(rawCategories.map((c) => [c["@_id"], c]));

  return (categoryId: string | null): string[] | null => {
    if (!categoryId) return null;
    const path: string[] = [];
    const seen = new Set<string>();
    let current = byId.get(categoryId);
    while (current && !seen.has(current["@_id"])) {
      seen.add(current["@_id"]);
      path.unshift(String(current["#text"] ?? "").trim());
      current = current["@_parentId"] ? byId.get(current["@_parentId"]) : undefined;
    }
    return path.length > 0 ? path : null;
  };
}

export async function parseYmlFeed(source: string): Promise<NormalizedOffer[]> {
  const xml = await loadFeedText(source);
  const parsed = parser.parse(xml) as {
    yml_catalog?: { shop?: { categories?: { category?: RawCategory[] }; offers?: { offer?: RawOffer[] } } };
  };

  const shop = parsed.yml_catalog?.shop;
  const rawCategories = shop?.categories?.category ?? [];
  const rawOffers = shop?.offers?.offer ?? [];
  const resolveCategoryPath = buildCategoryPathResolver(rawCategories);

  return rawOffers.map((offer) => {
    const paramRecord = paramsToRecord(offer.param);
    const parsedParams = parseParams(paramRecord);
    const name = String(offer.name ?? offer.model ?? "").trim();
    const decorName = paramRecord["Декор"] ?? paramRecord["Цвет"] ?? name;

    return {
      sku: offer["@_id"],
      name,
      categoryPath: resolveCategoryPath(
        offer.categoryId != null ? String(offer.categoryId) : null,
      ),
      vendor: offer.vendor?.trim() || null,
      decorName,
      decorType: parsedParams.decorType ?? guessDecorType(name),
      lengthMm: parsedParams.lengthMm,
      widthMm: parsedParams.widthMm,
      thicknessMm: parsedParams.thicknessMm,
      wearLayerMm: parsedParams.wearLayerMm,
      wearClass: parsedParams.wearClass,
      m2PerPack: parsedParams.m2PerPack,
      packsPerPallet: parsedParams.packsPerPallet,
      weightKg: parsedParams.weightKg,
      waterproof: parsedParams.waterproof,
      warmFloorCompatible: parsedParams.warmFloorCompatible,
      purchasePrice: toNumber(offer.price) ?? 0,
      oldPrice: toNumber(offer.oldprice),
      rrcPrice: parsedParams.rrcPrice,
      stockQty: toNumber(offer.quantity_in_stock),
      available: offer["@_available"] !== "false",
      imageUrls: offer.picture ?? [],
    };
  });
}
