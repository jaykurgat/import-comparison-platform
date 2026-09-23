interface DarajaConfig {
  baseUrl: string
  consumerKey: string
  consumerSecret: string
  shortcode: string
  passkey: string
  callbackUrl: string
}

interface DarajaTokenResponse {
  access_token: string
  expires_in: string
}

interface StkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage?: string
}

interface DarajaCallbackItem {
  Name: string
  Value?: string | number
}

interface DarajaCallback {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: { Item?: DarajaCallbackItem[] }
    }
  }
}

let cachedToken: { value: string; expiresAt: number } | null = null

export async function createDarajaStkPush(input: {
  amountKes: number
  phoneNumber: string
  accountReference: string
  transactionDesc: string
}) {
  const config = getConfig()
  const timestamp = getDarajaTimestamp()
  const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString('base64')
  const token = await getAccessToken(config)
  const phone = normalizeKenyanPhone(input.phoneNumber)

  const response = await fetch(
    `${config.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.max(1, Math.round(input.amountKes)),
        PartyA: phone,
        PartyB: config.shortcode,
        PhoneNumber: phone,
        CallBackURL: config.callbackUrl,
        AccountReference: input.accountReference.slice(0, 12),
        TransactionDesc: input.transactionDesc.slice(0, 13),
      }),
      cache: 'no-store',
    },
  )

  const body = await response.json() as StkPushResponse & { errorMessage?: string }
  if (!response.ok || body.ResponseCode !== '0' || !body.CheckoutRequestID) {
    throw new Error(body.errorMessage || body.ResponseDescription || 'Daraja STK Push failed.')
  }

  return {
    merchantRequestId: body.MerchantRequestID,
    checkoutRequestId: body.CheckoutRequestID,
    responseDescription: body.ResponseDescription,
    customerMessage: body.CustomerMessage,
  }
}

export function parseDarajaCallback(payload: DarajaCallback) {
  const callback = payload.Body?.stkCallback
  if (!callback?.CheckoutRequestID) throw new Error('Invalid Daraja callback payload.')

  const metadata = new Map(
    (callback.CallbackMetadata?.Item ?? [])
      .filter((item) => item.Name)
      .map((item) => [item.Name, item.Value]),
  )
  const amount = Number(metadata.get('Amount'))

  return {
    merchantRequestId: callback.MerchantRequestID ?? null,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode ?? -1,
    resultDescription: callback.ResultDesc ?? 'Unknown Daraja result.',
    amount: Number.isFinite(amount) ? amount : null,
    mpesaReceiptNumber: valueToString(metadata.get('MpesaReceiptNumber')),
  }
}

function getConfig(): DarajaConfig {
  const environment = process.env.DARAJA_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
  const baseUrl = environment === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'

  const config = {
    baseUrl,
    consumerKey: required('DARAJA_CONSUMER_KEY'),
    consumerSecret: required('DARAJA_CONSUMER_SECRET'),
    shortcode: required('DARAJA_SHORTCODE'),
    passkey: required('DARAJA_PASSKEY'),
    callbackUrl: required('DARAJA_CALLBACK_URL'),
  }

  if (!config.callbackUrl.startsWith('https://')) {
    throw new Error('DARAJA_CALLBACK_URL must use HTTPS.')
  }

  return config
}

async function getAccessToken(config: DarajaConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value

  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`,
  ).toString('base64')

  const response = await fetch(
    `${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${credentials}` },
      cache: 'no-store',
    },
  )

  const body = await response.json() as DarajaTokenResponse & { errorMessage?: string }
  if (!response.ok || !body.access_token) {
    throw new Error(body.errorMessage || 'Unable to obtain Daraja access token.')
  }

  const expiresIn = Number(body.expires_in)
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (Number.isFinite(expiresIn) ? expiresIn * 1000 : 3_300_000),
  }

  return body.access_token
}

function normalizeKenyanPhone(value: string): string {
  const digits = value.replace(/\\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('07') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.startsWith('01') && digits.length === 10) return `254${digits.slice(1)}`
  throw new Error('Enter a valid Kenyan mobile number.')
}

function getDarajaTimestamp(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

function valueToString(value: string | number | undefined): string | null {
  return value === undefined ? null : String(value)
}

function required(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}
