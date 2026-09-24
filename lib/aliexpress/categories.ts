import { prisma } from '../prisma'
import { redis } from '../redis/client'
import { fetchWithBackoff } from '../cache/retry'
import {
  callAliExpressTop,
  getAliExpressAppCredentials,
} from './client'
import type {
  AliExpressCategoryDto,
  AliExpressCategoryListResult,
  AliExpressSingleCategoryResult,
} from './types'

const CATEGORY_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60
const MAX_CATEGORY_SEARCH_NODES = 750

export interface AliExpressCategoryNode {
  categoryId: string
  name: string
  names: Record<string, string>
  level: number | null
  isLeaf: boolean
}

export interface AliExpressCategoryPath {
  nodes: AliExpressCategoryNode[]
  leafDbId: string
}

function parseNames(raw: string | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([, value]) => typeof value === 'string' && value.trim().length > 0,
      ),
    )
  } catch {
    return {}
  }
}

function displayName(names: Record<string, string>, fallback: string): string {
  return names.en?.trim()
    || names.in?.trim()
    || names.pt?.trim()
    || names.fr?.trim()
    || names.es?.trim()
    || Object.values(names).find((value) => value.trim())?.trim()
    || fallback
}

function mapCategory(dto: AliExpressCategoryDto): AliExpressCategoryNode {
  const categoryId = String(dto.id)
  const names = parseNames(dto.names)

  return {
    categoryId,
    name: displayName(names, categoryId),
    names,
    level: typeof dto.level === 'number' ? dto.level : null,
    isLeaf: Boolean(dto.isleaf),
  }
}

async function getChildren(parentId: string): Promise<AliExpressCategoryNode[]> {
  const cacheKey = `aliexpress:category:children:${parentId}`
  const cached = await redis.get<AliExpressCategoryNode[]>(cacheKey)
  if (cached) return cached

  const response = await fetchWithBackoff(async () => {
    const result = await callAliExpressTop<AliExpressCategoryListResult>(
      'aliexpress.category.redefining.getchildrenpostcategorybyid',
      { param0: parentId },
      getAliExpressAppCredentials(),
    )

    return result
  })

  const dtos = response
    .aliexpress_category_redefining_getchildrenpostcategorybyid_response
    ?.result
    ?.aeop_post_category_list
    ?.aeop_post_category_dto ?? []

  const children = dtos.map(mapCategory)
  await redis.set(cacheKey, children, { ex: CATEGORY_CACHE_TTL_SECONDS })
  return children
}

async function getCategoryDetail(categoryId: string): Promise<AliExpressCategoryNode | null> {
  const response = await fetchWithBackoff(async () => {
    return callAliExpressTop<AliExpressSingleCategoryResult>(
      'aliexpress.category.redefining.getpostcategorybyid',
      { param0: categoryId },
      getAliExpressAppCredentials(),
    )
  })

  const dto = response
    .aliexpress_category_redefining_getpostcategorybyid_response
    ?.result
    ?.aeop_post_category_list
    ?.aeop_post_category_dto?.[0]

  return dto ? mapCategory(dto) : null
}

async function findPathToCategory(
  parentId: string,
  targetId: string,
  targetLevel: number | null,
  trail: AliExpressCategoryNode[],
  visited: { count: number },
): Promise<AliExpressCategoryNode[] | null> {
  if (visited.count >= MAX_CATEGORY_SEARCH_NODES) return null
  visited.count++

  const children = await getChildren(parentId)

  for (const child of children) {
    if (child.categoryId === targetId) {
      return [...trail, child]
    }

    if (!child.isLeaf && (targetLevel === null || child.level === null || child.level < targetLevel)) {
      const found = await findPathToCategory(
        child.categoryId,
        targetId,
        targetLevel,
        [...trail, child],
        visited,
      )
      if (found) return found
    }
  }

  return null
}

async function persistPath(path: AliExpressCategoryNode[]): Promise<string> {
  let parentId: string | null = null
  let leafDbId = ''

  for (const node of path) {
    const existing = await prisma.aliExpressCategory.findUnique({
      where: { categoryId: node.categoryId },
      select: { id: true },
    })

    const saved: { id: string } = existing
      ? await prisma.aliExpressCategory.update({
          where: { id: existing.id },
          data: {
            name: node.name,
            names: node.names,
            level: node.level,
            isLeaf: node.isLeaf,
            parentId,
          },
          select: { id: true },
        })
      : await prisma.aliExpressCategory.create({
          data: {
            categoryId: node.categoryId,
            name: node.name,
            names: node.names,
            level: node.level,
            isLeaf: node.isLeaf,
            parentId,
          },
          select: { id: true },
        })

    parentId = saved.id
    leafDbId = saved.id
  }

  return leafDbId
}

export async function resolveAliExpressCategory(categoryId: string): Promise<AliExpressCategoryPath | null> {
  const normalizedId = categoryId.trim()
  if (!normalizedId) return null

  const existing = await prisma.aliExpressCategory.findUnique({
    where: { categoryId: normalizedId },
    select: { id: true },
  })

  if (existing) {
    return {
      nodes: await getStoredCategoryPath(existing.id),
      leafDbId: existing.id,
    }
  }

  const detail = await getCategoryDetail(normalizedId)
  if (!detail) return null

  let path: AliExpressCategoryNode[] | null = null

  if (detail.level === null || detail.level > 1) {
    path = await findPathToCategory('0', normalizedId, detail.level, [], { count: 0 })
  } else {
    path = [detail]
  }

  if (!path) path = [detail]

  const leafDbId = await persistPath(path)
  return { nodes: path, leafDbId }
}

export async function getStoredCategoryPath(categoryDbId: string): Promise<AliExpressCategoryNode[]> {
  const nodes: AliExpressCategoryNode[] = []
  let currentId: string | null = categoryDbId

  while (currentId) {
    const row: {
      id: string
      categoryId: string
      name: string
      names: unknown
      level: number | null
      isLeaf: boolean
      parentId: string | null
    } | null = await prisma.aliExpressCategory.findUnique({
      where: { id: currentId },
      select: {
        id: true,
        categoryId: true,
        name: true,
        names: true,
        level: true,
        isLeaf: true,
        parentId: true,
      },
    })

    if (!row) break

    const names = (row.names && typeof row.names === 'object' && !Array.isArray(row.names))
      ? Object.fromEntries(
          Object.entries(row.names as Record<string, unknown>)
            .filter(([, value]) => typeof value === 'string')
            .map(([key, value]) => [key, String(value)]),
        )
      : {}

    nodes.unshift({
      categoryId: row.categoryId,
      name: row.name,
      names,
      level: row.level,
      isLeaf: row.isLeaf,
    })

    currentId = row.parentId
  }

  return nodes
}

export async function getAliExpressCategoryBreadcrumb(categoryDbId: string): Promise<string[]> {
  return (await getStoredCategoryPath(categoryDbId)).map((node) => node.name)
}


export async function backfillAliExpressCategories(): Promise<number> {
  const rows = await prisma.aliExpressSKU.findMany({
    where: {
      rawCategoryId: { not: null },
      aliExpressCategoryId: null,
    },
    select: { rawCategoryId: true },
    distinct: ['rawCategoryId'],
  })

  let resolved = 0

  for (const row of rows) {
    if (!row.rawCategoryId) continue
    const category = await resolveAliExpressCategory(row.rawCategoryId)
    if (!category) continue

    const result = await prisma.aliExpressSKU.updateMany({
      where: {
        rawCategoryId: row.rawCategoryId,
        aliExpressCategoryId: null,
      },
      data: { aliExpressCategoryId: category.leafDbId },
    })

    resolved += result.count
  }

  return resolved
}
