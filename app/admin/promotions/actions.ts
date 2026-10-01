'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

export async function saveAnnouncement(formData: FormData) {
  await requireAdmin()
  const message = String(formData.get('message') ?? '').trim()
  if (!message) throw new Error('Enter a promotional message.')
  await prisma.storefrontAnnouncement.upsert({
    where: { key: 'top-bar' },
    update: { message, enabled: formData.get('enabled') === 'on', showCouponPercentages: formData.get('showCouponPercentages') === 'on' },
    create: { key: 'top-bar', message, enabled: formData.get('enabled') === 'on', showCouponPercentages: formData.get('showCouponPercentages') === 'on' },
  })
  revalidatePath('/admin/promotions'); revalidatePath('/')
}

function lines(value: string) { return [...new Set(value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean))] }

export async function createCoupon(formData: FormData) {
  await requireAdmin()
  const code = String(formData.get('code') ?? '').trim().toUpperCase().replace(/\s+/g, '')
  const name = String(formData.get('name') ?? '').trim() || null
  const discountPercent = Number(formData.get('discountPercent') ?? 0)
  const appliesToAll = formData.get('appliesToAll') === 'on'
  const productKeys = lines(String(formData.get('productKeys') ?? ''))
  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean)
  const startsAtRaw = String(formData.get('startsAt') ?? '').trim()
  const endsAtRaw = String(formData.get('endsAt') ?? '').trim()
  const startsAt = startsAtRaw ? new Date(startsAtRaw) : null
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new Error('Coupon code must be 3–40 letters, numbers, hyphens or underscores.')
  if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) throw new Error('Discount must be between 0.01% and 100%.')
  if (!appliesToAll && !productKeys.length && !categoryIds.length) throw new Error('Select products, categories, or All products.')
  if (startsAt && Number.isNaN(startsAt.getTime())) throw new Error('Invalid start date.')
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new Error('Invalid end date.')
  if (startsAt && endsAt && endsAt <= startsAt) throw new Error('End date must be after the start date.')
  await prisma.coupon.create({ data: { code, name, discountPercent, appliesToAll, productKeys, categoryIds, startsAt, endsAt } })
  revalidatePath('/admin/promotions'); revalidatePath('/')
}

export async function toggleCoupon(id: string) {
  await requireAdmin()
  const coupon = await prisma.coupon.findUnique({ where: { id }, select: { enabled: true } })
  if (!coupon) throw new Error('Coupon not found.')
  await prisma.coupon.update({ where: { id }, data: { enabled: !coupon.enabled } })
  revalidatePath('/admin/promotions'); revalidatePath('/')
}