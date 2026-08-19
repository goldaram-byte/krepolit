// SPEC.md §5: "прямая укладка 5%, диагональ 10%, ёлка 15%" — waste
// allowance added to the room area before figuring out how many packs to buy.
export type LayingPattern = "straight" | "diagonal" | "herringbone";

export const layingPatternWaste: Record<LayingPattern, number> = {
  straight: 0.05,
  diagonal: 0.1,
  herringbone: 0.15,
};

export const layingPatternLabels: Record<LayingPattern, string> = {
  straight: "Прямая укладка",
  diagonal: "По диагонали",
  herringbone: "Ёлочкой",
};

export type PackageCalculation = {
  /** Room area plus the cutting-waste allowance, m². */
  areaWithWaste: number;
  /** Packs to buy to cover areaWithWaste. */
  packsNeeded: number;
  /** m² actually covered by packsNeeded packs (>= areaWithWaste). */
  totalAreaPurchased: number;
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function calculatePackages(
  areaM2: number,
  pattern: LayingPattern,
  m2PerPack: number,
): PackageCalculation {
  if (!(areaM2 > 0) || !(m2PerPack > 0)) {
    return { areaWithWaste: 0, packsNeeded: 0, totalAreaPurchased: 0 };
  }

  const areaWithWaste = round(areaM2 * (1 + layingPatternWaste[pattern]), 2);
  // Tiny epsilon guards against floating-point results like 2.9999999998
  // rounding down to 2 packs when the exact answer is 3.
  const packsNeeded = Math.ceil(areaWithWaste / m2PerPack - 1e-9);
  const totalAreaPurchased = round(packsNeeded * m2PerPack, 2);

  return { areaWithWaste, packsNeeded, totalAreaPurchased };
}
