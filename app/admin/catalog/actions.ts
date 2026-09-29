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

  revalidatePath('/products')
  revalidatePath('/')
}

export async function bulkToggleImportPublished(ids: string[], published: boolean) {
  await requireAdmin()

  const uniqueIds = [...new Set(ids)].filter(Boolean)
  if (uniqueIds.length === 0) throw new Error('Select at least one supplier SKU.')

  const skus = await prisma.aliExpressSKU.findMany({
    where: { id: { in: uniqueIds } },
    include: { importListingPrice: true },
  })

  if (skus.length !== uniqueIds.length) {
    throw new Error('One or more selected supplier SKUs could not be found.')
  }

  if (published) {
    const blocked = skus.filter((sku) => !canPublishSupplierSku({
      hasSellPrice: Boolean(sku.importListingPrice),
      priceIsStale: sku.importListingPrice?.isStale ?? true,
      hasTitle: Boolean(sku.title.trim()),
      hasImage: sku.imageUrls.length > 0,
    }))

    if (blocked.length > 0) {
      throw new Error(
        `${blocked.length} selected SKU${blocked.length === 1 ? '' : 's'} cannot be published because they are missing a current price, title, or image.`,
      )
    }
  }

  await prisma.aliExpressSKU.updateMany({
    where: { id: { in: uniqueIds } },
    data: { isPublished: published },
  })

  revalidatePath('/products')
  revalidatePath('/')
  return { updated: uniqueIds.length }
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

export async function getManualSupplierPriceUpdateTotal(beforeIso: string) {
  await requireAdmin()

  const before = new Date(beforeIso)
  if (!Number.isFinite(before.getTime())) {
    throw new Error('Invalid batch start time.')
  }

  const products = await prisma.aliExpressSKU.groupBy({
    by: ['productId'],
    where: {
      isPublished: true,
      OR: [
        { lastSupplierSyncAt: null },
        { lastSupplierSyncAt: { lt: before } },
      ],
    },
  })

  return products.length
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

export async function updateImportSkuCategory(id: string, categoryId: string | null) {
  await requireAdmin()
  const sku = await prisma.aliExpressSKU.findUnique({ where: { id }, select: { id: true } })
  if (!sku) throw new Error('Supplier SKU not found.')
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } })
    if (!category) throw new Error('Selected category was not found.')
  }
  await prisma.aliExpressSKU.update({ where: { id }, data: { categoryId } })
  revalidatePath('/admin/catalog')
  revalidatePath('/products')
}
