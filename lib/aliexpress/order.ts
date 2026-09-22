import { callAliExpressSync, getAliExpressCredentials } from './client'
import type {
  AliExpressDsOrderCreateResponse,
  AliExpressDsOrderCreateResult,
  AliExpressOrderAddress,
  AliExpressOrderProductItem,
} from './types'

export interface CreateAliExpressOrderInput {
  outOrderId: string
  address: AliExpressOrderAddress
  items: AliExpressOrderProductItem[]
  payCurrency?: string
  tryToPay?: boolean
  promotionCode?: string
  promotionChannelInfo?: string
  businessModel?: 'retail' | 'wholesale'
}

export interface CreatedAliExpressOrder { orderIds: string[] }

/**
 * Places an AliExpress DS order. This is intentionally explicit: product
 * views/cart creation must never place an order. Callers should persist
 * their own checkout intent before invoking this service.
 */
export async function createAliExpressDsOrder(input: CreateAliExpressOrderInput): Promise<CreatedAliExpressOrder> {
  validateOrderInput(input)
  const response = await callAliExpressSync<AliExpressDsOrderCreateResponse>(
    'aliexpress.ds.order.create',
    {
      ds_extend_request: JSON.stringify({
        payment: {
          ...(input.payCurrency ? { pay_currency: input.payCurrency } : {}),
          ...(input.tryToPay !== undefined ? { try_to_pay: String(input.tryToPay) } : {}),
        },
        ...(input.promotionCode || input.promotionChannelInfo ? {
          promotion: [{
            ...(input.promotionCode ? { promotion_code: input.promotionCode } : {}),
            ...(input.promotionChannelInfo ? { promotion_channel_info: input.promotionChannelInfo } : {}),
          }],
        } : {}),
        ...(input.businessModel ? { trade_extra_param: { business_model: input.businessModel } } : {}),
      }),
      param_place_order_request4_open_api_d_t_o: JSON.stringify({
        out_order_id: input.outOrderId,
        logistics_address: input.address,
        product_items: input.items,
      }),
    },
    getAliExpressCredentials(),
  )
  const result = response.aliexpress_ds_order_create_response?.result
  assertOrderSucceeded(result)
  return { orderIds: result.order_list?.number?.map(String) ?? [] }
}

function assertOrderSucceeded(result: AliExpressDsOrderCreateResult | undefined): asserts result is AliExpressDsOrderCreateResult & { is_success: true } {
  if (!result?.is_success) {
    throw new Error(`AliExpress DS order creation failed: ${result?.error_code ?? 'UNKNOWN'} — ${result?.error_msg ?? 'unknown error'}`)
  }
}

function validateOrderInput(input: CreateAliExpressOrderInput): void {
  if (!input.outOrderId.trim()) throw new Error('outOrderId is required.')
  if (input.outOrderId.length > 128) throw new Error('outOrderId is too long.')
  if (!input.address.country || !/^[A-Za-z]{2}$/.test(input.address.country)) throw new Error('address.country must be a two-letter country code.')
  if (!input.address.city?.trim()) throw new Error('address.city is required.')
  if (!input.address.province?.trim()) throw new Error('address.province is required.')
  if (!input.address.address?.trim()) throw new Error('address.address is required.')
  if (!input.items.length) throw new Error('At least one product item is required.')
  for (const item of input.items) {
    if (!Number.isInteger(item.product_count) || item.product_count < 1) throw new Error('Each product item must have a positive integer product_count.')
  }
}