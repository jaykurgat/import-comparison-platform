import { getAliExpressProduct } from './product'
import { searchAliExpressByImage, type AliExpressImageSearchCandidate } from './imageSearch'
import { searchAliExpressText, type AliExpressTextSearchCandidate } from './textSearch'

export interface DiscoveryOptions {
  keyword?: string
  imageBase64?: string
  shipToCountry?: string
  currency?: string
  textPageSize?: number
}

export interface DiscoveryCandidate {
  productId: string
  title: string
  text?: AliExpressTextSearchCandidate
  image?: AliExpressImageSearchCandidate
  combinedScore: number
}

function scoreCandidate(
  text: AliExpressTextSearchCandidate | undefined,
  image: AliExpressImageSearchCandidate | undefined,
): number {
  const textScore = text?.score != null ? Math.min(Math.max(text.score / 100, 0), 1) : 0
  const imageScore = image?.similarityScore ?? 0
  if (text && image) return imageScore * 0.6 + textScore * 0.4
  return image ? imageScore : textScore
}

export async function discoverAliExpressProducts(options: DiscoveryOptions): Promise<DiscoveryCandidate[]> {
  if (!options.keyword && !options.imageBase64) {
    throw new Error('Provide keyword, imageBase64, or both.')
  }

  const country = (options.shipToCountry ?? 'KE').toUpperCase()
  const currency = options.currency ?? 'USD'

  const [textResult, imageResult] = await Promise.all([
    options.keyword
      ? searchAliExpressText({
          keyword: options.keyword,
          countryCode: country,
          currency,
          pageSize: options.textPageSize ?? 20,
        })
      : Promise.resolve({ candidates: [], totalCount: 0 }),
    options.imageBase64
      ? searchAliExpressByImage({
          imageBase64: options.imageBase64,
          shipTo: country,
          currency,
        })
      : Promise.resolve([]),
  ])

  const merged = new Map<string, DiscoveryCandidate>()

  for (const candidate of textResult.candidates) {
    merged.set(candidate.productId, {
      productId: candidate.productId,
      title: candidate.title,
      text: candidate,
      combinedScore: scoreCandidate(candidate, undefined),
    })
  }

  for (const candidate of imageResult) {
    const existing = merged.get(candidate.productId)
    if (existing) {
      existing.image = candidate
      existing.combinedScore = scoreCandidate(existing.text, candidate)
    } else {
      merged.set(candidate.productId, {
        productId: candidate.productId,
        title: candidate.title,
        image: candidate,
        combinedScore: scoreCandidate(undefined, candidate),
      })
    }
  }

  return [...merged.values()].sort((a, b) => b.combinedScore - a.combinedScore)
}

export async function fetchDiscoveredProducts(
  candidates: DiscoveryCandidate[],
  shipToCountry = 'KE',
): Promise<Awaited<ReturnType<typeof getAliExpressProduct>>[]> {
  return Promise.all(candidates.map((candidate) => getAliExpressProduct(candidate.productId, shipToCountry)))
}
