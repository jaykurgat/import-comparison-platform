import { callAliExpressSync, getAliExpressCredentials } from './client'

export interface AliExpressImageSearchOptions {
  imageBase64: string
  searchType?: 'same' | 'similar'
  currency?: string
  lang?: string
  sortType?: 'price' | 'orders' | 'best'
  sortOrder?: 'asc' | 'desc'
  shipTo?: string
}

export interface AliExpressImageSearchCandidate {
  productId: string
  title: string
  detailUrl?: string
  imageUrl?: string
  targetSalePrice?: number
  targetSalePriceCurrency?: string
  targetOriginalPrice?: number
  targetOriginalPriceCurrency?: string
  similarityScore?: number
  shopId?: string
  shipFrom?: string
  evaluateRate?: number
}

interface ImageSearchResponse {
  aliexpress_ds_image_searchV2_response?: {
    result?: {
      ret?: boolean
      code?: string
      data?: Array<Record<string, unknown>>
    }
  }
}

function asNumber(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export async function searchAliExpressByImage(
  options: AliExpressImageSearchOptions,
): Promise<AliExpressImageSearchCandidate[]> {
  const imageBase64 = options.imageBase64.trim()
  if (!imageBase64) throw new Error('imageBase64 is required.')

  const param0 = {
    search_type: options.searchType ?? 'similar',
    image_base64: imageBase64,
    currency: options.currency ?? 'USD',
    lang: options.lang ?? 'en_US',
    sort_type: options.sortType ?? 'best',
    sort_order: options.sortOrder ?? 'desc',
    ship_to: (options.shipTo ?? 'KE').toUpperCase(),
  }

  const response = await callAliExpressSync<ImageSearchResponse>(
    'aliexpress.ds.image.searchV2',
    { param0: JSON.stringify(param0) },
    getAliExpressCredentials(),
  )

  const result = response.aliexpress_ds_image_searchV2_response?.result
  if (result?.ret === false || (result?.code && result.code !== '200' && result.code !== '0')) {
    throw new Error(`AliExpress image search failed: ${result?.code ?? 'unknown'}`)
  }

  return (result?.data ?? []).map((product) => ({
    productId: String(product.product_id ?? ''),
    title: String(product.product_title ?? product.title ?? ''),
    detailUrl: product.product_detail_url as string | undefined,
    imageUrl: product.product_main_image_url as string | undefined,
    targetSalePrice: asNumber(product.target_sale_price),
    targetSalePriceCurrency: product.target_sale_price_currency as string | undefined,
    targetOriginalPrice: asNumber(product.target_original_price),
    targetOriginalPriceCurrency: product.target_original_price_currency as string | undefined,
    similarityScore: asNumber(product.similarity_score),
    shopId: product.shop_id != null ? String(product.shop_id) : undefined,
    shipFrom: product.ship_from as string | undefined,
    evaluateRate: asNumber(product.evaluate_rate),
  })).filter((candidate) => candidate.productId)
}
