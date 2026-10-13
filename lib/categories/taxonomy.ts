/**
 * Category text utilities only. The taxonomy itself lives in Postgres and is
 * managed through admin. Never add a hard-coded category tree here.
 */
export function normalizeCategoryText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase()
    .replace(/&/g, ' and ').replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()
}

export interface CategoryClassification {
  path: [string, string]
  score: number
  confidence: number
  matchedTerms: string[]
}

/** Titles alone are not reliable enough to assign a canonical category. */
export function classifyCategory(input: {
  title: string
  sourceCategoryName?: string | null
  specs?: Record<string, unknown> | null
}): CategoryClassification | null {
  void input
  return null
}
