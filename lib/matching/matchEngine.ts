import { prisma } from '../prisma'
import { isHumanDecision, getMatchDecisionStatus, selectBestCandidate, NEEDS_REVIEW_THRESHOLD } from './matchDecision'

/**
 * ============================================================================
 * TEMPORARY DEVIATION FROM THE ORIGINAL DESIGN — READ BEFORE MODIFYING
 * ============================================================================
 * schema.prisma's SKUMatch model states category match must be a hard
 * precondition, never just a signal. That rule is NOT enforced here.
 *
 * Why: Category/CategoryMapping are both empty right now (deliberately
 * deferred until real category data exists), and the CSV importer doesn't
 * even capture a category field yet. Enforcing the gate as written would
 * mean this engine could never produce a single match on any data that
 * currently exists — which defeats the purpose of testing it against real
 * data now, per the explicit decision to relax this temporarily.
 *
 * What this means in practice: nothing currently stops this engine from
 * matching, say, a local "Nike backpack" against an AliExpress "Nike
 * running shoes" if their titles happen to share enough words — exactly
 * the failure mode category-gating was designed to prevent. Re-enable the
 * gate (filter candidates to matching categoryId before scoring) as soon
 * as category data exists on both sides.
 * ============================================================================
 */

export interface MatchRunResult {
  localSkusProcessed: number
  matchesCreated: number
  matchesUpdated: number
  autoMatched: number
  needsReview: number
  noCandidateFound: number
  skippedHumanDecisions: number
}

/**
 * Runs the matching engine over ALL LocalSKU x AliExpressSKU pairs.
 *
 * KNOWN SCALING LIMIT: this is O(local_count * aliexpress_count) — fine for
 * the current handful of test records, but will need indexing/pre-
 * filtering (starting with the category gate above) before running against
 * a real catalog of any size.
 *
 * Never overwrites a match a human has already reviewed (MANUAL_CONFIRMED
 * or REJECTED) — those are left untouched regardless of what a re-run
 * computes. REJECTED pairs are also excluded from candidate selection so
 * they cannot be recreated on a later run.
 */
export async function runMatchingEngine(): Promise<MatchRunResult> {
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
  }

  for (const local of localSkus) {
    // A rejected local/remote pair is a durable human decision. Exclude it
    // from candidate selection on every future run so the engine does not
    // recreate the same rejected match.
    const priorDecisions = await prisma.sKUMatch.findMany({
      where: { localSkuId: local.id },
      select: { aliExpressSkuId: true, status: true },
    })
    const rejectedRemoteIds = new Set(
      priorDecisions
        .filter((match) => match.status === 'REJECTED')
        .map((match) => match.aliExpressSkuId),
    )

    const best = selectBestCandidate(
      local,
      aliExpressSkus.map((remote) => ({
        id: remote.id,
        title: remote.title,
        color: remote.color,
        size: remote.size,
      })),
      rejectedRemoteIds,
    )

    if (!best || best.score.confidence < NEEDS_REVIEW_THRESHOLD) {
      result.noCandidateFound++
      continue
    }

    const status = getMatchDecisionStatus(best.score.confidence)
    if (!status) {
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

    if (status === 'AUTO_MATCHED') result.autoMatched++
    else result.needsReview++
  }

  return result
}
