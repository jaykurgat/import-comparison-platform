import 'dotenv/config'
import { readFileSync } from 'fs'
import { ingestCsv } from '../lib/ingestion/ingestCsv'
import type { CsvColumnMapping } from '../lib/ingestion/csvParser'

/**
 * EDIT THIS to match your actual CSV's column headers exactly (case-
 * sensitive, must match what's in row 1 of your file). Only `title` and
 * `price` are required — leave any other field as undefined/remove the
 * line if your CSV doesn't have that column.
 */
const COLUMN_MAPPING: CsvColumnMapping = {
  title: 'Product Name',
  price: 'Price',
  sourceRef: 'SKU', // optional — remove this line if you don't have a unique ID column
  sourceUrl: 'Product URL', // optional — original local listing URL
  description: 'Description', // optional
  imageUrls: 'Image URLs', // optional — expects semicolon-separated URLs if multiple
  currency: 'Currency', // optional — defaults to KES if column missing/empty
  inStock: 'In Stock', // optional — accepts yes/no, true/false, 1/0, "in stock"/"out of stock"
  color: 'Color', // optional
  size: 'Size', // optional
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/ingest-csv.ts <path-to-csv-file>')
    process.exit(1)
  }

  console.log(`Reading ${filePath}...`)
  const csvContent = readFileSync(filePath, 'utf-8')

  console.log('Parsing and importing...')
  const result = await ingestCsv(csvContent, COLUMN_MAPPING)

  console.log(`\n✅ Inserted ${result.inserted} row(s) into LocalListingRaw.`)

  if (result.errors.length > 0) {
    console.log(`\n⚠️  ${result.errors.length} row(s) were skipped:`)
    for (const err of result.errors) {
      console.log(`  Row ${err.rowNumber}: ${err.reason}`)
    }
    console.log('\nThese rows were NOT imported. Fix them in your CSV and re-run if needed —')
    console.log('re-running is safe, it just adds new audit rows, it will not create duplicates')
    console.log('in your canonical LocalSKU table (that step happens later, during review/matching).')
  }
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
