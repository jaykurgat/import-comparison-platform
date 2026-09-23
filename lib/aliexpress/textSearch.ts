import { callAliExpressSync, getAliExpressCredentials } from './client'

export interface AliExpressTextSearchOptions {
  keyword: string
  local?: string
  countryCode?: string
  categoryId?: string
  sortBy?: 'min_price' | 'orders' | 'comments'
  sortDirection?: 'asc' | 'desc'
  pageSize?: number
  pageIndex?: number
  currency?: string
  searchExtend?: Array<{ searchKey: string; searchValue: string; min?: string; max?: string }>
  selectionName?: string
}

export interface AliExpressTextSearchCandidate {
  productId: string
  title: string
  itemUrl?: string
  mainImageUrl?: string
  salePrice?: number
  salePriceCurrency?: string
  originalPrice?: number
  originalPriceCurrency?: string
  orders?: number
  score?: number
  categoryId?: string
  discount?: number
  evaluateRate?: number
}

interface SearchResponse {
  aliexpress_ds_text_search_response?: {
    result?: {
      code?: string
      msg?: string
      data?: {
        totalCount?: number
        pageIndex?: number
        pageSize?: number
        products?: Array<Record<string, unknown>>
      }
    }
  }
}

function asNumber(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export async function searchAliExpressText(
  options: AliExpressTextSearchOptions,
): Promise<{ candidates: AliExpressTextSearchCandidate[]; totalCount: number }> {
  const keyword = options.keyword.trim()
  if (!keyword) throw new Error('keyword is required.')

  const response = await callAliExpressSync<SearchResponse>(
    'aliexpress.ds.text.search',
    {
      keyWord: keyword,
      local: options.local ?? 'en_US',
      countryCode: (options.countryCode ?? 'KE').toUpperCase(),
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options.sortBy ? { sortBy: options.sortDirection ? `${options.sortBy},${options.sortDirection}` : options.sortBy } : {}),
      pageSize: String(Math.min(Math.max(options.pageSize ?? 20, 1), 100)),
      pageIndex: String(Math.max(options.pageIndex ?? 1, 1)),
      currency: options.currency ?? 'USD',
      ...(options.searchExtend?.length ? { searchExtend: JSON.stringify(options.searchExtend) } : {}),
      ...(options.selectionName ? { selectionName: options.selectionName } : {}),
    },
    getAliExpressCredentials(),
  )

  const result = response.aliexpress_ds_text_search_response?.result
  if (result?.code && result.code !== '200' && result.code !== '0') {
    throw new Error(`AliExpress text search failed: ${result.msg ?? result.code}`)
  }

  const products = result?.data?.products ?? []
  const candidates = products.map((product) => ({
    productId: String(product.itemId ?? ''),
    title: String(product.title ?? ''),
    itemUrl: product.itemUrl as string | undefined,
    mainImageUrl: product.itemMainPic as string | undefined,
    salePrice: asNumber(product.salePrice),
    salePriceCurrency: product.salePriceCurrency as string | undefined,
    originalPrice: asNumber(product.originalPrice),
    originalPriceCurrency: product.originalPriceCurrency as string | undefined,
    orders: asNumber(product.orders),
    score: asNumber(product.score),
    categoryId: product.cateId != null ? String(product.cateId) : undefined,
    discount: asNumber(product.discount),
    evaluateRate: asNumber(product.evaluateRate),
  })).filter((candidate) => candidate.productId && candidate.title)

  return { candidates, totalCount: Number(result?.data?.totalCount ?? candidates.length) }
}
