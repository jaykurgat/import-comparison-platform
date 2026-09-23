import { prisma } from '../prisma'

export interface OperationalHealth {
  orders: {
    paymentPending: number
    paid: number
    submitting: number
    submitted: number
    failed: number
    cancelled: number
  }
  payments: {
    pending: number
    paid: number
    failed: number
    expired: number
  }
  recent: {
    ordersLast24h: number
    paidLast24h: number
    failedLast24h: number
  }
}

export async function getOperationalHealth(): Promise<OperationalHealth> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [
    paymentPending,
    paid,
    submitting,
    submitted,
    failed,
    cancelled,
    pendingPayments,
    paidPayments,
    failedPayments,
    expiredPayments,
    ordersLast24h,
    paidLast24h,
    failedLast24h,
  ] = await Promise.all([
    prisma.importOrder.count({ where: { status: 'PAYMENT_PENDING' } }),
    prisma.importOrder.count({ where: { status: 'PAID' } }),
    prisma.importOrder.count({ where: { status: 'SUBMITTING' } }),
    prisma.importOrder.count({ where: { status: 'SUBMITTED' } }),
    prisma.importOrder.count({ where: { status: 'FAILED' } }),
    prisma.importOrder.count({ where: { status: 'CANCELLED' } }),
    prisma.importPayment.count({ where: { status: 'PENDING' } }),
    prisma.importPayment.count({ where: { status: 'PAID' } }),
    prisma.importPayment.count({ where: { status: 'FAILED' } }),
    prisma.importPayment.count({ where: { status: 'EXPIRED' } }),
    prisma.importOrder.count({ where: { createdAt: { gte: since } } }),
    prisma.importPayment.count({ where: { status: 'PAID', paidAt: { gte: since } } }),
    prisma.importOrder.count({ where: { status: 'FAILED', updatedAt: { gte: since } } }),
  ])

  return {
    orders: { paymentPending, paid, submitting, submitted, failed, cancelled },
    payments: { pending: pendingPayments, paid: paidPayments, failed: failedPayments, expired: expiredPayments },
    recent: { ordersLast24h, paidLast24h, failedLast24h },
  }
}
