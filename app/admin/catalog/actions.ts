'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { syncAliExpressCatalog } from '@/lib/aliexpress/catalogSync'
import { repriceImportCatalog } from '@/lib/pricing/repriceImportCatalog'
import { canPublishSupplierSku } from '@/lib/admin/catalogPublishability'

export async function toggleImportPublished(id: string, published: boolean) {
  await requireAdmin()
  const sku = await prisma.aliExpressSKU.findUnique({
    where: { id },
    include: { importListingPrice: true },
  })
  if (!sku) throw new Error('Supplier SKU not found.')
  if (published && !canPublishSupplierSku({ stock: sku.availableStock, hasSellPrice: Boolean(sku.importListingPrice), priceIsStale: sku.importListingPrice?.isStale ?? true })) {
    throw new Error('Supplier SKU must have stock and a current sell price before publishing.')
  }

  await prisma.aliExpressSKU.update({
    where: { id },
    data: { isPublished: published },
  })

  revalidatePath('/admin/catalog')
  revalidatePath('/products')
}

export async function runCatalogSync() {
  await requireAdmin()
  const result = await syncAliExpressCatalog({ limit: 20, candidatesPerLocal: 5 })
  revalidatePath('/admin/catalog')
  revalidatePath('/products')
  return result
}

export async function runCatalogReprice() {
  await requireAdmin()
  const result = await repriceImportCatalog({ limit: 250 })
  revalidatePath('/admin/catalog')
  revalidatePath('/products')
  return result
}
