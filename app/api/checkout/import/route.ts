import { NextResponse } from 'next/server'
import { createImportCheckout } from '@/lib/checkout/createImportCheckout'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await createImportCheckout({
      productId: String(body.productId ?? ''),
      skuId: String(body.skuId ?? ''),
      quantity: Number(body.quantity ?? 1),
      fullName: String(body.fullName ?? ''),
      mobileNo: String(body.mobileNo ?? ''),
      country: String(body.country ?? 'KE'),
      province: String(body.province ?? ''),
      city: String(body.city ?? ''),
      address: String(body.address ?? ''),
      address2: body.address2 ? String(body.address2) : undefined,
      zip: body.zip ? String(body.zip) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed.' },
      { status: 400 },
    )
  }
}
