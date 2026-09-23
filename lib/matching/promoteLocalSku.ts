import { prisma } from '../prisma'
import { buildProductDescription } from '../product/buildProductDescription'

/**
 * Promotes LocalListingRaw rows into canonical LocalSKU records.
 *
 * Deliberately simple (per the project's conservative-over-clever
 * preference): groups raw rows by sourceRef only — NO fuzzy merging across
 * different sourceRefs that might be the same physical product. One
 * sourceRef = one LocalSKU, using whichever raw row is most recent
 * (ingestedAt) as the source of truth for the canonical fields. Every raw
 * row for that sourceRef gets linked via localSkuId, preserving the full
 * audit trail regardless of which one "won."
 *
 * Safe to re-run: upserts by the unique `sku` field, and only links raw
 * rows that aren't already linked.
 */

export interface PromoteResult {
  created: number
  updated: number
  rawRowsLinked: number
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

  for (const [sourceRef, rows] of groupedBySourceRef) {
    const latest = rows[rows.length - 1] // rows are ascending by ingestedAt
    const attrs = (latest.attributesRaw as Record<string, string> | null) ?? {}

    const existing = await prisma.localSKU.findUnique({ where: { sku: sourceRef } })

    const description = buildProductDescription({
      title: latest.title,
      description: latest.description || existing?.description,
      source: 'local',
      color: attrs.color,
      size: attrs.size,
      specs: attrs,
    }).overview

    const canonicalData = {
      sku: sourceRef,
      title: latest.title,
      sourceUrl: latest.sourceUrl,
      description,
      imageUrls: latest.imageUrls,
      color: attrs.color,
      size: attrs.size,
      specs: attrs,
      currentPrice: latest.priceRaw,
      currency: latest.currency,
      inStock: latest.inStock ?? false,
    }

    const localSku = await prisma.localSKU.upsert({
      where: { sku: sourceRef },
      create: canonicalData,
      update: canonicalData,
    })

    if (existing) updated++
    else created++

    const linkResult = await prisma.localListingRaw.updateMany({
      where: { sourceRef, localSkuId: null },
      data: { localSkuId: localSku.id },
    })
    rawRowsLinked += linkResult.count
  }

  return { created, updated, rawRowsLinked }
}
