import { generateSignature, getTopTimestamp } from './sign'
import type { AliExpressErrorResponse } from './types'

/**
 * The confirmed-working low-level caller for AliExpress /sync method calls
 * (aliexpress.ds.product.get, aliexpress.ds.freight.query). Do not reuse
 * this for the OAuth token endpoints — those are REST-style with different
 * signing/timestamp rules (see scripts/aliexpress-exchange-token.ts).
 */

const SYNC_ENDPOINT = 'https://api-sg.aliexpress.com/sync'
const API_PATH = '' // confirmed correct for /sync calls — do not add '/sync' here

export class AliExpressApiError extends Error {
  code: string
  requestId: string

  constructor(code: string, message: string, requestId: string) {
    super(message)
    this.name = 'AliExpressApiError'
    this.code = code
    this.requestId = requestId
  }
}

interface CallOptions {
  appKey: string
  appSecret: string
  accessToken: string
}

/**
 * Makes a signed call to an aliexpress.ds.* method via the /sync gateway.
 * Throws AliExpressApiError on any error_response, so callers (and
 * withCache's retry/fallback logic) get a single clear failure mode instead
 * of having to check response shape themselves.
 */
export async function callAliExpressSync<T extends object>(
  method: string,
  businessParams: Record<string, string>,
  { appKey, appSecret, accessToken }: CallOptions
): Promise<T> {
  const params: Record<string, string> = {
    method,
    app_key: appKey,
    session: accessToken,
    timestamp: getTopTimestamp(),
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    ...businessParams,
  }

  const sign = generateSignature(API_PATH, params, appSecret, 'hmac-sha256')
  const body = new URLSearchParams({ ...params, sign })

  const res = await fetch(SYNC_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const json = (await res.json()) as T | AliExpressErrorResponse

  if ('error_response' in json) {
    const { code, msg, request_id } = json.error_response
    throw new AliExpressApiError(code, msg, request_id)
  }

  return json as T
}

/** Reads and validates the three required AliExpress env vars once. */
export function getAliExpressCredentials(): CallOptions {
  const appKey = process.env.ALIEXPRESS_APP_KEY
  const appSecret = process.env.ALIEXPRESS_APP_SECRET
  const accessToken = process.env.ALIEXPRESS_ACCESS_TOKEN

  if (!appKey || !appSecret || !accessToken) {
    throw new Error(
      'Missing ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET, or ALIEXPRESS_ACCESS_TOKEN in .env. ' +
        'Note: ALIEXPRESS_ACCESS_TOKEN expires ~30 days after issuance — see lib/aliexpress/README.md ' +
        'for the known gap around automatic token refresh.'
    )
  }

  return { appKey, appSecret, accessToken }
}


interface AppCredentials {
  appKey: string
  appSecret: string
}

const TOP_ENDPOINT = 'https://eco.taobao.com/router/rest'

/**
 * Calls a classic AliExpress/TOP category API. Category endpoints are public,
 * so an access token is not required.
 */
export async function callAliExpressTop<T extends object>(
  method: string,
  businessParams: Record<string, string>,
  { appKey, appSecret }: AppCredentials,
): Promise<T> {
  const params: Record<string, string> = {
    method,
    app_key: appKey,
    timestamp: getTopTimestamp(),
    format: 'json',
    v: '2.0',
    sign_method: 'hmac-sha256',
    ...businessParams,
  }

  const sign = generateSignature('', params, appSecret, 'hmac-sha256')
  const body = new URLSearchParams({ ...params, sign })

  const res = await fetch(TOP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const json = (await res.json()) as T | AliExpressErrorResponse

  if ('error_response' in json) {
    const { code, msg, request_id } = json.error_response
    throw new AliExpressApiError(code, msg, request_id)
  }

  return json as T
}

export function getAliExpressAppCredentials(): AppCredentials {
  const appKey = process.env.ALIEXPRESS_APP_KEY
  const appSecret = process.env.ALIEXPRESS_APP_SECRET

  if (!appKey || !appSecret) {
    throw new Error('Missing ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET in environment.')
  }

  return { appKey, appSecret }
}
