/**
 * Tiered markup applied PER PRODUCT to its landed cost — never on a
 * cumulative cart total, per the explicit decision. Each product gets the
 * markup for its own landed-cost tier independently.
 *
 * Markup starts at 200 KES and increases by 200 KES for each successive tier.
 */

export interface MarkupTier {
  minLandedCost: number
  maxLandedCost: number | null // null = no upper bound
  markup: number
}

export const MARKUP_TIERS: MarkupTier[] = [
  { minLandedCost: 0, maxLandedCost: 999, markup: 200 },
  { minLandedCost: 1000, maxLandedCost: 1999, markup: 400 },
  { minLandedCost: 2000, maxLandedCost: 3999, markup: 600 },
  { minLandedCost: 4000, maxLandedCost: 6999, markup: 800 },
  { minLandedCost: 7000, maxLandedCost: 9999, markup: 1000 },
  { minLandedCost: 10000, maxLandedCost: 14999, markup: 1200 },
  { minLandedCost: 15000, maxLandedCost: 24999, markup: 1400 },
  { minLandedCost: 25000, maxLandedCost: 49999, markup: 1600 },
  { minLandedCost: 50000, maxLandedCost: null, markup: 1800 },
]

export function getMarkupForLandedCost(landedCost: number): number {
  const tier = MARKUP_TIERS.find(
    (t) => landedCost >= t.minLandedCost && (t.maxLandedCost === null || landedCost <= t.maxLandedCost)
  )

  if (!tier) {
    throw new Error('No markup tier covers landed cost ' + landedCost + ' — check MARKUP_TIERS for a gap.')
  }

  return tier.markup
}
