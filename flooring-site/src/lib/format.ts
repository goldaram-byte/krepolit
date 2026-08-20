type DecimalLike = { toNumber: () => number } | number | string;

function toNumber(value: DecimalLike): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return value.toNumber();
}

export function formatPrice(value: DecimalLike): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
    toNumber(value),
  )} ₽`;
}

export function formatArea(value: DecimalLike): string {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(
    toNumber(value),
  )} м²`;
}

export function pricePerM2(ourPrice: DecimalLike, m2PerPack: DecimalLike): number {
  const pack = toNumber(m2PerPack);
  if (!pack) return 0;
  return toNumber(ourPrice) / pack;
}
