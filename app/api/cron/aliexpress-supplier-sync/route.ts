import { revalidatePath } from 'next/cache'
import { redis } from '@/lib/redis/client'
import { synchronizeAliExpressSupplierCatalog } from '@/lib/aliexpress/supplierSynchronizer'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const lockKey = 'lock:cron:aliexpress-supplier-sync'
  const lockToken = crypto.randomUUID()
  const gotLock = await redis.set(lockKey, lockToken, { nx: true, ex: 10 * 60 })

  if (!gotLock) {
    return Response.json({ ok: true, skipped: true, reason: 'Another supplier sync is already running.' })
  }

  try {
    const summary = await synchronizeAliExpressSupplierCatalog()

    if (summary.repricedSkus > 0 || summary.changedSkus > 0) {
      revalidatePath('/products')
      revalidatePath('/')
    }

    if (summary.failedProducts > 0) {
      console.error('[AliExpress supplier sync] Completed with failures.', summary)
    }

    return Response.json({
      ok: summary.failedProducts === 0,
      ...summary,
    })
  } catch (error) {
    console.error('[AliExpress supplier sync] Fatal error.', error)
    return Response.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  } finally {
    try {
      await redis.eval(
        `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
        [lockKey],
        [lockToken],
      )
    } catch (error) {
      console.error('[AliExpress supplier sync] Failed to release sync lock.', error)
    }
  }
}
