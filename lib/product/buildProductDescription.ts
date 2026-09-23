export type ProductDescriptionSource = 'local' | 'import'

export interface ProductDescriptionFeature {
  label: string
  value: string
}

export interface ProductDescriptionResult {
  overview: string
  coreFeatures: ProductDescriptionFeature[]
  text: string
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

export function cleanProductDescription(value: string | null | undefined): string {
  if (!value?.trim()) return ''
  return decodeBasicHtmlEntities(
    value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  )
}

function formatFeatureLabel(key: string): string {
  const label = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!label) return 'Feature'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function normaliseValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const cleaned = cleanProductDescription(value).replace(/\s+/g, ' ').trim()
    return cleaned || null
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    const parts = value.map((item) => normaliseValue(item)).filter((item): item is string => Boolean(item))
    return parts.length ? parts.join(', ') : null
  }
  return null
}

function addFeature(map: Map<string, ProductDescriptionFeature>, label: string, value: string | null): void {
  if (!value) return
  const key = label.toLowerCase()
  const existing = map.get(key)
  if (!existing) { map.set(key, { label, value }); return }
  const values = new Set(existing.value.split(' · ').map((item) => item.trim()).filter(Boolean))
  values.add(value)
  existing.value = [...values].join(' · ')
}

function addSpecRecord(map: Map<string, ProductDescriptionFeature>, specs: Record<string, unknown> | null | undefined): void {
  if (!specs) return
  for (const [key, rawValue] of Object.entries(specs)) {
    const lowerKey = key.trim().toLowerCase()
    if (!lowerKey || lowerKey === 'color' || lowerKey === 'colour' || lowerKey === 'size') continue
    const value = normaliseValue(rawValue)
    if (value) addFeature(map, formatFeatureLabel(key), value.slice(0, 180))
  }
}

export function buildProductDescription(input: {
  title: string
  description?: string | null
  source: ProductDescriptionSource
  categoryName?: string | null
  color?: string | null
  size?: string | null
  additionalColors?: string[]
  additionalSizes?: string[]
  specs?: Record<string, unknown> | null
  additionalSpecs?: Array<Record<string, unknown> | null | undefined>
  variantCount?: number
}): ProductDescriptionResult {
  const title = input.title.trim() || 'This product'
  const map = new Map<string, ProductDescriptionFeature>()
  const colors = [input.color ?? '', ...(input.additionalColors ?? [])].map(normaliseValue).filter((value): value is string => Boolean(value))
  const sizes = [input.size ?? '', ...(input.additionalSizes ?? [])].map(normaliseValue).filter((value): value is string => Boolean(value))
  if (colors.length) addFeature(map, 'Color', [...new Set(colors)].join(' · '))
  if (sizes.length) addFeature(map, 'Size', [...new Set(sizes)].join(' · '))
  addSpecRecord(map, input.specs)
  for (const specs of input.additionalSpecs ?? []) addSpecRecord(map, specs)

  const coreFeatures = [...map.values()].slice(0, 10)
  const suppliedOverview = cleanProductDescription(input.description)
  const overview = suppliedOverview || (
    title +
    ' is available through KijijiCart as a ' +
    (input.source === 'import' ? 'direct import listing.' : 'local listing.') +
    (input.categoryName ? ' It is listed under ' + input.categoryName + '.' : '') +
    ' The product information shown here reflects the details available for this listing.'
  )
  const featureText = coreFeatures.length
    ? '\n\nCore features:\n' + coreFeatures.map((feature) => '• ' + feature.label + ': ' + feature.value).join('\n')
    : ''
  const variantText = input.variantCount && input.variantCount > 1 ? '\n\nAvailable variants: ' + input.variantCount + '.' : ''
  return { overview, coreFeatures, text: overview + featureText + variantText }
}
