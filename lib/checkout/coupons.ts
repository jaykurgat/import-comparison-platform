import { prisma } from '@/lib/prisma'

export type CouponLine = { key: string; categoryId: string | null; lineTotal: number }

function descendants(categories: Array<{ id: string; parentId: string | null }>, roots: string[]) {
  const children = new Map<string, string[]>()
  for (const row of categories) if (row.parentId) children.set(row.parentId, [...(children.get(row.parentId) ?? []), row.id])
  const result = new Set<string>(), stack = [...roots]
  while (stack.length) {
    const id = stack.pop()!
    if (result.has(id)) continue
    result.add(id)
    for (const child of children.get(id) ?? []) stack.push(child)
  }
  return result
}

export async function getCouponDiscount(code: string, lines: CouponLine[]) {
  const normalized = code.trim().toUpperCase()
  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } })
  const now = new Date()
  if (!coupon || !coupon.enabled || (coupon.startsAt && coupon.startsAt > now) || (coupon.endsAt && coupon.endsAt < now)) throw new Error('That coupon is invalid or no longer active.')
  if (!coupon.appliesToAll && !coupon.productKeys.length && !coupon.categoryIds.length) throw new Error('That coupon has no eligible products.')
  const categories = coupon.categoryIds.length ? await prisma.category.findMany({ select: { id: true, parentId: true } }) : []
  const categorySet = descendants(categories, coupon.categoryIds)
  const eligibleBase = lines.filter((line) => coupon.appliesToAll || coupon.productKeys.includes(line.key) || (!!line.categoryId && categorySet.has(line.categoryId))).reduce((sum, line) => sum + line.lineTotal, 0)
  if (eligibleBase <= 0) throw new Error('That coupon does not apply to any items in your cart.')
  const percent = Number(coupon.discountPercent)
  return { couponId: coupon.id, discountAmount: Math.round(eligibleBase * percent) / 100, discountPercent: percent }
}

export async function getCouponQuote(code: string, items: Array<{ kind: 'local' | 'supplier'; productId?: string; skuId?: string; sku?: string; quantity: number }>) {
  const lines: CouponLine[] = []
  for (const item of items) {
    const quantity = Math.min(20, Math.max(1, Math.trunc(Number(item.quantity) || 0)))
    if (!quantity) continue
    if (item.kind === 'local') {
      const sku = await prisma.localSKU.findUnique({ where: { sku: String(item.sku ?? '') }, select: { sku: true, categoryId: true, currentPrice: true } })
      if (!sku) throw new Error('One of the products is no longer available.')
      lines.push({ key: 'local:' + sku.sku, categoryId: sku.categoryId, lineTotal: Number(sku.currentPrice) * quantity })
    } else {
      const productId = String(item.productId ?? ''), skuId = String(item.skuId ?? '')
      const sku = await prisma.aliExpressSKU.findUnique({ where: { productId_skuId: { productId, skuId } }, select: { categoryId: true, importListingPrice: { select: { sellPrice: true } } } })
      if (!sku?.importListingPrice) throw new Error('One of the supplier products is no longer available.')
      lines.push({ key: 'supplier:' + productId + ':' + skuId, categoryId: sku.categoryId, lineTotal: Number(sku.importListingPrice.sellPrice) * quantity })
    }
  }
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const discount = await getCouponDiscount(code, lines)
  return { code: code.trim().toUpperCase(), discount: discount.discountAmount, total: Math.max(0, Math.round((subtotal - discount.discountAmount) * 100) / 100), percent: discount.discountPercent }
}
