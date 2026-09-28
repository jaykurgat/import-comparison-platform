/**
 * Markup applied per product to its landed cost.
 *
 * Fixed KES markup applies through KES 14,999.
 * From KES 15,000 upward, markup is 11.5% of landed cost.
 */

export interface MarkupTier {
  minLandedCost: number
  maxLandedCost: number | null
  markup: number
}

export const MARKUP_TIERS: MarkupTier[] = [
  { minLandedCost: 0, maxLandedCost: 999, markup: 200 },
  { minLandedCost: 1000, maxLandedCost: 1999, markup: 400 },
  { minLandedCost: 2000, maxLandedCost: 3999, markup: 600 },
  { minLandedCost: 4000, maxLandedCost: 6999, markup: 800 },
  { minLandedCost: 7000, maxLandedCost: 9999, markup: 1000 },
  { minLandedCost: 10000, maxLandedCost: 14999, markup: 1200 },
]

const PERCENTAGE_MARKUP_START = 15000
const PERCENTAGE_MARKUP_RATE = 0.115

export function getMarkupForLandedCost(landedCost: number): number {
  if (!Number.isFinite(landedCost) || landedCost < 0) {
    throw new Error('Landed cost must be a finite, non-negative number.')
  }

  if (landedCost >= PERCENTAGE_MARKUP_START) {
    return Math.round(landedCost * PERCENTAGE_MARKUP_RATE)
  }

  const tier = MARKUP_TIERS.find(
    (t) =>
      landedCost >= t.minLandedCost &&
      (t.maxLandedCost === null || landedCost <= t.maxLandedCost),
  )

  if (!tier) {
    throw new Error(
      'No markup tier covers landed cost ' +
        landedCost +
        ' — check MARKUP_TIERS for a gap.',
    )
  }

  return tier.markup
}
