import { getReviewQueue } from '@/lib/matching/getReviewQueue'
import { confirmMatch, rejectMatch } from './actions'

export default async function ReviewPage() {
  const queue = await getReviewQueue()

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Product Match Review</h1>
        <p className="mt-1 text-sm text-[#6B6B6E]">
          {queue.length} match{queue.length === 1 ? '' : 'es'} pending review
        </p>

        {queue.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#E3E3DF] bg-white px-6 py-10 text-center text-[#6B6B6E]">
            Nothing to review right now. Run the matching engine to generate new candidates.
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            {queue.map((item) => (
              <div key={item.matchId} className="overflow-hidden rounded-lg border border-[#E3E3DF] bg-white">
                <div className="grid grid-cols-2 divide-x divide-[#E3E3DF]">
                  <div className="p-5">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#8A8A8E]">
                      Local product
                    </div>
                    {item.local.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.local.imageUrl}
                        alt={item.local.title}
                        className="mt-3 h-32 w-32 rounded object-cover"
                      />
                    )}
                    <div className="mt-3 font-medium leading-snug">{item.local.title}</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {item.local.currency} {item.local.price.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-[#6B6B6E]">
                      {item.local.color ?? '—'} · {item.local.size ?? '—'}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#8A8A8E]">
                      AliExpress candidate
                    </div>
                    {item.remote.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.remote.imageUrl}
                        alt={item.remote.title}
                        className="mt-3 h-32 w-32 rounded object-cover"
                      />
                    )}
                    <div className="mt-3 font-medium leading-snug">{item.remote.title}</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {item.remote.currency} {item.remote.price.toFixed(2)}
                    </div>
                    <div className="mt-1 text-sm text-[#6B6B6E]">
                      {item.remote.color ?? '—'} · {item.remote.size ?? '—'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#E3E3DF] bg-[#FAFAF9] px-5 py-3">
                  <div className="text-xs text-[#6B6B6E]">
                    {item.confidenceNote ?? 'No confidence score'}
                    {item.matchSignal && <span className="ml-2 text-[#B8860B]">{item.matchSignal}</span>}
                  </div>
                  <div className="flex gap-2">
                    <form action={rejectMatch.bind(null, item.matchId)}>
                      <button
                        type="submit"
                        className="rounded border border-[#A6432D]/30 px-3 py-1.5 text-sm font-medium text-[#A6432D] hover:bg-[#A6432D]/5"
                      >
                        Reject
                      </button>
                    </form>
                    <form action={confirmMatch.bind(null, item.matchId)}>
                      <button
                        type="submit"
                        className="rounded bg-[#2F6B4F] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2F6B4F]/90"
                      >
                        Confirm
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
