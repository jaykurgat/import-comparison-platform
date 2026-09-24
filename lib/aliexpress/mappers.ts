import type { AliExpressItemSkuInfoDto, AliExpressProductGetResult, AliExpressSkuPropertyDto } from './types'

/**
 * Internal, simplified shapes — decoupled from AliExpress's raw response
 * structure so the rest of the app (caching, Prisma persistence, UI) never
 * has to know about ae_item_base_info_dto-style naming.
 */

export interface MappedAliExpressSku {
  skuId: string
  /** API origin SKU/supplier price before promotional sale pricing. */
  skuPrice: number
  /** API promotional/offer price when supplied. */
  offerSalePrice: number
  itemPrice: number
  currency: string
  priceIncludeTax: boolean
  skuCode?: string
  color?: string
  size?: string
  specs: Record<string, string>
  variantImageUrl?: string
  stock: number
}

export interface MappedAliExpressProduct {
  productId: string
  title: string
  rawCategoryId: string
  description: string
  imageUrls: string[]
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

function getDisplayValue(property: AliExpressSkuPropertyDto): string {
  const customName = property.property_value_definition_name?.trim()
  if (customName && customName !== '0') return customName
  return property.sku_property_value.trim()
}

function extractSkuAttribute(sku: AliExpressItemSkuInfoDto, propertyName: string): string | undefined {
  const props = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? []
  return props.find((property) => property.sku_property_name.trim().toLowerCase() === propertyName.toLowerCase())
    ? getDisplayValue(
        props.find((property) => property.sku_property_name.trim().toLowerCase() === propertyName.toLowerCase())!,
      )
    : undefined
}

/**
 * Uses offer_sale_price as the dropship-tier price (per project decision —
 * see /areas notes; not independently verified against the public retail
 * page, proceeding on the assumption this is the correct dropship price).
 *
 * AliExpress's product API exposes the variant attribute name/value separately
 * from the website presentation. The request is made with target_language=EN,
 * and seller-defined property_value_definition_name is used when supplied.
 */
export function mapProductResult(result: AliExpressProductGetResult): MappedAliExpressProduct {
  const base = result.ae_item_base_info_dto
  const rawSkus = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? []
  const imageUrls = result.ae_multimedia_info_dto?.image_urls
    ? result.ae_multimedia_info_dto.image_urls.split(';').filter(Boolean)
    : []

  const skus: MappedAliExpressSku[] = rawSkus.map((sku) => {
    const specs: Record<string, string> = {}
    const properties = sku.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? []

    for (const property of properties) {
      const name = property.sku_property_name.trim()
      if (!name) continue
      specs[name] = getDisplayValue(property)
    }

    const variantImageUrl = properties.find((property) => property.sku_image?.trim())?.sku_image?.trim()

    return {
      skuId: sku.sku_id,
      skuPrice: Number(sku.sku_price),
      offerSalePrice: Number(sku.offer_sale_price),
      itemPrice: Number(sku.offer_sale_price || sku.sku_price),
      currency: sku.currency_code,
      priceIncludeTax: sku.price_include_tax ?? false,
      skuCode: sku.sku_code,
      color: extractSkuAttribute(sku, 'color'),
      size: extractSkuAttribute(sku, 'size'),
      specs,
      variantImageUrl,
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
