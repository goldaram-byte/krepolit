export function parseNumber(value: string): number | null {
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const num = Number.parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

export function isTruthy(value: string): boolean {
  return /^(да|yes|true|1)$/i.test(value.trim());
}
