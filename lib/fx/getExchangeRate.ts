import { prisma } from '../prisma'
import { withCache, type CacheResult } from '../cache/withCache'

const FX_API_URL = 'https://open.er-api.com/v6/latest/USD'
const FX_TTL_SECONDS = 24 * 60 * 60 // matches the source's own ~daily update cadence — confirmed by testing

interface FxApiResponse {
  result: string
  base_code: string
  rates: Record<string, number>
}

/**
 * Gets the USD -> KES exchange rate, cached (24h) with Neon fallback if the
 * API is unreachable. Only USD->KES is supported right now — this is a
 * deliberate limit, not an oversight: guessing a conversion for an
 * unexpected currency pair would be far more dangerous than just erroring,
 * since a wrong FX rate silently corrupts the core landed-cost comparison.
 */
export async function getUsdToKesRate(): Promise<CacheResult<number>> {
  return withCache<number>({
    cacheKey: 'fx:USD:KES',
    ttlSeconds: FX_TTL_SECONDS,
    serviceName: 'fx-rate',

    fetchFresh: async () => {
      const res = await fetch(FX_API_URL)
      const json = (await res.json()) as FxApiResponse

      if (json.result !== 'success') {
        throw new Error(`FX API returned non-success result: ${json.result}`)
      }
      const rate = json.rates?.KES
      if (typeof rate !== 'number') {
        throw new Error('FX API response did not include a KES rate.')
      }
      return rate
    },

    fetchFallback: async () => {
      const last = await prisma.exchangeRateSnapshot.findFirst({
        where: { baseCurrency: 'USD', quoteCurrency: 'KES' },
        orderBy: { recordedAt: 'desc' },
      })
      if (!last) return null
      return { data: Number(last.rate), asOf: last.recordedAt }
    },

    persistFresh: async (rate) => {
      await prisma.exchangeRateSnapshot.create({
        data: { baseCurrency: 'USD', quoteCurrency: 'KES', rate },
      })
    },
  })
}
