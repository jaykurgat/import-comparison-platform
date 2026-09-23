'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { submitPaidImportOrder } from '@/lib/checkout/submitPaidImportOrder'

export async function retryFailedSupplierSubmission(orderId: string): Promise<void> {
  await requireAdmin()

  const order = await prisma.importOrder.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })

  if (!order) throw new Error('Import order not found.')
  if (order.status !== 'FAILED' || order.payment?.status !== 'PAID') {
    throw new Error('Only failed supplier submissions with confirmed payment can be retried.')
  }

  await prisma.importOrder.update({
    where: { id: order.id },
    data: { status: 'PAID', errorMessage: null },
  })

  try {
    await submitPaidImportOrder(order.id)
  } finally {
    revalidatePath('/admin/orders')
  }
}
