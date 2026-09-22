import { notFound } from 'next/navigation'
import { getImportProductPageData } from '@/lib/product/getImportProductPageData'

// Same async `params` convention as app/product/[sku]/page.tsx — see that
// file's comment about Next.js version uncertainty.
export default async function ImportProductPage({
  params,
}: {
  params: Promise<{ productId: string; skuId: string }>
}) {
  const { productId, skuId } = await params
  const data = await getImportProductPageData(productId, skuId)
  if (!data) notFound()

  return (
    <main className="min-h-screen bg-white text-[#14141A]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            {data.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.imageUrls[0]}
                alt={data.title}
                className="aspect-square w-full rounded-lg border border-[#EDEDEC] object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-[#EDEDEC] bg-[#FAFAF9] text-sm text-[#6B6B76]">
                No image available
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-[#1B5E4A]">
              Direct import
            </div>
            <h1 className="mt-2 text-2xl font-semibold leading-tight">{data.title}</h1>
            <div className="mt-3 text-3xl font-semibold tabular-nums">
              {data.currency} {data.sellPrice.toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-[#6B6B76]">
              {data.color ?? '—'} · {data.size ?? '—'}
            </div>
            <div className="mt-2 text-sm text-[#C97A2B]">7–14 day delivery</div>

            <a
              href={data.aliExpressUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-[#1B5E4A] underline"
            >
              View on AliExpress
            </a>

            {data.description && (
              // AliExpress descriptions are genuinely HTML (images, formatting) —
              // this is trusted third-party content from AliExpress's own API,
              // same pattern any storefront uses to render a supplier's rich
              // product description.
              // eslint-disable-next-line react/no-danger
              <div
                className="mt-6 text-sm leading-relaxed text-[#3A3A42]"
                dangerouslySetInnerHTML={{ __html: data.description }}
              />
            )}

            {data.isStale && (
              <p className="mt-4 text-xs text-[#8A8A8E]">
                Price last confirmed {data.priceDataAsOf.toLocaleDateString()} — may have changed.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
