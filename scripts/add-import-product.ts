import 'dotenv/config'
import { prisma } from '../lib/prisma'
import { getAliExpressProduct } from '../lib/aliexpress/product'
import { calculateImportOnlyPrice } from '../lib/landedCost/calculateImportOnlyPrice'

/**
 * The real way to add a product to your storefront — publishes ALL
 * variants of the given AliExpress product and computes a sell price for
 * each. This is NOT a test script; running this makes real products go
 * live on your site.
 *
 * Simplification worth knowing: every color/size variant becomes its OWN
 * independent listing with its own page (same granularity as the local
 * side) — this does not build a single product page with a variant
 * selector spanning all colors/sizes. That's a real, different UX pattern
 * (closer to how Amazon/Jumia work) that would need its own design if you
 * want it later.
 */

async function main() {
  const productId = process.argv[2]

  if (!productId) {
    console.error('Usage: npx tsx scripts/add-import-product.ts <product_id>')
    console.error('Get product_id from any real AliExpress product URL, e.g.')
    console.error('aliexpress.com/item/1005001234567890.html -> product_id is 1005001234567890')
    process.exit(1)
  }

  console.log(`Fetching product ${productId}...`)
  const result = await getAliExpressProduct(productId, 'KE')
  console.log(`Found "${result.data.title}" with ${result.data.skus.length} variant(s).\n`)

  console.log('Publishing all variants and computing sell prices...')
  for (const sku of result.data.skus) {
    const aliExpressSku = await prisma.aliExpressSKU.findUnique({
      where: { productId_skuId: { productId, skuId: sku.skuId } },
    })

    if (!aliExpressSku) {
      console.warn(`  Skipping ${sku.skuId} — not found in database (unexpected; persist may have failed).`)
      continue
    }

    await prisma.aliExpressSKU.update({
      where: { id: aliExpressSku.id },
      data: { isPublished: true },
    })

    const priced = await calculateImportOnlyPrice(productId, sku.skuId)
    console.log(
      `  ${sku.skuId} (${sku.color ?? '—'}/${sku.size ?? '—'}): sell price KES ${priced.sellPrice} ` +
        `(cost ${priced.landedImportPrice} + markup ${priced.markup})`
    )
  }

  console.log('\n✅ Done. These variants will now appear on your storefront (homepage/listing) —')
  console.log('run `npm run dev` and check localhost:3000/products if it\'s not already running.')
}

main().catch((err) => {
  console.error('Failed to add product:', err)
  process.exit(1)
})
