import 'dotenv/config'
import { promoteLocalListings } from '../lib/matching/promoteLocalSku'
import { runMatchingEngine } from '../lib/matching/matchEngine'

async function main() {
  console.log('--- Step 1: Promoting LocalListingRaw -> LocalSKU ---')
  const promo = await promoteLocalListings()
  console.log(`Created: ${promo.created} | Updated: ${promo.updated} | Raw rows linked: ${promo.rawRowsLinked}`)

  console.log('\n--- Step 2: Running matching engine ---')
  const result = await runMatchingEngine()
  console.log(JSON.stringify(result, null, 2))

  console.log('\nRun `npx prisma studio` and check the SKUMatch table:')
  console.log('- status=NEEDS_REVIEW rows are candidates for a human to confirm or reject')
  console.log('- status=AUTO_MATCHED rows are high-confidence — still worth spot-checking given')
  console.log('  the category gate is temporarily disabled (see matchEngine.ts comment)')
}

main().catch((err) => {
  console.error('Matching run failed:', err)
  process.exit(1)
})
