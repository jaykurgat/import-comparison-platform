import { prisma } from '../prisma'
import { categorizeExistingCatalog } from '../categories/resolveCanonicalCategory'
import { isHumanDecision, getMatchDecisionStatus, selectBestCandidate, NEEDS_REVIEW_THRESHOLD } from './matchDecision'

export interface MatchRunResult {
  localSkusProcessed: number
  matchesCreated: number
  matchesUpdated: number
  autoMatched: number
  needsReview: number
  noCandidateFound: number
  skippedHumanDecisions: number
  localCategorized: number
  importCategorized: number
}

/**
 * Matching is category-gated: a local SKU and supplier SKU must resolve to the
 * same canonical leaf category before title/attribute similarity is evaluated.
 * Products that cannot be categorized are left unmatched rather than guessed.
 */
export async function runMatchingEngine(): Promise<MatchRunResult> {
  const categorized = await categorizeExistingCatalog()
  const localSkus = await prisma.localSKU.findMany()
  const aliExpressSkus = await prisma.aliExpressSKU.findMany()

  const result: MatchRunResult = {
    localSkusProcessed: localSkus.length,
    matchesCreated: 0,
    matchesUpdated: 0,
    autoMatched: 0,
    needsReview: 0,
    noCandidateFound: 0,
    skippedHumanDecisions: 0,
    localCategorized: categorized.localCategorized,
    importCategorized: categorized.importCategorized,
  }

  for (const local of localSkus) {
    const priorDecisions = await prisma.sKUMatch.findMany({
      where: { localSkuId: local.id },
      select: { id: true, aliExpressSkuId: true, status: true, comparison: { select: { id: true } } },
    })

    const rejectedRemoteIds = new Set(
      priorDecisions
        .filter((match) => match.status === 'REJECTED')
        .map((match) => match.aliExpressSkuId),
    )

    const candidateRemotes = local.categoryId
      ? aliExpressSkus.filter((remote) => remote.categoryId === local.categoryId)
      : []

    const best = selectBestCandidate(
      local,
      candidateRemotes.map((remote) => ({
        id: remote.id,
        title: remote.title,
        color: remote.color,
        size: remote.size,
      })),
      rejectedRemoteIds,
    )

    if (!best || best.score.confidence < NEEDS_REVIEW_THRESHOLD) {
      await clearProvisionalMatchesWithoutCandidate(local.id, priorDecisions)
      result.noCandidateFound++
      continue
    }

    const status = getMatchDecisionStatus(best.score.confidence)
    if (!status) {
      await clearProvisionalMatchesWithoutCandidate(local.id, priorDecisions)
      result.noCandidateFound++
      continue
    }

    const confidenceNote = `confidence=${best.score.confidence.toFixed(2)}`
    const existing = await prisma.sKUMatch.findUnique({
      where: {
        localSkuId_aliExpressSkuId: { localSkuId: local.id, aliExpressSkuId: best.candidate.id },
      },
    })

    if (existing) {
      if (isHumanDecision(existing.status)) {
        result.skippedHumanDecisions++
        continue
      }

      await prisma.sKUMatch.update({
        where: { id: existing.id },
        data: { status, matchSignal: best.score.signal, confidenceNote },
      })
      result.matchesUpdated++
    } else {
      await prisma.sKUMatch.create({
        data: {
          localSkuId: local.id,
          aliExpressSkuId: best.candidate.id,
          status,
          matchSignal: best.score.signal,
          confidenceNote,
        },
      })
      result.matchesCreated++
    }

    await clearIncompatibleProvisionalMatches(local.id, local.categoryId, aliExpressSkus)

    if (status === 'AUTO_MATCHED') result.autoMatched++
    else result.needsReview++
  }

  return result
}

async function clearProvisionalMatchesWithoutCandidate(
  localSkuId: string,
  matches: Array<{ id: string; aliExpressSkuId: string; status: string; comparison: { id: string } | null }>,
): Promise<void> {
  for (const match of matches) {
    if (isHumanDecision(match.status)) continue

    if (match.comparison) {
      await prisma.comparisonResult.delete({ where: { id: match.comparison.id } })
    }

    await prisma.sKUMatch.update({
      where: { id: match.id },
      data: {
        status: 'UNMATCHED',
        matchSignal: 'category_or_similarity_gate',
        confidenceNote: 'No eligible same-category candidate met the current threshold.',
      },
    })
  }
}

async function clearIncompatibleProvisionalMatches(
  localSkuId: string,
  categoryId: string | null,
  aliExpressSkus: Array<{ id: string; categoryId: string | null }>,
): Promise<void> {
  const compatibleIds = new Set(
    aliExpressSkus
      .filter((sku) => sku.categoryId === categoryId)
      .map((sku) => sku.id),
  )

  const matches = await prisma.sKUMatch.findMany({
    where: { localSkuId, status: { in: ['AUTO_MATCHED', 'NEEDS_REVIEW'] } },
    include: { comparison: true },
  })

  for (const match of matches) {
    if (compatibleIds.has(match.aliExpressSkuId)) continue

    if (match.comparison) {
      await prisma.comparisonResult.delete({ where: { id: match.comparison.id } })
    }

    await prisma.sKUMatch.update({
      where: { id: match.id },
      data: {
        status: 'UNMATCHED',
        matchSignal: 'category_mismatch',
        confidenceNote: 'Provisional match cleared because supplier and local categories differ.',
      },
    })
  }
}
