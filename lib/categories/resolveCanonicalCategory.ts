import { prisma } from '../prisma'
import {
  classifyCategory,
  normalizeCategoryText,
  type CategoryClassification,
} from './taxonomy'

export interface ResolveCanonicalCategoryInput {
  source?: 'ALIEXPRESS' | 'JUMIA'
  sourceCategoryId?: string | null
  sourceCategoryName?: string | null
  title: string
  specs?: Record<string, unknown> | null
}

export interface ResolvedCategory {
  categoryId: string
  classification: CategoryClassification
}

async function ensureCategoryPath(path: [string, string]): Promise<string> {
  let parentId: string | null = null

  for (const name of path) {
    const existing: { id: string } | null = await prisma.category.findFirst({
      where: { name, parentId },
      select: { id: true },
    })

    if (existing) {
      parentId = existing.id
      continue
    }

    const created: { id: string } = await prisma.category.create({
      data: { name, parentId },
      select: { id: true },
    })
    parentId = created.id
  }

  return parentId!
}

/**
 * Resolves products into a controlled canonical taxonomy.
 *
 * Existing source mappings are authoritative. New classifications require a
 * clear category signal; ambiguous products remain uncategorized so matching
 * and related-product discovery never have to guess.
 */
export async function resolveCanonicalCategory(
  input: ResolveCanonicalCategoryInput,
): Promise<ResolvedCategory | null> {
  const sourceCategoryId = input.sourceCategoryId?.trim() || null

  if (input.source && sourceCategoryId) {
    const existingMapping = await prisma.categoryMapping.findUnique({
      where: {
        source_sourceCategoryId: {
          source: input.source,
          sourceCategoryId,
        },
      },
      include: { category: true },
    })

    if (existingMapping) {
      const classification = classifyCategory({
        title: input.title,
        sourceCategoryName: existingMapping.sourceCategoryName,
        specs: input.specs,
      })

      return {
        categoryId: existingMapping.categoryId,
        classification: classification ?? {
          path: [existingMapping.category.name, existingMapping.category.name],
          score: 0,
          confidence: 1,
          matchedTerms: ['existing-source-mapping'],
        },
      }
    }
  }

  const classification = classifyCategory(input)
  if (!classification) return null

  const categoryId = await ensureCategoryPath(classification.path)

  if (input.source && sourceCategoryId) {
    await prisma.categoryMapping.upsert({
      where: {
        source_sourceCategoryId: {
          source: input.source,
          sourceCategoryId,
        },
      },
      create: {
        source: input.source,
        sourceCategoryId,
        sourceCategoryName: input.sourceCategoryName?.trim() || null,
        categoryId,
      },
      update: {},
    })
  }

  return { categoryId, classification }
}

export async function categorizeExistingCatalog(): Promise<{
  localCategorized: number
  importCategorized: number
}> {
  const [locals, imports] = await Promise.all([
    prisma.localSKU.findMany({
      where: { categoryId: null },
      select: { id: true, title: true, specs: true },
    }),
    prisma.aliExpressSKU.findMany({
      where: { categoryId: null },
      select: {
        id: true,
        title: true,
        rawCategoryId: true,
        specs: true,
        aliExpressCategory: { select: { name: true } },
      },
    }),
  ])

  let localCategorized = 0
  let importCategorized = 0

  for (const local of locals) {
    const resolved = await resolveCanonicalCategory({
      title: local.title,
      specs: (local.specs as Record<string, unknown> | null) ?? null,
    })

    if (resolved) {
      await prisma.localSKU.update({
        where: { id: local.id },
        data: { categoryId: resolved.categoryId },
      })
      localCategorized++
    }
  }

  for (const sku of imports) {
    const resolved = await resolveCanonicalCategory({
      source: 'ALIEXPRESS',
      sourceCategoryId: sku.rawCategoryId,
      sourceCategoryName: sku.aliExpressCategory?.name ?? null,
      title: sku.title,
      specs: (sku.specs as Record<string, unknown> | null) ?? null,
    })

    if (resolved) {
      await prisma.aliExpressSKU.update({
        where: { id: sku.id },
        data: { categoryId: resolved.categoryId },
      })
      importCategorized++
    }
  }

  return { localCategorized, importCategorized }
}

export function makeLocalCategoryKey(categoryName: string): string {
  return 'name:' + normalizeCategoryText(categoryName)
}
