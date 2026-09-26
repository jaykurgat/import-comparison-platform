'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { defaultHeroConfig, type HeroConfig } from '@/lib/homepage/hero'

export async function saveHomepageHero(formData: FormData) {
  await requireAdmin()
  const raw = String(formData.get('config') || '')
  let config: HeroConfig
  try {
    config = JSON.parse(raw) as HeroConfig
  } catch {
    throw new Error('Invalid hero configuration.')
  }
  if (!Array.isArray(config.slides) || config.slides.length < 1) throw new Error('Add at least one hero slide.')
  config.height = Math.max(220, Math.min(900, Number(config.height) || 420))
  config.autoplaySeconds = Math.max(2, Math.min(30, Number(config.autoplaySeconds) || 5))
  config.enabled = Boolean(config.enabled)
  config.mode = config.mode === 'carousel' || config.mode === 'grid' ? config.mode : 'banner'

  await prisma.homepageHero.upsert({
    where: { key: 'homepage' },
    create: { key: 'homepage', enabled: config.enabled, config },
    update: { enabled: config.enabled, config },
  })
  revalidatePath('/')
  revalidatePath('/admin/homepage')
}

export async function resetHomepageHero() {
  await requireAdmin()
  await prisma.homepageHero.upsert({
    where: { key: 'homepage' },
    create: { key: 'homepage', enabled: defaultHeroConfig.enabled, config: defaultHeroConfig },
    update: { enabled: defaultHeroConfig.enabled, config: defaultHeroConfig },
  })
  revalidatePath('/')
  revalidatePath('/admin/homepage')
}
