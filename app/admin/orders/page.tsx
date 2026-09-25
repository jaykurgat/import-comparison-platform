export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin/auth'
import { logoutAdmin } from '../actions'
import { retryFailedSupplierSubmission } from './actions'

export default async function OrdersAdminPage() {
  await requireAdmin()
  const orders = await prisma.importOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { payment: true, items: true, shipments: true },
  })

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-6 py-10 text-[#1C1C1E]">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-[#E3E3DF] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
            <p className="mt-1 text-sm text-[#6B6B6E]">Payments, fulfillment and shipping operations.</p>
          </div>
          <form action={logoutAdmin}><button type="submit" className="rounded border border-[#D8D8D3] px-4 py-2 text-sm font-medium hover:bg-white">Sign out</button></form>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <a href="/admin" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Dashboard</a>
          <a href="/admin/health" className="rounded border border-[#D8D8D3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F7F7F5]">Health</a>
        </div>
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#E3E3DF] bg-white">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="border-b border-[#E3E3DF] bg-[#FAFAF9] text-left text-xs uppercase tracking-wide text-[#8A8A8E]">
              <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Fulfillment</th><th className="px-4 py-3">Created</th></tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3DF]">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-4 font-medium">{order.outOrderId}<div className="mt-1 text-xs text-[#8A8A8E]">{order.id}</div></td>
                  <td className="px-4 py-4">{order.fullName ?? '—'}<div className="mt-1 text-xs text-[#8A8A8E]">{order.mobileNo ?? '—'}</div></td>
                  <td className="px-4 py-4 tabular-nums">{order.items.length}</td>
                  <td className="px-4 py-4 font-medium tabular-nums">{order.currency} {Number(order.customerTotal).toLocaleString()}</td>
                  <td className="px-4 py-4"><span className="font-medium">{order.payment?.status ?? '—'}</span>{order.payment?.mpesaReceiptNumber && <div className="mt-1 text-xs text-[#6B6B6E]">{order.payment.mpesaReceiptNumber}</div>}</td>
                  <td className="px-4 py-4"><span className="font-medium">{order.status}</span>{order.shipments.length > 0 && <div className="mt-1 text-xs font-medium text-[#176B45]">{order.shipments.map((shipment) => shipment.currentStatus).join(', ')}</div>}{order.supplierOrderIds.length > 0 && <div className="mt-1 text-xs text-[#6B6B6E]">{order.supplierOrderIds.join(', ')}</div>}{order.errorMessage && <div className="mt-1 max-w-sm text-xs text-[#A6432D]">{order.errorMessage}</div>}{order.status === 'FAILED' && order.payment?.status === 'PAID' && <form action={retryFailedSupplierSubmission.bind(null, order.id)} className="mt-2"><button type="submit" className="rounded border border-[#D8D8D3] px-2.5 py-1 text-xs font-medium hover:bg-[#F7F7F5]">Retry supplier submission</button></form>}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-[#6B6B6E]">{order.createdAt.toLocaleString()}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-[#6B6B6E]">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
