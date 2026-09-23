import { prisma } from '../prisma'
import { buildProductDescription } from '../product/buildProductDescription'
import { resolveCanonicalCategory } from '../categories/resolveCanonicalCategory'

export interface PromoteResult {
  created: number
  updated: number
  rawRowsLinked: number
  categorized: number
}

export async function promoteLocalListings(): Promise<PromoteResult> {
  const rawRows = await prisma.localListingRaw.findMany({
    orderBy: { ingestedAt: 'asc' },
  })

  const groupedBySourceRef = new Map<string, typeof rawRows>()
  for (const row of rawRows) {
    const group = groupedBySourceRef.get(row.sourceRef) ?? []
    group.push(row)
    groupedBySourceRef.set(row.sourceRef, group)
  }

  let created = 0
  let updated = 0
  let rawRowsLinked = 0
  let categorized = 0

  for (const [sourceRef, rows] of groupedBySourceRef) {
    const latest = rows[rows.length - 1]
    const attrs = (latest.attributesRaw as Record<string, string> | null) ?? {}
    const { category: sourceCategoryName, ...specs } = attrs

    const existing = await prisma.localSKU.findUnique({ where: { sku: sourceRef } })

    const description = buildProductDescription({
      title: latest.title,
      description: latest.description || existing?.description,
      source: 'local',
      color: attrs.color,
      size: attrs.size,
      specs,
    }).overview

    const resolvedCategory = await resolveCanonicalCategory({
      title: latest.title,
      sourceCategoryName,
      specs,
    })

    const canonicalData = {
      sku: sourceRef,
      title: latest.title,
      sourceUrl: latest.sourceUrl,
      description,
      imageUrls: latest.imageUrls,
      color: attrs.color,
      size: attrs.size,
      specs,
      currentPrice: latest.priceRaw,
      currency: latest.currency,
      inStock: latest.inStock ?? false,
      categoryId: resolvedCategory?.categoryId ?? existing?.categoryId ?? null,
    }

    const localSku = await prisma.localSKU.upsert({
      where: { sku: sourceRef },
      create: canonicalData,
      update: canonicalData,
    })

    if (resolvedCategory) categorized++
    if (existing) updated++
    else created++

    const linkResult = await prisma.localListingRaw.updateMany({
      where: { sourceRef, localSkuId: null },
      data: { localSkuId: localSku.id },
    })
    rawRowsLinked += linkResult.count
  }

  return { created, updated, rawRowsLinked, categorized }
}
