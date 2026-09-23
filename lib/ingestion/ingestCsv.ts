import { prisma } from '../prisma'
import { parseCsv, type CsvColumnMapping, type CsvParseError } from './csvParser'

/**
 * Writes parsed CSV rows into LocalListingRaw. Append-only, per the
 * project's data principle — every run creates NEW rows, even for
 * previously-seen sourceRefs. This is intentional: LocalListingRaw is the
 * audit trail, not the canonical record (that's LocalSKU, built later by
 * the matching/review process).
 */

export interface IngestCsvResult {
  inserted: number
  errors: CsvParseError[]
}

export async function ingestCsv(csvContent: string, mapping: CsvColumnMapping): Promise<IngestCsvResult> {
  const { rows, errors } = parseCsv(csvContent, mapping)

  let inserted = 0
  for (const row of rows) {
    await prisma.localListingRaw.create({
      data: {
        source: 'MANUAL_CSV',
        sourceRef: row.sourceRef,
        title: row.title,
        sourceUrl: row.sourceUrl,
        description: row.description,
        imageUrls: row.imageUrls,
        priceRaw: row.priceRaw,
        currency: row.currency,
        inStock: row.inStock,
        attributesRaw: row.attributesRaw,
      },
    })
    inserted++
  }

  return { inserted, errors }
}
