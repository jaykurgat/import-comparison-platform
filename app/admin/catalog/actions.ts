'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'
import { syncAliExpressCatalog } from '@/lib/aliexpress/catalogSync'
import { repriceImportCatalog } from '@/lib/pricing/repriceImportCatalog'
import { canPublishSupplierSku } from '@/lib/admin/catalogPublishability'
import { synchronizeAliExpressSupplierCatalog } from '@/lib/aliexpress/supplierSynchronizer'

export async function toggleImportPublished(id: string, published: boolean) {
  await requireAdmin()
  const sku = await prisma.aliExpressSKU.findUnique({
    where: { id },
    include: { importListingPrice: true },
  })
  if (!sku) throw new Error('Supplier SKU not found.')
  if (published && !canPublishSupplierSku({
      hasSellPrice: Boolean(sku.importListingPrice),
      priceIsStale: sku.importListingPrice?.isStale ?? true,
      hasTitle: Boolean(sku.title.trim()),
      hasImage: sku.imageUrls.length > 0,
    })) {
    throw new Error('Supplier SKU must have a current sell price, title, and image before publishing.')
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


export async function runManualSupplierPriceUpdate(beforeIso: string) {
  await requireAdmin()

  const before = new Date(beforeIso)
  if (!Number.isFinite(before.getTime())) {
    throw new Error('Invalid batch start time.')
  }

  const result = await synchronizeAliExpressSupplierCatalog({
    productLimit: 10,
    concurrency: 2,
    before,
  })

  if (result.repricedSkus > 0 || result.changedSkus > 0) {
    revalidatePath('/admin/catalog')
    revalidatePath('/products')
    revalidatePath('/')
  }

  return result
}
