import { parse } from 'csv-parse/sync'

/**
 * Pure parsing layer: turns raw CSV text into validated row objects, with
 * no database access. Kept separate from ingestCsv.ts so this logic can be
 * tested on its own without needing Neon connected.
 *
 * Per the conservative-matching approach: a row with a missing required
 * field is NOT guessed at or defaulted silently — it's collected as an
 * error and skipped, so a human can look at exactly what went wrong.
 */

export interface CsvColumnMapping {
  /** CSV column name containing the product title. Required. */
  title: string
  /** CSV column name containing the price. Required. */
  price: string
  /** CSV column name for a unique reference per row (SKU code, supplier ID, etc). Optional — auto-generated from row number if not provided. */
  sourceRef?: string
  sourceUrl?: string
  description?: string
  /** CSV column name containing image URLs, semicolon-separated if multiple. */
  imageUrls?: string
  currency?: string
  inStock?: string
  color?: string
  size?: string
}

export interface ParsedCsvRow {
  rowNumber: number // 1-indexed, matches what you'd see if you opened the CSV in a spreadsheet (header = row 1)
  sourceRef: string
  title: string
  sourceUrl?: string
  description?: string
  imageUrls: string[]
  priceRaw: number
  currency: string
  inStock?: boolean
  attributesRaw: Record<string, string>
}

export interface CsvParseError {
  rowNumber: number
  reason: string
  rawRow: Record<string, string>
}

export interface CsvParseResult {
  rows: ParsedCsvRow[]
  errors: CsvParseError[]
}

const DEFAULT_CURRENCY = 'KES'

function parseInStock(value: string | undefined): boolean | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const normalized = value.trim().toLowerCase()
  if (['yes', 'true', '1', 'in stock', 'available'].includes(normalized)) return true
  if (['no', 'false', '0', 'out of stock', 'unavailable'].includes(normalized)) return false
  return undefined // unrecognized value — leave unset rather than guess
}

export function parseCsv(csvContent: string, mapping: CsvColumnMapping): CsvParseResult {
  const records: Record<string, string>[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  const rows: ParsedCsvRow[] = []
  const errors: CsvParseError[] = []

  records.forEach((record, index) => {
    const rowNumber = index + 2 // +1 for 0-index, +1 because row 1 is the header

    const title = record[mapping.title]?.trim()
    if (!title) {
      errors.push({ rowNumber, reason: `Missing required title (column "${mapping.title}")`, rawRow: record })
      return
    }

    const priceStr = record[mapping.price]?.trim()
    const priceRaw = priceStr ? Number(priceStr.replace(/[^0-9.-]/g, '')) : NaN
    if (!priceStr || Number.isNaN(priceRaw)) {
      errors.push({
        rowNumber,
        reason: `Missing or unparseable price (column "${mapping.price}", value "${priceStr ?? ''}")`,
        rawRow: record,
      })
      return
    }

    const sourceRef = mapping.sourceRef ? record[mapping.sourceRef]?.trim() : undefined
    const resolvedSourceRef = sourceRef && sourceRef.length > 0 ? sourceRef : `csv-row-${rowNumber}`

    const imageUrls = mapping.imageUrls
      ? (record[mapping.imageUrls] ?? '')
          .split(';')
          .map((u) => u.trim())
          .filter(Boolean)
      : []

    const attributesRaw: Record<string, string> = {}
    if (mapping.color && record[mapping.color]) attributesRaw.color = record[mapping.color].trim()
    if (mapping.size && record[mapping.size]) attributesRaw.size = record[mapping.size].trim()

    rows.push({
      rowNumber,
      sourceRef: resolvedSourceRef,
      title,
      description: mapping.description ? record[mapping.description]?.trim() : undefined,
      imageUrls,
      priceRaw,
      currency: mapping.currency ? record[mapping.currency]?.trim() || DEFAULT_CURRENCY : DEFAULT_CURRENCY,
      inStock: mapping.inStock ? parseInStock(record[mapping.inStock]) : undefined,
      attributesRaw,
    })
  })

  return { rows, errors }
}
