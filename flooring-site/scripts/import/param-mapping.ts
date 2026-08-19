import { DecorType } from "@/generated/prisma/enums";
import { isTruthy, parseNumber } from "./parse-utils";

// Generic YML feeds carry flooring-specific attributes as free-form
// <param name="..."> entries — there's no standard for their Russian labels,
// so this is a best-effort match against the labels most flooring
// distributors actually use. A supplier whose feed uses different wording
// will need this list extended (or, longer-term, a per-supplier mapping
// like Supplier.columnMapping already provides for XLSX/CSV feeds).
type ParamHandler = {
  matches: (paramName: string) => boolean;
  apply: (target: ParsedParams, value: string) => void;
};

export type ParsedParams = {
  thicknessMm: number | null;
  wearLayerMm: number | null;
  wearClass: string | null;
  m2PerPack: number | null;
  packsPerPallet: number | null;
  weightKg: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  waterproof: boolean;
  warmFloorCompatible: boolean;
  decorType: DecorType | null;
  rrcPrice: number | null;
};

const decorTypeByKeyword: [RegExp, DecorType][] = [
  [/дерев|wood/i, DecorType.wood],
  [/камен|stone/i, DecorType.stone],
  [/плитк|tile/i, DecorType.tile],
  [/ёлк|елк|herringbone/i, DecorType.herringbone],
];

const handlers: ParamHandler[] = [
  {
    // "сло" (not "слой") to also match the "слоя"/"слоем"/"слое" case endings.
    matches: (n) => /защитн.*сло|wear\s*layer/i.test(n),
    apply: (t, v) => (t.wearLayerMm = parseNumber(v)),
  },
  {
    matches: (n) => /толщин|thickness/i.test(n),
    apply: (t, v) => (t.thicknessMm = parseNumber(v)),
  },
  {
    matches: (n) => /класс.*(износост|истира)/i.test(n),
    apply: (t, v) => (t.wearClass = v.trim()),
  },
  {
    matches: (n) => /м2.*упаковк|площадь.*упаковк/i.test(n),
    apply: (t, v) => (t.m2PerPack = parseNumber(v)),
  },
  {
    matches: (n) => /упаковок.*паллет|паллет/i.test(n),
    apply: (t, v) => (t.packsPerPallet = parseNumber(v) ? Math.round(parseNumber(v)!) : null),
  },
  {
    matches: (n) => /вес/i.test(n),
    apply: (t, v) => (t.weightKg = parseNumber(v)),
  },
  {
    matches: (n) => /длин/i.test(n),
    apply: (t, v) => (t.lengthMm = parseNumber(v)),
  },
  {
    matches: (n) => /ширин/i.test(n),
    apply: (t, v) => (t.widthMm = parseNumber(v)),
  },
  {
    matches: (n) => /водостойк|влагостойк|waterproof/i.test(n),
    apply: (t, v) => (t.waterproof = isTruthy(v)),
  },
  {
    matches: (n) => /тёплый пол|теплый пол|warm\s*floor/i.test(n),
    apply: (t, v) => (t.warmFloorCompatible = isTruthy(v)),
  },
  {
    matches: (n) => /тип.*декор/i.test(n),
    apply: (t, v) => {
      const match = decorTypeByKeyword.find(([re]) => re.test(v));
      if (match) t.decorType = match[1];
    },
  },
  {
    matches: (n) => /ррц|рекомендован.*цен/i.test(n),
    apply: (t, v) => (t.rrcPrice = parseNumber(v)),
  },
];

export function parseParams(params: Record<string, string>): ParsedParams {
  const result: ParsedParams = {
    thicknessMm: null,
    wearLayerMm: null,
    wearClass: null,
    m2PerPack: null,
    packsPerPallet: null,
    weightKg: null,
    lengthMm: null,
    widthMm: null,
    waterproof: false,
    warmFloorCompatible: false,
    decorType: null,
    rrcPrice: null,
  };

  for (const [name, value] of Object.entries(params)) {
    const handler = handlers.find((h) => h.matches(name));
    handler?.apply(result, value);
  }

  return result;
}

export function guessDecorType(text: string): DecorType | null {
  const match = decorTypeByKeyword.find(([re]) => re.test(text));
  return match ? match[1] : null;
}
