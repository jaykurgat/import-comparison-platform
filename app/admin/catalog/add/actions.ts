'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin/auth'
import { getAliExpressProduct } from '@/lib/aliexpress/product'
import { calculateImportOnlyPrice } from '@/lib/landedCost/calculateImportOnlyPrice'

export type AddImportState = {
  ok: boolean
  message: string
  productId?: string
  title?: string
  variants?: number
  published?: number
  unavailable?: number
  errors?: string[]
}

function extractProductId(value: string): string | null {
  const input = value.trim()
  if (/^\d+$/.test(input)) return input
  const match = input.match(/\/item\/(\d+)/i) ?? input.match(/(?:product|item)[=/](\d+)/i)
  return match?.[1] ?? null
}

export async function addAliExpressProduct(
  _previous: AddImportState,
  formData: FormData,
): Promise<AddImportState> {
  await requireAdmin()

  const raw = String(formData.get('product') ?? '').trim()
  const productId = extractProductId(raw)

  if (!productId) {
    return {
      ok: false,
      message: 'Enter a valid AliExpress product URL or numeric product ID.',
    }
  }

  try {
    const product = await getAliExpressProduct(productId, 'KE')
    let published = 0
    let unavailable = 0
    const errors: string[] = []

    for (const sku of product.data.skus) {
      try {
        const price = await calculateImportOnlyPrice(productId, sku.skuId)
        const record = await prisma.aliExpressSKU.findUnique({
          where: { productId_skuId: { productId, skuId: sku.skuId } },
        })

        if (!record) {
          errors.push(sku.skuId + ': product variant was fetched but not persisted.')
          continue
        }

        const canPublish =
          !price.isStale &&
          Boolean(record.title.trim()) &&
          record.imageUrls.length > 0

        await prisma.aliExpressSKU.update({
          where: { id: record.id },
          data: { isPublished: canPublish },
        })

        if (canPublish) published++
        else unavailable++
      } catch (error) {
        unavailable++
        errors.push(
          sku.skuId + ': ' + (error instanceof Error ? error.message : String(error)),
        )
      }
    }

    revalidatePath('/admin/catalog')
    revalidatePath('/products')
    revalidatePath('/')

    return {
      ok: published > 0,
      message:
        published > 0
          ? 'Product imported and published with available merchandising data.'
          : 'Product was fetched, but no variant was ready for publication.',
      productId,
      title: product.data.title,
      variants: product.data.skus.length,
      published,
      unavailable,
      errors: errors.length ? errors : undefined,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to import the AliExpress product.',
    }
  }
}
