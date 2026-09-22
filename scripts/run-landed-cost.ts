import 'dotenv/config'
import { calculateLandedCost } from '../lib/landedCost/calculateLandedCost'

async function main() {
  const skuMatchId = process.argv[2]

  if (!skuMatchId) {
    console.error('Usage: npx tsx scripts/run-landed-cost.ts <skuMatchId>')
    console.error('')
    console.error('Get a skuMatchId from Prisma Studio -> SKUMatch table -> copy a row\'s "id" value.')
    console.error('')
    console.error('IMPORTANT: the match must have status AUTO_MATCHED or MANUAL_CONFIRMED. Confirm it')
    console.error('via the Match Review UI at /admin/review, or by editing its status in Prisma Studio.')
    process.exit(1)
  }

  console.log(`Calculating landed cost for SKUMatch ${skuMatchId}...`)
  const result = await calculateLandedCost(skuMatchId)

  console.log('\n--- Result ---')
  console.log(JSON.stringify(result, null, 2))

  console.log(
    `\n${result.renderMode === 'IMPORT_ADVANTAGE' ? '✅ Import wins' : '➡️  Local wins or ties'} — ` +
      `Sell price: KES ${result.sellPrice} (cost ${result.landedImportPrice} + markup ${result.breakdown.markup}) ` +
      `vs Local: KES ${result.localTotalPrice}`
  )

  if (result.isStale) {
    console.log('⚠️  This result used at least one fallback/stale data source — see isStale in the output.')
  }
}

main().catch((err) => {
  console.error('Landed cost calculation failed:', err)
  process.exit(1)
})
