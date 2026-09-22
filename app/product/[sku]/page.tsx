import { notFound } from 'next/navigation'
import { getProductPageData } from '@/lib/product/getProductPageData'

// NOTE: written using Next.js's async `params` convention (params is a
// Promise you await) — this is the pattern used from Next.js 15 onward.
// Your create-next-app installed 16.3.4, a version newer than what I have
// reliable training knowledge of, so if this errors specifically on the
// `await params` line, that's the first thing to check against your
// installed version's actual convention.
export default async function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params
  const data = await getProductPageData(sku)
  if (!data) notFound()

  const { local, comparison } = data

  return (
    <main className="min-h-screen bg-white text-[#14141A]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            {local.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={local.imageUrls[0]}
                alt={local.title}
                className="aspect-square w-full rounded-lg border border-[#EDEDEC] object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-[#EDEDEC] bg-[#FAFAF9] text-sm text-[#6B6B76]">
                No image available
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-semibold leading-tight">{local.title}</h1>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {local.currency} {local.price.toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-[#6B6B76]">
              {local.color ?? '—'} · {local.size ?? '—'}
            </div>
            {local.description && (
              <p className="mt-6 text-sm leading-relaxed text-[#3A3A42]">{local.description}</p>
            )}
          </div>
        </div>

        <section className="mt-14 border-t border-[#EDEDEC] pt-10">
          <h2 className="text-lg font-semibold">Compare: Local vs. Direct Import</h2>

          {!comparison ? (
            <p className="mt-3 text-sm text-[#6B6B76]">
              No verified import alternative found for this product yet.
            </p>
          ) : comparison.renderMode === 'LOCAL_ONLY' ? (
            <div className="mt-4 rounded-lg border border-[#EDEDEC] bg-[#FAFAF9] p-5 text-sm text-[#3A3A42]">
              This local option is already the better deal once import shipping is factored in
              (import would come to {local.currency} {comparison.sellPrice.toLocaleString()}).
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-[#EDEDEC] p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B6B76]">
                  Local · Fast delivery
                </div>
                <div className="mt-2 text-xl font-semibold tabular-nums">
                  {local.currency} {comparison.localTotalPrice.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-[#C97A2B]">24–48 hour delivery</div>
              </div>

              <div className="rounded-lg border-2 border-[#1B5E4A] p-5">
                <div className="text-xs font-medium uppercase tracking-wide text-[#1B5E4A]">
                  Direct import · Best price
                </div>
                <div className="mt-2 text-xl font-semibold tabular-nums">
                  {local.currency} {comparison.sellPrice.toLocaleString()}
                </div>
                <div className="mt-1 text-sm text-[#6B6B76]">7–14 day delivery</div>
                <a
                  href={comparison.remote.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-[#1B5E4A] underline"
                >
                  View on AliExpress
                </a>
              </div>
            </div>
          )}

          {comparison?.isStale && (
            <p className="mt-3 text-xs text-[#8A8A8E]">
              Prices last confirmed {comparison.priceDataAsOf.toLocaleDateString()} — may have changed.
            </p>
          )}
        </section>

        <section className="mt-14 border-t border-[#EDEDEC] pt-10">
          <h2 className="text-lg font-semibold">Related products</h2>
          <p className="mt-3 text-sm text-[#6B6B76]">
            Coming soon — needs product category data, which is planned but not built yet.
          </p>
        </section>
      </div>
    </main>
  )
}
