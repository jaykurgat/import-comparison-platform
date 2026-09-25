import { createHash } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { callAliExpressTop, getAliExpressAppCredentials } from '@/lib/aliexpress/client'

interface AliExpressLogisticsInfo {
  logistics_no?: string
  logistics_service?: string
}

interface AliExpressOrderResult {
  gmt_create?: string
  logistics_info_list?: {
    ae_order_logistics_info?: AliExpressLogisticsInfo[]
  }
  logistics_status?: string
  order_status?: string
}

interface AliExpressOrderResponse {
  aliexpress_ds_trade_order_get_response?: {
    result?: AliExpressOrderResult
    rsp_code?: string
    rsp_msg?: string
  }
}

export interface ImportTrackingSyncResult {
  orderId: string
  supplierOrdersChecked: number
  shipmentsUpdated: number
  eventsAdded: number
  errors: string[]
}

const STATUS_MAP: Record<string, 'PENDING' | 'LABEL_CREATED' | 'IN_TRANSIT' | 'ARRIVED_DESTINATION' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'CANCELLED' | 'UNKNOWN'> = {
  NO_LOGISTICS: 'PENDING',
  WAIT_SELLER_SEND_GOODS: 'PENDING',
  SELLER_PART_SEND_GOODS: 'IN_TRANSIT',
  SELLER_SEND_PART_GOODS: 'IN_TRANSIT',
  SELLER_SEND_GOODS: 'IN_TRANSIT',
  WAIT_BUYER_ACCEPT_GOODS: 'IN_TRANSIT',
  BUYER_ACCEPT_GOODS: 'DELIVERED',
  FINISH: 'DELIVERED',
  TRADE_SUCCESS: 'DELIVERED',
  IN_CANCEL: 'CANCELLED',
  RISK_CONTROL: 'PENDING',
  IN_ISSUE: 'EXCEPTION',
  IN_FROZEN: 'EXCEPTION',
}

function normalizeStatus(raw: string | undefined) {
  if (!raw) return 'UNKNOWN' as const
  return STATUS_MAP[raw.trim().toUpperCase()] ?? 'UNKNOWN'
}

function eventKey(shipmentId: string, status: string, eventDate: Date, description?: string, location?: string) {
  return createHash('sha256')
    .update([shipmentId, status, eventDate.toISOString(), description ?? '', location ?? ''].join('|'))
    .digest('hex')
}

async function addEventIfMissing(input: {
  shipmentId: string
  status: 'PENDING' | 'LABEL_CREATED' | 'IN_TRANSIT' | 'ARRIVED_DESTINATION' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION' | 'CANCELLED' | 'UNKNOWN'
  rawStatus?: string
  description?: string
  location?: string
  eventDate: Date
  raw?: Prisma.InputJsonValue
}) {
  const externalKey = eventKey(input.shipmentId, input.status, input.eventDate, input.description, input.location)
  const existing = await prisma.importShipmentEvent.findUnique({ where: { externalKey } })
  if (existing) return false

  await prisma.importShipmentEvent.create({
    data: {
      shipmentId: input.shipmentId,
      status: input.status,
      rawStatus: input.rawStatus ?? null,
      description: input.description ?? null,
      location: input.location ?? null,
      eventDate: input.eventDate,
      externalKey,
      raw: input.raw ?? undefined,
    },
  })
  return true
}

async function getAliExpressOrder(orderId: string): Promise<AliExpressOrderResult> {
  const credentials = getAliExpressAppCredentials()
  const accessToken = process.env.ALIEXPRESS_ACCESS_TOKEN
  if (!accessToken) throw new Error('ALIEXPRESS_ACCESS_TOKEN is not configured.')

  const response = await callAliExpressTop<AliExpressOrderResponse>(
    'aliexpress.ds.trade.order.get',
    { order_id: orderId, session: accessToken },
    credentials,
  )
  const result = response.aliexpress_ds_trade_order_get_response?.result
  if (!result) {
    throw new Error(response.aliexpress_ds_trade_order_get_response?.rsp_msg || 'AliExpress returned no order tracking data.')
  }
  return result
}

export async function syncImportOrderTracking(orderId: string): Promise<ImportTrackingSyncResult> {
  const order = await prisma.importOrder.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, country: true, supplierOrderIds: true },
  })
  if (!order) throw new Error('Import order not found.')

  const result: ImportTrackingSyncResult = {
    orderId,
    supplierOrdersChecked: 0,
    shipmentsUpdated: 0,
    eventsAdded: 0,
    errors: [],
  }

  if (!order.supplierOrderIds.length) return result

  for (const supplierOrderId of order.supplierOrderIds) {
    result.supplierOrdersChecked += 1
    try {
      const supplier = await getAliExpressOrder(supplierOrderId)
      const rawStatus = supplier.logistics_status ?? supplier.order_status
      const currentStatus = normalizeStatus(rawStatus)
      const logistics = supplier.logistics_info_list?.ae_order_logistics_info ?? []
      const observed = logistics.length ? logistics : [{ logistics_no: undefined, logistics_service: undefined }]

      for (const info of observed) {
        const trackingNumber = info.logistics_no?.trim() || null
        const carrier = info.logistics_service?.trim() || null

        let shipment = await prisma.importShipment.findFirst({
          where: {
            orderId: order.id,
            supplierOrderId,
            ...(trackingNumber
              ? { OR: [{ trackingNumber }, { trackingNumber: null }] }
              : { trackingNumber: null }),
          },
          orderBy: { createdAt: 'asc' },
          include: { events: { take: 1, orderBy: { eventDate: 'desc' } } },
        })

        const wasStatus = shipment?.currentStatus
        const now = new Date()

        if (!shipment) {
          shipment = await prisma.importShipment.create({
            data: {
              orderId: order.id,
              supplierOrderId,
              carrier,
              trackingNumber,
              shippingMethod: carrier,
              currentStatus,
              currentRawStatus: rawStatus ?? null,
              lastSyncedAt: now,
            },
            include: { events: { take: 1, orderBy: { eventDate: 'desc' } } },
          })
        } else {
          shipment = await prisma.importShipment.update({
            where: { id: shipment.id },
            data: {
              carrier: carrier ?? shipment.carrier,
              trackingNumber: trackingNumber ?? shipment.trackingNumber,
              shippingMethod: carrier ?? shipment.shippingMethod,
              currentStatus,
              currentRawStatus: rawStatus ?? shipment.currentRawStatus,
              lastSyncedAt: now,
              ...(currentStatus === 'DELIVERED' ? { deliveredAt: shipment.deliveredAt ?? now } : {}),
              ...(wasStatus !== 'DELIVERED' && currentStatus === 'IN_TRANSIT' && !shipment.shippedAt ? { shippedAt: now } : {}),
            },
            include: { events: { take: 1, orderBy: { eventDate: 'desc' } } },
          })
        }

        if (!shipment.shippedAt && currentStatus === 'IN_TRANSIT') {
          await prisma.importShipment.update({ where: { id: shipment.id }, data: { shippedAt: now } })
        }

        const statusChanged = wasStatus !== currentStatus
        if (statusChanged || shipment.events.length === 0) {
          const added = await addEventIfMissing({
            shipmentId: shipment.id,
            status: currentStatus,
            rawStatus,
            description: trackingNumber
              ? 'AliExpress shipment status: ' + (rawStatus ?? currentStatus)
              : 'Awaiting carrier and tracking information.',
            eventDate: now,
            raw: {
              supplierOrderId,
              trackingNumber: trackingNumber ?? '',
              carrier: carrier ?? '',
              rawStatus: rawStatus ?? '',
              orderStatus: supplier.order_status ?? '',
            },
          })
          if (added) result.eventsAdded += 1
        }

        result.shipmentsUpdated += 1
      }
    } catch (error) {
      result.errors.push(supplierOrderId + ': ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return result
}

export async function syncActiveImportTracking(limit = 50): Promise<ImportTrackingSyncResult[]> {
  const orders = await prisma.importOrder.findMany({
    where: { status: 'SUBMITTED', supplierOrderIds: { isEmpty: false } },
    select: { id: true },
    orderBy: { updatedAt: 'asc' },
    take: limit,
  })

  const results: ImportTrackingSyncResult[] = []
  for (const order of orders) {
    results.push(await syncImportOrderTracking(order.id))
  }
  return results
}
