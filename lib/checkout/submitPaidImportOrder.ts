import { prisma } from '@/lib/prisma'
import { getAliExpressFreight } from '@/lib/aliexpress/freight'
import { resolveAliExpressAddress } from '@/lib/aliexpress/addressResolver'
import { createAliExpressDsOrder } from '@/lib/aliexpress/order'

export async function submitPaidImportOrder(orderId: string): Promise<void> {
  const claimed = await prisma.importOrder.updateMany({
    where: { id: orderId, status: 'PAID' },
    data: { status: 'SUBMITTING' },
  })

  if (claimed.count !== 1) return

  try {
    const order = await prisma.importOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order || order.items.length !== 1) throw new Error('Paid import order is missing its order item.')

    const item = order.items[0]
    const sku = await prisma.aliExpressSKU.findUnique({
      where: { id: item.aliExpressSkuId },
    })
    if (!sku || sku.availableStock < item.quantity) {
      throw new Error('Supplier stock is no longer sufficient for this paid order.')
    }

    const resolved = await resolveAliExpressAddress({
      countryCode: order.country,
      province: order.province,
      city: order.city,
    })

    const freight = await getAliExpressFreight({
      productId: item.productId,
      skuId: item.skuId,
      shipToCountry: resolved.country,
      quantity: item.quantity,
      currency: 'USD',
    })
    const option = freight.data.options[0]
    if (!option || option.currency !== 'USD') {
      throw new Error('No valid supplier delivery option is available after payment.')
    }

    const supplier = await createAliExpressDsOrder({
      outOrderId: order.outOrderId,
      address: {
        address: order.address,
        ...(order.address2 ? { address2: order.address2 } : {}),
        city: resolved.city,
        contact_person: order.fullName ?? '',
        country: resolved.country,
        full_name: order.fullName ?? '',
        mobile_no: order.mobileNo ?? '',
        province: resolved.province,
        ...(order.zip ? { zip: order.zip } : {}),
      },
      items: [{
        product_count: item.quantity,
        product_id: Number(item.productId),
        ...(option.code ? { logistics_service_name: option.code } : {}),
      }],
      payCurrency: 'USD',
      tryToPay: false,
    })

    await prisma.importOrder.update({
      where: { id: order.id },
      data: { status: 'SUBMITTED', supplierOrderIds: supplier.orderIds, errorMessage: null },
    })
  } catch (error) {
    await prisma.importOrder.update({
      where: { id: orderId },
      data: {
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    })
    throw error
  }
}
