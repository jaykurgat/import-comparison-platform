import 'dotenv/config'
import { getAliExpressProduct } from '../lib/aliexpress/product'
import { getAliExpressFreight } from '../lib/aliexpress/freight'

/**
 * Manual test for the permanent AliExpress client (lib/aliexpress/).
 * Run it twice in a row — the second run should show source: "cache"
 * instead of "fresh", proving the Redis caching actually works.
 */

const PRODUCT_ID = process.argv[2] ?? '1005007921636657'
const SKU_ID = process.argv[3] ?? '12000042865223892'

async function main() {
  console.log(`\n--- Fetching product ${PRODUCT_ID} ---`)
  const product = await getAliExpressProduct(PRODUCT_ID, 'KE')
  console.log(`source: ${product.source} | isStale: ${product.isStale} | asOf: ${product.asOf}`)
  console.log(`title: ${product.data.title}`)
  console.log(`skus found: ${product.data.skus.length}`)
  console.log(`first sku: ${JSON.stringify(product.data.skus[0], null, 2)}`)

  console.log(`\n--- Fetching freight for product ${PRODUCT_ID}, sku ${SKU_ID} ---`)
  const freight = await getAliExpressFreight({ productId: PRODUCT_ID, skuId: SKU_ID })
  console.log(`source: ${freight.source} | isStale: ${freight.isStale} | asOf: ${freight.asOf}`)
  console.log(`options: ${JSON.stringify(freight.data.options, null, 2)}`)

  console.log('\n--- Done ---')
  console.log('Run this script again — the second run should show source: "cache" for both calls.')
  console.log('Then check `npx prisma studio` — AliExpressSKU, AliExpressPriceSnapshot, and')
  console.log('FreightSnapshot should all have rows now.')
}

main().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
