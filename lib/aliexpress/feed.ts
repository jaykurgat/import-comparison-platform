import { callAliExpressSync, getAliExpressCredentials } from './client'

export interface AliExpressFeedItemIds {
  itemIds: string[]
  total: number
  searchId?: string
}

interface FeedItemIdsResponse {
  aliexpress_ds_feed_itemids_get_response?: {
    result?: {
      products?: { number?: Array<string | number> }
      total?: number
      search_id?: string
    }
  }
}

/**
 * Fetches a page from an AliExpress DS feed after a feed name has been
 * obtained from the official feed/recommendation APIs.
 *
 * We deliberately do not invent feed names or selection rules here.
 */
export async function getAliExpressFeedItemIds(
  feedName: string,
  pageSize = 200,
  searchId?: string,
): Promise<AliExpressFeedItemIds> {
  if (!feedName.trim()) throw new Error('feedName is required.')

  const response = await callAliExpressSync<FeedItemIdsResponse>(
    'aliexpress.ds.feed.itemids.get',
    {
      feed_name: feedName,
      page_size: String(Math.min(Math.max(pageSize, 1), 200)),
      ...(searchId ? { search_id: searchId } : {}),
    },
    getAliExpressCredentials(),
  )

  const result = response.aliexpress_ds_feed_itemids_get_response?.result
  return {
    itemIds: (result?.products?.number ?? []).map(String),
    total: Number(result?.total ?? 0),
    searchId: result?.search_id,
  }
}
