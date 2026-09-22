import { withCache, type CacheResult } from '../cache/withCache'
import { callAliExpressSync, getAliExpressCredentials } from './client'
import type { AliExpressAddressGetResponse, AliExpressAddressNode } from './types'

const ADDRESS_TTL_SECONDS = 7 * 24 * 60 * 60

export interface AliExpressAddressTree {
  countryCode: string
  nodes: AliExpressAddressNode[]
  asOf: Date
}

/** Returns the AliExpress checkout location tree for a country. */
export async function getAliExpressAddressTree(
  countryCode: string,
  language = 'EN',
  isMultiLanguage = false,
): Promise<CacheResult<AliExpressAddressTree>> {
  const normalizedCountry = countryCode.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
    throw new Error('countryCode must be a two-letter country code.')
  }

  return withCache<AliExpressAddressTree>({
    cacheKey: `aliexpress:address-tree:${normalizedCountry}:${language}:${isMultiLanguage}`,
    ttlSeconds: ADDRESS_TTL_SECONDS,
    serviceName: 'aliexpress',
    fetchFresh: async () => {
      const response = await callAliExpressSync<AliExpressAddressGetResponse>(
        'aliexpress.ds.address.get',
        { countryCode: normalizedCountry, language, isMultiLanguage: String(isMultiLanguage) },
        getAliExpressCredentials(),
      )
      const result = response.aliexpress_ds_address_get_response?.result
      if (!result?.ret) {
        throw new Error(`AliExpress address lookup failed for ${normalizedCountry}: ${result?.msg ?? result?.code ?? 'unknown error'}`)
      }
      return {
        countryCode: normalizedCountry,
        nodes: normalizeAddressNodes(result.data ?? []),
        asOf: new Date(),
      }
    },
    fetchFallback: async () => null,
    persistFresh: async () => undefined,
  })
}

function normalizeAddressNodes(rawNodes: AliExpressAddressNode[]): AliExpressAddressNode[] {
  return rawNodes.map((node) => ({ country: node.country, type: node.type, children: parseChildren(node.children) }))
}

function parseChildren(children: string | AliExpressAddressNode[] | undefined): AliExpressAddressNode[] {
  if (!children) return []
  if (Array.isArray(children)) return children
  try {
    const parsed = JSON.parse(children) as unknown
    return Array.isArray(parsed) ? (parsed as AliExpressAddressNode[]) : []
  } catch {
    return []
  }
}