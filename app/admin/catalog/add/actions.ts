'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin/auth'
import { getAliExpressProduct } from '@/lib/aliexpress/product'
import { calculateImportOnlyPrice } from '@/lib/landedCost/calculateImportOnlyPrice'

export type CategoryOption = {
  id: string
  name: string
  parentName: string | null
  isRoot: boolean
}

export type CategoryReview = {
  sourceCategoryId: string | null
  sourceCategoryName: string | null
  title: string
  reason: string
  categories: CategoryOption[]
}

export type AddImportState = {
  ok: boolean
  message: string
  productId?: string
  title?: string
  variants?: number
  published?: number
  unavailable?: number
  errors?: string[]
  categoryReview?: CategoryReview
}

function extractProductId(value: string): string | null {
  const input = value.trim()
  if (/^\d+$/.test(input)) return input
  const match = input.match(/\/item\/(\d+)/i) ?? input.match(/(?:product|item)[=\/]([0-9]+)/i)
  return match?.[1] ?? null
}

async function getCategoryOptions(): Promise<CategoryOption[]> {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
    include: { parent: { select: { name: true } } },
  })

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    parentName: category.parent?.name ?? null,
    isRoot: category.parentId === null,
  }))
}

async function buildCategoryReview(
  productId: string,
  title: string,
  reason: string,
): Promise<CategoryReview> {
  const [sourceCategory, categories] = await Promise.all([
    prisma.aliExpressCategory.findUnique({
      where: { categoryId: (await prisma.aliExpressSKU.findFirst({
        where: { productId },
        select: { rawCategoryId: true },
      }))?.rawCategoryId ?? '' },
      select: { categoryId: true, name: true },
    }),
    getCategoryOptions(),
  ])

  const rawCategoryId = sourceCategory?.categoryId ?? (
    await prisma.aliExpressSKU.findFirst({
      where: { productId },
      select: { rawCategoryId: true },
    })
  )?.rawCategoryId ?? null

  return {
    sourceCategoryId: rawCategoryId,
    sourceCategoryName: sourceCategory?.name ?? null,
    title,
    reason,
    categories,
  }
}

async function completeImport(
  productId: string,
  productTitle: string,
  skus: Array<{ skuId: string }>,
): Promise<{
  published: number
  unavailable: number
  errors: string[]
}> {
  let published = 0
  let unavailable = 0
  const errors: string[] = []

  for (const sku of skus) {
    try {
      const price = await calculateImportOnlyPrice(productId, sku.skuId)
      const record = await prisma.aliExpressSKU.findUnique({
        where: { productId_skuId: { productId, skuId: sku.skuId } },
      })

      if (!record) {
        errors.push(sku.skuId + ': product variant was fetched but not persisted.')
        continue
      }

      // This is the final category gate. A SKU can never become a published
      // storefront product without a canonical KijijiCart category.
      const canPublish =
        Boolean(record.categoryId) &&
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

  return { published, unavailable, errors }
}

async function assignCategoryAndImport(
  productId: string,
  categoryId: string,
  sourceCategoryId: string | null,
  sourceCategoryName: string | null,
  productTitle: string,
  skus: Array<{ skuId: string }>,
): Promise<AddImportState> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, parentId: true },
  })

  if (!category) {
    return {
      ok: false,
      message: 'The selected category no longer exists. Choose a category again.',
      productId,
      title: productTitle,
    }
  }

  if (!category.parentId) {
    return {
      ok: false,
      message: 'Choose a subcategory, not a top-level department.',
      productId,
      title: productTitle,
      categoryReview: await buildCategoryReview(
        productId,
        productTitle,
        'A product needs a specific subcategory before import can be completed.',
      ),
    }
  }

  if (sourceCategoryId) {
    await prisma.categoryMapping.upsert({
      where: {
        source_sourceCategoryId: {
          source: 'ALIEXPRESS',
          sourceCategoryId,
        },
      },
      create: {
        source: 'ALIEXPRESS',
        sourceCategoryId,
        sourceCategoryName,
        categoryId: category.id,
      },
      update: {
        categoryId: category.id,
        sourceCategoryName,
      },
    })
  }

  await prisma.aliExpressSKU.updateMany({
    where: { productId },
    data: { categoryId: category.id },
  })

  const result = await completeImport(productId, productTitle, skus)

  revalidatePath('/admin/catalog')
  revalidatePath('/products')
  revalidatePath('/')

  return {
    ok: result.published > 0,
    message:
      result.published > 0
        ? `Product imported under ${category.parentId ? category.name : category.name}.`
        : 'Category was assigned, but no variant was ready for publication.',
    productId,
    title: productTitle,
    variants: skus.length,
    published: result.published,
    unavailable: result.unavailable,
    errors: result.errors.length ? result.errors : undefined,
  }
}

export async function addAliExpressProduct(
  _previous: AddImportState,
  formData: FormData,
): Promise<AddImportState> {
  await requireAdmin()

  const decision = String(formData.get('decision') ?? '')
  const reviewProductId = String(formData.get('reviewProductId') ?? '').trim()

  try {
    if (decision === 'use-existing' || decision === 'create-new') {
      if (!reviewProductId) {
        return { ok: false, message: 'The category review session expired. Enter the product again.' }
      }

      const product = await getAliExpressProduct(reviewProductId, 'KE')
      const sourceCategory = await prisma.aliExpressCategory.findUnique({
        where: { categoryId: product.data.rawCategoryId },
        select: { categoryId: true, name: true },
      })

      let categoryId = String(formData.get('categoryId') ?? '').trim()

      if (decision === 'create-new') {
        const newCategoryName = String(formData.get('newCategoryName') ?? '').trim()
        const parentCategoryId = String(formData.get('parentCategoryId') ?? '').trim()

        if (!newCategoryName || !parentCategoryId) {
          return {
            ok: false,
            message: 'Enter the new category name and choose its parent department.',
            productId: reviewProductId,
            title: product.data.title,
            categoryReview: await buildCategoryReview(
              reviewProductId,
              product.data.title,
              'Create a specific subcategory only when the existing categories do not fit the products shopping intent.',
            ),
          }
        }

        const parent = await prisma.category.findUnique({
          where: { id: parentCategoryId },
          select: { id: true, name: true, parentId: true },
        })

        if (!parent || parent.parentId !== null) {
          return {
            ok: false,
            message: 'Choose an existing top-level department as the parent of the new category.',
            productId: reviewProductId,
            title: product.data.title,
            categoryReview: await buildCategoryReview(
              reviewProductId,
              product.data.title,
              'New categories should be specific subcategories under an existing department.',
            ),
          }
        }

        const duplicate = await prisma.category.findFirst({
          where: {
            parentId: parent.id,
            name: newCategoryName,
          },
          select: { id: true },
        })

        if (duplicate) {
          return {
            ok: false,
            message: `“${newCategoryName}” already exists under ${parent.name}. Select that existing category instead.`,
            productId: reviewProductId,
            title: product.data.title,
            categoryReview: await buildCategoryReview(
              reviewProductId,
              product.data.title,
              'The category name already exists under the selected department.',
            ),
          }
        }

        const created = await prisma.category.create({
          data: {
            name: newCategoryName,
            parentId: parent.id,
          },
          select: { id: true },
        })

        categoryId = created.id
      }

      if (!categoryId) {
        return {
          ok: false,
          message: 'Select the category that should contain this product.',
          productId: reviewProductId,
          title: product.data.title,
          categoryReview: await buildCategoryReview(
            reviewProductId,
            product.data.title,
            'Choose an existing subcategory or create a new one before completing the import.',
          ),
        }
      }

      return assignCategoryAndImport(
        reviewProductId,
        categoryId,
        sourceCategory?.categoryId ?? product.data.rawCategoryId ?? null,
        sourceCategory?.name ?? null,
        product.data.title,
        product.data.skus.map((sku) => ({ skuId: sku.skuId })),
      )
    }

    const raw = String(formData.get('product') ?? '').trim()
    const productId = extractProductId(raw)

    if (!productId) {
      return {
        ok: false,
        message: 'Enter a valid AliExpress product URL or numeric product ID.',
      }
    }

    const product = await getAliExpressProduct(productId, 'KE')

    const persisted = await prisma.aliExpressSKU.findMany({
      where: { productId },
      select: { categoryId: true },
    })

    const categoryIds = [...new Set(persisted.map((sku) => sku.categoryId).filter(Boolean))]

    // Import cannot complete while any SKU is uncategorized or the product has
    // inconsistent category assignments.
    if (
      persisted.length === 0 ||
      persisted.some((sku) => !sku.categoryId) ||
      categoryIds.length !== 1
    ) {
      const reason =
        categoryIds.length > 1
          ? 'The product variants resolved to different categories. Choose one KijijiCart subcategory for the whole product.'
          : 'We could not confidently place this product into an existing KijijiCart category.'

      return {
        ok: false,
        message: 'Category required before this product can be imported.',
        productId,
        title: product.data.title,
        variants: product.data.skus.length,
        published: 0,
        unavailable: product.data.skus.length,
        categoryReview: await buildCategoryReview(productId, product.data.title, reason),
      }
    }

    const result = await completeImport(
      productId,
      product.data.title,
      product.data.skus.map((sku) => ({ skuId: sku.skuId })),
    )

    revalidatePath('/admin/catalog')
    revalidatePath('/products')
    revalidatePath('/')

    return {
      ok: result.published > 0,
      message:
        result.published > 0
          ? 'Product imported and published with available merchandising data.'
          : 'Product was categorized, but no variant was ready for publication.',
      productId,
      title: product.data.title,
      variants: product.data.skus.length,
      published: result.published,
      unavailable: result.unavailable,
      errors: result.errors.length ? result.errors : undefined,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unable to import the AliExpress product.',
    }
  }
}
