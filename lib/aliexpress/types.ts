/**
 * Types for the AliExpress response shapes — based ONLY on fields confirmed
 * present in real test responses (see /areas notes), not the full possible
 * schema. Fields are typed as optional/loose where the real response showed
 * variation (e.g. paid vs free shipping options).
 */

// ---- aliexpress.ds.product.get ----

export interface AliExpressSkuPropertyDto {
  sku_property_name: string
  sku_property_value: string
  sku_image?: string
  property_value_id?: number
  sku_property_id?: number
}

export interface AliExpressItemSkuInfoDto {
  sku_id: string
  offer_sale_price: string
  offer_bulk_sale_price?: string
  sku_price: string
  currency_code: string
  price_include_tax?: boolean
  sku_code?: string
  sku_available_stock?: number
  sku_bulk_order?: number
  sku_attr?: string
  wholesale_price_tiers?: unknown
  ae_sku_property_dtos?: {
    ae_sku_property_d_t_o: AliExpressSkuPropertyDto[]
  }
}

export interface AliExpressItemBaseInfoDto {
  subject: string // title
  detail?: string // HTML description
  category_id: number
  product_id: number
  currency_code?: string
  product_status?: string
  sales?: number
  rating?: number
  seller_store_name?: string
}

export interface AliExpressProductGetResult {
  ae_item_sku_info_dtos?: {
    ae_item_sku_info_d_t_o: AliExpressItemSkuInfoDto[]
  }
  ae_multimedia_info_dto?: {
    image_urls: string // semicolon-separated URLs
  }
  ae_item_base_info_dto: AliExpressItemBaseInfoDto
}

export interface AliExpressErrorResponse {
  error_response: {
    type: string
    code: string
    msg: string
    request_id: string
  }
}

export interface AliExpressProductGetResponse {
  aliexpress_ds_product_get_response?: {
    result: AliExpressProductGetResult
  }
}

// ---- aliexpress.ds.freight.query ----

export interface AliExpressDeliveryOption {
  code: string
  free_shipping: boolean
  shipping_fee_cent?: string // confirmed field name from docs, unconfirmed whether it's actually cents or a formatted decimal — see freight.ts comment
  shipping_fee_currency?: string
  min_delivery_days: number
  max_delivery_days: number
  company: string
  ship_from_country: string
  tracking: boolean
  available_stock?: string
}

export interface AliExpressFreightQueryResult {
  msg: string
  code: number
  success: boolean
  delivery_options?: {
    delivery_option_d_t_o: AliExpressDeliveryOption[]
  }
}

export interface AliExpressFreightQueryResponse {
  aliexpress_ds_freight_query_response?: {
    result: AliExpressFreightQueryResult
  }
}


export interface AliExpressAddressNode {
  country: string
  type: string
  children?: string | AliExpressAddressNode[]
}

export interface AliExpressAddressGetResult {
  ret: boolean | string
  code?: string
  msg?: string
  data?: AliExpressAddressNode[]
}

export interface AliExpressAddressGetResponse {
  aliexpress_ds_address_get_response?: { result: AliExpressAddressGetResult }
}

export interface AliExpressOrderAddress {
  address: string
  address2?: string
  city: string
  contact_person?: string
  country: string
  full_name?: string
  locale?: string
  mobile_no?: string
  phone_country?: string
  phone_number?: string
  province: string
  zip?: string
  tax_number?: string
  vat_no?: string
  location_tree_address_id?: string
}

export interface AliExpressOrderProductItem {
  product_count: number
  product_id: number
  sku_attr?: string
  logistics_service_name?: string
  order_memo?: string
}

export interface AliExpressDsOrderCreateResult {
  error_code?: string
  error_msg?: string
  order_list?: { number?: number[] }
  is_success: boolean
}

export interface AliExpressDsOrderCreateResponse {
  aliexpress_ds_order_create_response?: { result: AliExpressDsOrderCreateResult }
}

// ---- aliexpress.ds.text.search / aliexpress.ds.image.searchV2 ----
export interface AliExpressSearchCandidate {
  productId: string
  title: string
  itemUrl?: string
  imageUrl?: string
  salePrice?: number
  originalPrice?: number
  currency?: string
  similarityScore?: number
  orders?: number
}


export interface AliExpressCategoryDto {
  id: number
  isleaf: boolean
  level?: number
  names?: string
  features?: string
}

export interface AliExpressCategoryListResult {
  aliexpress_category_redefining_getchildrenpostcategorybyid_response?: {
    result?: {
      aeop_post_category_list?: {
        aeop_post_category_dto?: AliExpressCategoryDto[]
      }
      success?: boolean
    }
  }
}

export interface AliExpressSingleCategoryResult {
  aliexpress_category_redefining_getpostcategorybyid_response?: {
    result?: {
      aeop_post_category_list?: {
        aeop_post_category_dto?: AliExpressCategoryDto[]
      }
      success?: boolean
    }
  }
}
