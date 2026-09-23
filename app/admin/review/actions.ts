'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin/auth'
import { revalidatePath } from 'next/cache'
import { canReviewDecision } from '@/lib/matching/matchDecision'

/**
 * Confirm/Reject are deliberately simple: no bulk actions, no undo. A
 * REJECTED or MANUAL_CONFIRMED match is a human decision the matching
 * engine will never overwrite on a re-run (see matchEngine.ts) — so these
 * are meant to feel final, matching how they actually behave.
 */

export async function confirmMatch(matchId: string): Promise<void> {
  await requireAdmin()
  const match = await prisma.sKUMatch.findUnique({ where: { id: matchId }, select: { status: true } })
  if (!match || !canReviewDecision(match.status)) {
    return
  }
  await prisma.sKUMatch.update({
    where: { id: matchId },
    data: {
      status: 'MANUAL_CONFIRMED',
      reviewedBy: 'admin',
      reviewedAt: new Date(),
    },
  })
  revalidatePath('/admin/review')
}

export async function rejectMatch(matchId: string): Promise<void> {
  await requireAdmin()
  const match = await prisma.sKUMatch.findUnique({ where: { id: matchId }, select: { status: true } })
  if (!match || !canReviewDecision(match.status)) {
    return
  }
  await prisma.sKUMatch.update({
    where: { id: matchId },
    data: {
      status: 'REJECTED',
      reviewedBy: 'admin',
      reviewedAt: new Date(),
    },
  })
  revalidatePath('/admin/review')
}
