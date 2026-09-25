import { prisma } from '@/lib/prisma'
import { getAliExpressFreight } from '@/lib/aliexpress/freight'
import { createAliExpressDsOrder } from '@/lib/aliexpress/order'
import { syncImportOrderTracking } from './syncImportTracking'

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
    if (!order || order.items.length === 0) throw new Error('Paid order is missing its order items.')

    const supplierItems = order.items.filter((item) => item.aliExpressSkuId)
    if (supplierItems.length === 0) {
      await prisma.importOrder.update({
        where: { id: order.id },
        data: { status: 'SUBMITTED', errorMessage: null },
      })
      return
    }

    const supplierItemsForApi: Array<{ product_count: number; product_id: number; logistics_service_name?: string }> = []

    for (const item of supplierItems) {
      const sku = await prisma.aliExpressSKU.findUnique({ where: { id: item.aliExpressSkuId! } })
      if (!sku || sku.availableStock < item.quantity) {
        throw new Error('Supplier stock is no longer sufficient for a paid order.')
      }

      const freight = await getAliExpressFreight({
        productId: item.productId,
        skuId: item.skuId,
        shipToCountry: order.country,
        quantity: item.quantity,
        currency: 'USD',
      })
      const option = freight.data.options[0]
      if (!option || option.currency !== 'USD') {
        throw new Error('No valid supplier delivery option is available after payment.')
      }

      supplierItemsForApi.push({
        product_count: item.quantity,
        product_id: Number(item.productId),
        ...(option.code ? { logistics_service_name: option.code } : {}),
      })
    }

    const supplier = await createAliExpressDsOrder({
      outOrderId: order.outOrderId,
      address: {
        address: order.address,
        ...(order.address2 ? { address2: order.address2 } : {}),
        city: order.city,
        contact_person: order.fullName ?? '',
        country: order.country,
        full_name: order.fullName ?? '',
        mobile_no: order.mobileNo ?? '',
        province: order.province,
        ...(order.zip ? { zip: order.zip } : {}),
      },
      items: supplierItemsForApi,
      payCurrency: 'USD',
      tryToPay: false,
    })

    await prisma.importOrder.update({
      where: { id: order.id },
      data: { status: 'SUBMITTED', supplierOrderIds: supplier.orderIds, errorMessage: null },
    })

    try {
      await syncImportOrderTracking(order.id)
    } catch {
      // Scheduled tracking sync will retry.
    }
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
