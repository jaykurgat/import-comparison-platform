import { prisma } from '@/lib/prisma'

export type HeroButton = { label: string; href: string }
export type HeroColumn = {
  width?: number
  imageUrl?: string
  backgroundColor?: string
  overlayOpacity?: number
  imagePosition?: 'left' | 'center' | 'right'
  heading?: string
  description?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  buttons?: HeroButton[]
}
export type HeroSlide = {
  backgroundColor?: string
  imageUrl?: string
  overlayOpacity?: number
  imagePosition?: 'left' | 'center' | 'right'
  heading?: string
  description?: string
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'center' | 'bottom'
  buttons?: HeroButton[]
  columns?: HeroColumn[]
}
export type HeroConfig = {
  enabled: boolean
  mode: 'banner' | 'carousel' | 'grid'
  height: number
  backgroundColor: string
  autoplay: boolean
  autoplaySeconds: number
  showArrows: boolean
  showDots: boolean
  slides: HeroSlide[]
}

export const defaultHeroConfig: HeroConfig = {
  enabled: true,
  mode: 'banner',
  height: 420,
  backgroundColor: '#e8efe9',
  autoplay: true,
  autoplaySeconds: 5,
  showArrows: true,
  showDots: true,
  slides: [{
    backgroundColor: '#e8efe9',
    overlayOpacity: 0,
    heading: 'Shop products from one catalogue.',
    description: 'Browse products, choose the options you want and shop when a listing is ready.',
    textColor: '#10241d',
    textAlign: 'left',
    verticalAlign: 'center',
    buttons: [{ label: 'Start shopping', href: '/products' }],
    columns: [],
  }],
}

export async function getHomepageHero(): Promise<HeroConfig> {
  const hero = await prisma.homepageHero.findUnique({ where: { key: 'homepage' } })
  if (!hero) return defaultHeroConfig
  return { ...defaultHeroConfig, ...(hero.config as Partial<HeroConfig>), enabled: hero.enabled }
}
