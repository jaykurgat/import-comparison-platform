import type { AliExpressItemSkuInfoDto, AliExpressProductGetResult } from './types'

/**
 * Internal, simplified shapes — decoupled from AliExpress's raw response
 * structure so the rest of the app (caching, Prisma persistence, UI) never
 * has to know about ae_item_base_info_dto-style naming.
 */

export interface MappedAliExpressSku {
  skuId: string
  itemPrice: number
  currency: string
  color?: string
  size?: string
  specs: Record<string, string>
  stock: number
}

export interface MappedAliExpressProduct {
  productId: string
  title: string
  description: string
  imageUrls: string[]
  rawCategoryId: string // AliExpress's own category id — not yet mapped to a canonical Category (see schema comment on CategoryMapping)
  skus: MappedAliExpressSku[]
}

export interface MappedFreightOption {
  code: string
  freeShipping: boolean
  freightCost: number
  currency: string
  minDays: number
  maxDays: number
  company: string
  shipFromCountry: string
  tracking: boolean
}

export interface MappedFreightQuote {
  destination: string
  options: MappedFreightOption[]
}

function extractSkuAttribute(sku: AliExpressItemSkuInfoDto, propertyName: string): string | undefined {
  const props = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? []
  return props.find((p) => p.sku_property_name.toLowerCase() === propertyName.toLowerCase())
    ?.sku_property_value
}

/**
 * Uses offer_sale_price as the dropship-tier price (per project decision —
 * see /areas notes; not independently verified against the public retail
 * page, proceeding on the assumption this is the correct dropship price).
 */
export function mapProductResult(result: AliExpressProductGetResult): MappedAliExpressProduct {
  const base = result.ae_item_base_info_dto
  const rawSkus = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? []
  const imageUrls = result.ae_multimedia_info_dto?.image_urls
    ? result.ae_multimedia_info_dto.image_urls.split(';').filter(Boolean)
    : []

  const skus: MappedAliExpressSku[] = rawSkus.map((sku) => {
    const specs: Record<string, string> = {}
    for (const prop of sku.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? []) {
      specs[prop.sku_property_name] = prop.sku_property_value
    }

    return {
      skuId: sku.sku_id,
      itemPrice: Number(sku.offer_sale_price),
      currency: sku.currency_code,
      color: extractSkuAttribute(sku, 'color'),
      size: extractSkuAttribute(sku, 'size'),
      specs,
      stock: sku.sku_available_stock ?? 0,
    }
  })

  return {
    productId: String(base.product_id),
    title: base.subject,
    description: base.detail ?? '',
    imageUrls,
    rawCategoryId: String(base.category_id),
    skus,
  }
}
