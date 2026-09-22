'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Confirm/Reject are deliberately simple: no bulk actions, no undo. A
 * REJECTED or MANUAL_CONFIRMED match is a human decision the matching
 * engine will never overwrite on a re-run (see matchEngine.ts) — so these
 * are meant to feel final, matching how they actually behave.
 */

export async function confirmMatch(matchId: string): Promise<void> {
  await prisma.sKUMatch.update({
    where: { id: matchId },
    data: {
      status: 'MANUAL_CONFIRMED',
      reviewedBy: 'admin', // TODO: replace with real user identity once auth exists
      reviewedAt: new Date(),
    },
  })
  revalidatePath('/admin/review')
}

export async function rejectMatch(matchId: string): Promise<void> {
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
