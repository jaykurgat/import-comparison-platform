import { prisma } from '../prisma'

export type StorefrontCategorySource = 'ALIEXPRESS' | 'LOCAL'

export interface StorefrontCategory {
  id: string
  name: string
  productCount: number
  source: StorefrontCategorySource
  level: number
}

interface CategoryRow {
  id: string
  name: string
  parentId: string | null
  level?: number | null
}

function buildRootMap<T extends CategoryRow>(categories: T[]): Map<string, T> {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const roots = new Map<string, T>()

  for (const category of categories) {
    let current = category
    const seen = new Set<string>()

    while (current.parentId && !seen.has(current.id)) {
      seen.add(current.id)
      const parent = byId.get(current.parentId)
      if (!parent) break
      current = parent
    }

    roots.set(category.id, current)
  }

  return roots
}

export async function getStorefrontCategories(limit = 24): Promise<StorefrontCategory[]> {
  const [localCategories, localProducts, aliExpressCategories, aliExpressProducts, allLocalCategories] =
    await Promise.all([
      prisma.category.findMany({
        where: { parentId: null },
        select: { id: true, name: true, parentId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.localSKU.findMany({
        select: {
          categoryId: true,
          title: true,
          currentPrice: true,
          currency: true,
        },
      }),
      prisma.aliExpressCategory.findMany({
        select: { id: true, categoryId: true, name: true, parentId: true, level: true },
        orderBy: { name: 'asc' },
      }),
      prisma.aliExpressSKU.findMany({
        where: {
          isPublished: true,
          importListingPrice: { isStale: false },
        },
        select: { aliExpressCategoryId: true },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, parentId: true },
      }),
    ])

  const localRootById = buildRootMap(allLocalCategories)
  const aliExpressRootById = buildRootMap(aliExpressCategories)

  const localCounts = new Map<string, number>()
  for (const product of localProducts) {
    if (
      !product.categoryId
      || !product.title.trim()
      || !Number.isFinite(Number(product.currentPrice))
      || Number(product.currentPrice) <= 0
      || !product.currency.trim()
    ) continue

    const root = localRootById.get(product.categoryId)
    if (!root) continue
    localCounts.set(root.id, (localCounts.get(root.id) ?? 0) + 1)
  }

  const aliExpressCounts = new Map<string, number>()
  for (const product of aliExpressProducts) {
    if (!product.aliExpressCategoryId) continue
    const root = aliExpressRootById.get(product.aliExpressCategoryId)
    if (!root) continue
    aliExpressCounts.set(root.id, (aliExpressCounts.get(root.id) ?? 0) + 1)
  }

  const categories: StorefrontCategory[] = [
    ...localCategories
      .filter((category) => (localCounts.get(category.id) ?? 0) > 0)
      .map((category) => ({
        id: `local:${category.id}`,
        name: category.name,
        productCount: localCounts.get(category.id) ?? 0,
        source: 'LOCAL' as const,
        level: 1,
      })),
    ...aliExpressCategories
      .filter((category) => category.parentId === null && (aliExpressCounts.get(category.id) ?? 0) > 0)
      .map((category) => ({
        id: `ae:${category.categoryId}`,
        name: category.name,
        productCount: aliExpressCounts.get(category.id) ?? 0,
        source: 'ALIEXPRESS' as const,
        level: category.level ?? 1,
      })),
  ]

  return categories
    .sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source))
    .slice(0, limit)
}

export interface StorefrontCategoryFilterScope {
  localCategoryIds: string[]
  aliExpressCategoryIds: string[]
  source: StorefrontCategorySource
}

export async function getStorefrontCategoryFilterScope(categoryKey: string): Promise<StorefrontCategoryFilterScope | null> {
  const normalized = categoryKey.trim()
  if (!normalized) return null

  if (normalized.startsWith('ae:')) {
    const externalRootId = normalized.slice(3)
    if (!externalRootId) return null

    const categories = await prisma.aliExpressCategory.findMany({
      select: { id: true, categoryId: true, parentId: true },
    })
    const root = categories.find((category) => category.categoryId === externalRootId)
    if (!root) return null

    return {
      localCategoryIds: [],
      aliExpressCategoryIds: getDescendantIds(categories, root.id),
      source: 'ALIEXPRESS',
    }
  }

  if (normalized.startsWith('local:')) {
    const rootId = normalized.slice(6)
    if (!rootId) return null

    const categories = await prisma.category.findMany({
      select: { id: true, parentId: true },
    })
    const root = categories.find((category) => category.id === rootId)
    if (!root) return null

    return {
      localCategoryIds: getDescendantIds(categories, root.id),
      aliExpressCategoryIds: [],
      source: 'LOCAL',
    }
  }

  return {
    localCategoryIds: [normalized],
    aliExpressCategoryIds: [],
    source: 'LOCAL',
  }
}

function getDescendantIds(categories: Array<{ id: string; parentId: string | null }>, rootId: string): string[] {
  const children = new Map<string, string[]>()

  for (const category of categories) {
    if (!category.parentId) continue
    const list = children.get(category.parentId) ?? []
    list.push(category.id)
    children.set(category.parentId, list)
  }

  const result: string[] = []
  const stack = [rootId]
  const visited = new Set<string>()

  while (stack.length > 0) {
    const current = stack.pop()!
    if (visited.has(current)) continue
    visited.add(current)
    result.push(current)
    for (const childId of children.get(current) ?? []) stack.push(childId)
  }

  return result
}
