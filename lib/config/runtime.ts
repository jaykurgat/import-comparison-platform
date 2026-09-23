export interface RuntimeReadiness {
  ready: boolean
  missing: string[]
  warnings: string[]
}

const REQUIRED_RUNTIME_VARS = [
  'DATABASE_URL',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'CATALOG_SYNC_SECRET',
] as const

const SUPPLIER_VARS = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'ALIEXPRESS_APP_KEY',
  'ALIEXPRESS_APP_SECRET',
  'ALIEXPRESS_ACCESS_TOKEN',
] as const

const PAYMENT_VARS = [
  'DARAJA_CONSUMER_KEY',
  'DARAJA_CONSUMER_SECRET',
  'DARAJA_SHORTCODE',
  'DARAJA_PASSKEY',
  'DARAJA_CALLBACK_URL',
] as const

export function getRuntimeReadiness(): RuntimeReadiness {
  const missing = REQUIRED_RUNTIME_VARS.filter((name) => !process.env[name]?.trim())
  const warnings: string[] = []

  const supplierMissing = SUPPLIER_VARS.filter((name) => !process.env[name]?.trim())
  if (supplierMissing.length > 0) {
    warnings.push(`Supplier integrations are not fully configured: ${supplierMissing.join(', ')}`)
  }

  const paymentMissing = PAYMENT_VARS.filter((name) => !process.env[name]?.trim())
  if (process.env.DARAJA_ENVIRONMENT === 'production' && paymentMissing.length > 0) {
    warnings.push(`Daraja production is enabled but payment configuration is incomplete: ${paymentMissing.join(', ')}`)
  }

  if (process.env.NODE_ENV === 'production' && process.env.DARAJA_ENVIRONMENT !== 'production') {
    warnings.push('Daraja is not enabled for production payments; import checkout should remain paused.')
  }

  return {
    ready: missing.length === 0,
    missing,
    warnings,
  }
}
