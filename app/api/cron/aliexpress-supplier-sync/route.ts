import { synchronizeAliExpressSupplierCatalog } from '@/lib/aliexpress/supplierSynchronizer'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const summary = await synchronizeAliExpressSupplierCatalog()

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
  }
}
