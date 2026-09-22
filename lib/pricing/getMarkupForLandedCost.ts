/**
 * Tiered markup applied PER PRODUCT to its landed cost — never on a
 * cumulative cart total, per the explicit decision. A 1500 KES item and a
 * 3000 KES item in the same order each get their own tier's markup
 * independently; the cart total plays no role in this lookup.
 *
 * Shape: flat KES amount per tier, shrinking as a PERCENTAGE the more
 * expensive the item is (cheap items need a proportionally bigger markup
 * to cover fixed per-order costs like M-Pesa fees and packaging; expensive
 * items can carry a smaller percentage and still be meaningfully
 * profitable in absolute terms).
 */

export interface MarkupTier {
  minLandedCost: number
  maxLandedCost: number | null // null = no upper bound
  markup: number
}

export const MARKUP_TIERS: MarkupTier[] = [
  { minLandedCost: 0, maxLandedCost: 999, markup: 100 },
  { minLandedCost: 1000, maxLandedCost: 1999, markup: 150 },
  { minLandedCost: 2000, maxLandedCost: 3999, markup: 200 },
  { minLandedCost: 4000, maxLandedCost: 6999, markup: 300 },
  { minLandedCost: 7000, maxLandedCost: 9999, markup: 400 },
  { minLandedCost: 10000, maxLandedCost: 14999, markup: 500 },
  { minLandedCost: 15000, maxLandedCost: 24999, markup: 700 },
  { minLandedCost: 25000, maxLandedCost: 49999, markup: 1000 },
  { minLandedCost: 50000, maxLandedCost: null, markup: 1500 },
]

export function getMarkupForLandedCost(landedCost: number): number {
  const tier = MARKUP_TIERS.find(
    (t) => landedCost >= t.minLandedCost && (t.maxLandedCost === null || landedCost <= t.maxLandedCost)
  )

  // Should never happen — tiers are defined to cover 0 to infinity with no
  // gaps — but fail loudly rather than silently return 0 markup if a future
  // edit to MARKUP_TIERS accidentally leaves a gap.
  if (!tier) {
    throw new Error(
      `No markup tier covers landed cost ${landedCost} — check MARKUP_TIERS for a gap.`
    )
  }

  return tier.markup
}
