import { Prisma } from "@/generated/prisma/client";

type DecimalInput = string | number | Prisma.Decimal;

export type PricingInput = {
  purchasePrice: DecimalInput;
  markupPercent: DecimalInput;
  rrcPrice: DecimalInput | null;
};

export type PricingResult = {
  ourPrice: Prisma.Decimal;
  belowRrcFlag: boolean;
};

// SPEC.md §3: ourPrice is never stored manually — it's derived from the
// supplier's purchase price and markup, then clamped up to the brand's RRC
// if the markup would otherwise dump the price below it. Publishing below
// RRC is grounds for the dealer contract being terminated, so this floor is
// non-negotiable; belowRrcFlag exists purely to flag the markup for review.
export function computeOurPrice({
  purchasePrice,
  markupPercent,
  rrcPrice,
}: PricingInput): PricingResult {
  const purchase = new Prisma.Decimal(purchasePrice);
  const markup = new Prisma.Decimal(markupPercent);
  const computed = purchase
    .mul(markup.div(100).add(1))
    .toDecimalPlaces(2);

  if (rrcPrice != null) {
    const rrc = new Prisma.Decimal(rrcPrice).toDecimalPlaces(2);
    if (computed.lessThan(rrc)) {
      return { ourPrice: rrc, belowRrcFlag: true };
    }
  }

  return { ourPrice: computed, belowRrcFlag: false };
}
