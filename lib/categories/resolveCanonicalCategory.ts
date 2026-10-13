import { prisma } from '../prisma'
import { getStoredCategoryPath } from '../aliexpress/categories'
import { normalizeCategoryText, type CategoryClassification } from './taxonomy'

export interface ResolveCanonicalCategoryInput {
  source?: 'ALIEXPRESS' | 'JUMIA'
  sourceCategoryId?: string | null
  sourceCategoryName?: string | null
  title: string
  specs?: Record<string, unknown> | null
}
export interface ResolvedCategory { categoryId: string; classification: CategoryClassification }

async function getSourcePath(input: ResolveCanonicalCategoryInput): Promise<string[]> {
  const sourceId = input.sourceCategoryId?.trim()
  if (input.source === 'ALIEXPRESS' && sourceId) {
    const source = await prisma.aliExpressCategory.findUnique({ where: { categoryId: sourceId }, select: { id: true } })
    if (source) {
      const nodes = await getStoredCategoryPath(source.id)
      const names = nodes.map((node) => node.name.trim()).filter(Boolean)
      if (names.length) return names
    }
  }
  const label = input.sourceCategoryName?.trim()
  if (label) return label.split(/\s*(?:>|\/|»|→|\|)\s*/).map((part) => part.trim()).filter(Boolean)
  return []
}

async function ensureCategoryPath(path: string[]): Promise<string> {
  let parentId: string | null = null
  let leafId = ''
  for (const rawName of path) {
    const name = rawName.trim()
    if (!name) continue
    const existing: { id: string } | null = await prisma.category.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, parentId },
      select: { id: true },
    })
    if (existing) {
      parentId = existing.id
      leafId = existing.id
    } else {
      const lastSibling = await prisma.category.findFirst({ where: { parentId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
      const created: { id: string } = await prisma.category.create({ data: { name, parentId, sortOrder: (lastSibling?.sortOrder ?? -10) + 10 }, select: { id: true } })
      parentId = created.id
      leafId = created.id
    }
  }
  if (!leafId) throw new Error('The supplier did not provide a usable category path.')
  return leafId
}

async function getCanonicalPath(categoryId: string): Promise<string[]> {
  const categories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true } })
  const byId = new Map(categories.map((item) => [item.id, item]))
  const result: string[] = []
  const seen = new Set<string>()
  let current = byId.get(categoryId)
  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    result.unshift(current.name)
    current = current.parentId ? byId.get(current.parentId) : undefined
  }
  return result
}

async function toResolved(categoryId: string): Promise<ResolvedCategory> {
  const path = await getCanonicalPath(categoryId)
  const leaf = path[path.length - 1] ?? 'Category'
  const parent = path[path.length - 2] ?? leaf
  return { categoryId, classification: { path: [parent, leaf], score: 100, confidence: 1, matchedTerms: ['canonical-category-path'] } }
}

/**
 * The supplier's complete category path is the first-import source of truth.
 * Confirmed source ID mappings become authoritative for all future imports.
 * Title-only guesses are deliberately avoided.
 */
export async function resolveCanonicalCategory(input: ResolveCanonicalCategoryInput): Promise<ResolvedCategory | null> {
  const sourceCategoryId = input.sourceCategoryId?.trim() || null
  if (input.source && sourceCategoryId) {
    const mapping = await prisma.categoryMapping.findUnique({
      where: { source_sourceCategoryId: { source: input.source, sourceCategoryId } },
      select: { categoryId: true },
    })
    if (mapping) return toResolved(mapping.categoryId)
  }

  const path = await getSourcePath(input)
  if (!path.length) return null
  const categoryId = await ensureCategoryPath(path)

  if (input.source && sourceCategoryId) {
    await prisma.categoryMapping.upsert({
      where: { source_sourceCategoryId: { source: input.source, sourceCategoryId } },
      create: { source: input.source, sourceCategoryId, sourceCategoryName: input.sourceCategoryName?.trim() || path.join(' / '), categoryId },
      update: { categoryId, sourceCategoryName: input.sourceCategoryName?.trim() || path.join(' / ') },
    })
  }
  return toResolved(categoryId)
}

export async function categorizeExistingCatalog(): Promise<{ localCategorized: number; importCategorized: number }> {
  const [locals, imports] = await Promise.all([
    prisma.localSKU.findMany({ where: { categoryId: null }, select: { id: true, title: true, specs: true } }),
    prisma.aliExpressSKU.findMany({
      where: { categoryId: null },
      select: { id: true, title: true, rawCategoryId: true, specs: true, aliExpressCategory: { select: { name: true } } },
    }),
  ])
  let localCategorized = 0
  let importCategorized = 0

  // Local listings without supplier category metadata remain for manual review.
  for (const local of locals) {
    const resolved = await resolveCanonicalCategory({ title: local.title, specs: (local.specs as Record<string, unknown> | null) ?? null })
    if (!resolved) continue
    await prisma.localSKU.update({ where: { id: local.id }, data: { categoryId: resolved.categoryId } })
    localCategorized++
  }
  for (const sku of imports) {
    const resolved = await resolveCanonicalCategory({
      source: 'ALIEXPRESS',
      sourceCategoryId: sku.rawCategoryId,
      sourceCategoryName: sku.aliExpressCategory?.name ?? null,
      title: '',
    })
    if (!resolved || !sku.rawCategoryId) continue
    const updated = await prisma.aliExpressSKU.updateMany({
      where: { rawCategoryId: sku.rawCategoryId, categoryId: { not: resolved.categoryId } },
      data: { categoryId: resolved.categoryId },
    })
    importCategorized += updated.count
  }
  return { localCategorized, importCategorized }
}

export function makeLocalCategoryKey(categoryName: string): string {
  return 'name:' + normalizeCategoryText(categoryName)
}
