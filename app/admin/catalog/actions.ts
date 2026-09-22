'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { syncAliExpressCatalog } from '@/lib/aliexpress/catalogSync'
import { repriceImportCatalog } from '@/lib/pricing/repriceImportCatalog'

export async function toggleImportPublished(id: string, published: boolean) {
  await prisma.aliExpressSKU.update({
    where: { id },
    data: { isPublished: published },
  })

  revalidatePath('/admin/catalog')
  revalidatePath('/products')
}

export async function runCatalogSync() {
  const result = await syncAliExpressCatalog({ limit: 20, candidatesPerLocal: 5 })
  revalidatePath('/admin/catalog')
  revalidatePath('/products')
  return result
}

export async function runCatalogReprice() {
  const result = await repriceImportCatalog({ limit: 250 })
  revalidatePath('/admin/catalog')
  revalidatePath('/products')
  return result
}
