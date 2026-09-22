import { getAliExpressAddressTree } from './address'
import type { AliExpressAddressNode } from './types'

export interface ResolveAliExpressAddressInput {
  countryCode: string
  province: string
  city: string
}

export interface ResolvedAliExpressAddress {
  country: string
  province: string
  city: string
}

/**
 * Resolves customer-entered province/city names against the hierarchy
 * returned by aliexpress.ds.address.get. We only return values actually
 * present in the AliExpress response; no local county/city mapping is
 * invented here.
 */
export async function resolveAliExpressAddress(
  input: ResolveAliExpressAddressInput,
): Promise<ResolvedAliExpressAddress> {
  const countryCode = input.countryCode.trim().toUpperCase()
  const province = normalize(input.province)
  const city = normalize(input.city)

  if (!/^[A-Z]{2}$/.test(countryCode)) throw new Error('countryCode must be a two-letter country code.')
  if (!province) throw new Error('province is required.')
  if (!city) throw new Error('city is required.')

  const tree = await getAliExpressAddressTree(countryCode)
  const provinceNode = findNode(tree.data.nodes, province, ['province', 'state', 'county'])
  if (!provinceNode) throw new Error(`AliExpress does not recognize province/state "${input.province}" for ${countryCode}.`)

  const children = Array.isArray(provinceNode.children) ? provinceNode.children : []
  const cityNode = findNode(children, city, ['city', 'town', 'district'])
  if (!cityNode) throw new Error(`AliExpress does not recognize city "${input.city}" under "${provinceNode.country}".`)

  return {
    country: countryCode,
    province: provinceNode.country,
    city: cityNode.country,
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\\s+/g, ' ')
}

function findNode(
  nodes: AliExpressAddressNode[],
  wanted: string,
  allowedTypes: string[],
): AliExpressAddressNode | undefined {
  return nodes.find((node) => {
    const type = node.type.toLowerCase()
    return allowedTypes.includes(type) && normalize(node.country) === wanted
  })
}
