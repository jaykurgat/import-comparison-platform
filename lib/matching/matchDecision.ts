import { scoreMatch, type MatchableAttributes, type MatchScore } from './similarity'

export const AUTO_MATCH_THRESHOLD = 0.9
export const NEEDS_REVIEW_THRESHOLD = 0.4

export type Candidate = MatchableAttributes & { id: string }

export type MatchDecisionStatus = 'AUTO_MATCHED' | 'NEEDS_REVIEW'

export function selectBestCandidate(
  local: MatchableAttributes,
  candidates: Candidate[],
  rejectedIds: ReadonlySet<string>,
): { candidate: Candidate; score: MatchScore } | null {
  let best: { candidate: Candidate; score: MatchScore } | null = null

  for (const candidate of candidates) {
    if (rejectedIds.has(candidate.id)) continue

    const score = scoreMatch(local, candidate)
    if (!best || score.confidence > best.score.confidence) {
      best = { candidate, score }
    }
  }

  return best
}

export function getMatchDecisionStatus(confidence: number): MatchDecisionStatus | null {
  if (confidence >= AUTO_MATCH_THRESHOLD) return 'AUTO_MATCHED'
  if (confidence >= NEEDS_REVIEW_THRESHOLD) return 'NEEDS_REVIEW'
  return null
}

export function isHumanDecision(status: string): boolean {
  return status === 'MANUAL_CONFIRMED' || status === 'REJECTED'
}

export function canReviewDecision(status: string): boolean {
  return status === 'AUTO_MATCHED' || status === 'NEEDS_REVIEW'
}
