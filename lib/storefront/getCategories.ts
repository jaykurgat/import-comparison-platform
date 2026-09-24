import { prisma } from '../prisma'

export interface StorefrontCategory {
  id: string
  name: string
  productCount: number
  source: 'CANONICAL'
  level: number
  imageUrl: string | null
}

interface CategoryRow {
  id: string
  name: string
  parentId: string | null
}

function getDescendantIds(categories: CategoryRow[], rootId: string): string[] {
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

    for (const childId of children.get(current) ?? []) {
      stack.push(childId)
    }
  }

  return result
}

export async function getStorefrontCategories(limit = 24): Promise<StorefrontCategory[]> {
  const [categories, localProducts, importProducts] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, parentId: true },
    }),
    prisma.localSKU.findMany({
      where: { categoryId: { not: null } },
      select: { categoryId: true, imageUrls: true },
    }),
    prisma.aliExpressSKU.findMany({
      where: {
        categoryId: { not: null },
        isPublished: true,
        importListingPrice: { isStale: false },
      },
      select: { categoryId: true, imageUrls: true },
    }),
  ])

  const roots = categories.filter((category) => category.parentId === null)
  const childrenByParent = new Map<string, CategoryRow[]>()

  for (const category of categories) {
    if (!category.parentId) continue
    const children = childrenByParent.get(category.parentId) ?? []
    children.push(category)
    childrenByParent.set(category.parentId, children)
  }

  const counts = new Map<string, number>()
  const images = new Map<string, string>()

  function addProduct(categoryId: string | null, imageUrls: string[]) {
    if (!categoryId) return

    const categoryById = new Map(categories.map((category) => [category.id, category]))
    let current = categoryById.get(categoryId)
    if (!current) return

    const visited = new Set<string>()
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      if (current.parentId === null) {
        counts.set(current.id, (counts.get(current.id) ?? 0) + 1)
        const image = imageUrls.find(Boolean)
        if (image && !images.has(current.id)) images.set(current.id, image)
        return
      }
      current = categoryById.get(current.parentId)
    }
  }

  for (const product of localProducts) addProduct(product.categoryId, product.imageUrls)
  for (const product of importProducts) addProduct(product.categoryId, product.imageUrls)

  return roots
    .filter((category) => (counts.get(category.id) ?? 0) > 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      productCount: counts.get(category.id) ?? 0,
      source: 'CANONICAL' as const,
      level: 1,
      imageUrl: images.get(category.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit)
}

export interface StorefrontCategoryFilterScope {
  categoryIds: string[]
}

export async function getStorefrontCategoryFilterScope(categoryKey: string): Promise<StorefrontCategoryFilterScope | null> {
  const normalized = categoryKey.trim()
  if (!normalized) return null

  const categories = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true },
  })

  // New storefront URLs use canonical category ids directly.
  if (!normalized.startsWith('local:') && !normalized.startsWith('ae:')) {
    const root = categories.find((category) => category.id === normalized)
    if (!root) return null
    return { categoryIds: getDescendantIds(categories, root.id) }
  }

  // Keep old local-category URLs working after the catalogue becomes unified.
  if (normalized.startsWith('local:')) {
    const rootId = normalized.slice(6)
    const root = categories.find((category) => category.id === rootId)
    if (!root) return null
    return { categoryIds: getDescendantIds(categories, root.id) }
  }

  // Old AliExpress category URLs are translated through the canonical category
  // assigned to the published supplier products in that source category.
  const externalRootId = normalized.slice(3)
  if (!externalRootId) return null

  const aliExpressCategories = await prisma.aliExpressCategory.findMany({
    select: { id: true, categoryId: true, parentId: true },
  })
  const externalRoot = aliExpressCategories.find((category) => category.categoryId === externalRootId)
  if (!externalRoot) return null

  const aliExpressIds = getDescendantIds(aliExpressCategories, externalRoot.id)
  const mapped = await prisma.aliExpressSKU.findMany({
    where: {
      aliExpressCategoryId: { in: aliExpressIds },
      categoryId: { not: null },
    },
    distinct: ['categoryId'],
    select: { categoryId: true },
  })

  const categoryIds = mapped.flatMap((row) => row.categoryId ? [row.categoryId] : [])
  return categoryIds.length > 0 ? { categoryIds } : null
}
