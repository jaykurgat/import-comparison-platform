/**
 * Pure matching-signal logic. No database access here — kept separate so
 * the scoring itself can be tested/tuned independently of the engine that
 * writes SKUMatch rows.
 *
 * No GTIN/barcode data exists on either side yet (neither AliExpress's
 * ds.product.get response nor the CSV importer capture one), so title +
 * color/size similarity is the ONLY signal available right now. This is a
 * deliberately simple first pass — swap in something smarter (e.g. an
 * LLM-assisted judge for the gray zone, as discussed earlier) once we have
 * enough real match data to evaluate against.
 */

const STOPWORDS = new Set([
  'for', 'the', 'and', 'with', 'a', 'an', 'of', 'to', 'in', 'on', 'new',
  'high', 'quality', 'hot', 'sale', 'free', 'shipping',
])

export function normalizeTitleWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
}

/** Jaccard similarity (intersection / union) over normalized title words. 0-1. */
export function titleSimilarity(titleA: string, titleB: string): number {
  const wordsA = new Set(normalizeTitleWords(titleA))
  const wordsB = new Set(normalizeTitleWords(titleB))

  if (wordsA.size === 0 || wordsB.size === 0) return 0

  let intersectionCount = 0
  for (const word of wordsA) {
    if (wordsB.has(word)) intersectionCount++
  }
  const unionCount = new Set([...wordsA, ...wordsB]).size

  return intersectionCount / unionCount
}

export interface MatchableAttributes {
  title: string
  color?: string | null
  size?: string | null
}

export interface MatchScore {
  titleScore: number
  colorMatch: boolean | null // null = one or both sides missing color info — not a signal either way
  sizeMatch: boolean | null
  confidence: number // 0-1, combined score
  signal: string // human-readable summary, stored in SKUMatch.matchSignal
}

function normalizeAttr(value?: string | null): string | null {
  return value ? value.trim().toLowerCase() : null
}

/**
 * Scores how likely two SKUs (one local, one AliExpress) are the same
 * product/variant. Deliberately conservative: an explicit attribute
 * MISMATCH is penalized more heavily than a match is rewarded, since a
 * confirmed mismatch (e.g. color: Red vs color: Blue) is strong evidence
 * against a match, not just weak evidence for one.
 */
export function scoreMatch(local: MatchableAttributes, remote: MatchableAttributes): MatchScore {
  const titleScore = titleSimilarity(local.title, remote.title)

  const localColor = normalizeAttr(local.color)
  const remoteColor = normalizeAttr(remote.color)
  const colorMatch = localColor && remoteColor ? localColor === remoteColor : null

  const localSize = normalizeAttr(local.size)
  const remoteSize = normalizeAttr(remote.size)
  const sizeMatch = localSize && remoteSize ? localSize === remoteSize : null

  let confidence = titleScore
  if (colorMatch === true) confidence += 0.15
  if (colorMatch === false) confidence -= 0.25
  if (sizeMatch === true) confidence += 0.1
  if (sizeMatch === false) confidence -= 0.15

  confidence = Math.max(0, Math.min(1, confidence))

  const signalParts = [`title_jaccard_${titleScore.toFixed(2)}`]
  if (colorMatch !== null) signalParts.push(`color_${colorMatch ? 'match' : 'mismatch'}`)
  if (sizeMatch !== null) signalParts.push(`size_${sizeMatch ? 'match' : 'mismatch'}`)

  return { titleScore, colorMatch, sizeMatch, confidence, signal: signalParts.join('|') }
}
