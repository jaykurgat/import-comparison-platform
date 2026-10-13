'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

export type CategoryActionState = { ok: boolean; message: string }

function invalidate() {
  revalidatePath('/admin/categories')
  revalidatePath('/admin/catalog')
  revalidatePath('/products')
  revalidatePath('/')
}

export async function createCategory(_previous: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const parentId = String(formData.get('parentId') ?? '').trim() || null
  if (!name) return { ok: false, message: 'Enter a category name.' }
  if (parentId && !(await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } }))) {
    return { ok: false, message: 'The selected parent category does not exist.' }
  }
  const existing = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' }, parentId }, select: { id: true } })
  if (existing) return { ok: false, message: 'That category already exists at this level.' }
  const lastSibling = await prisma.category.findFirst({ where: { parentId }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } })
  await prisma.category.create({ data: { name, parentId, sortOrder: (lastSibling?.sortOrder ?? -10) + 10 } })
  invalidate()
  return { ok: true, message: parentId ? 'Subcategory created.' : 'Category created.' }
}

export async function updateCategory(id: string, name: string, parentId: string | null) {
  await requireAdmin()
  const cleanName = name.trim()
  if (!cleanName) throw new Error('Category name is required.')
  if (parentId === id) throw new Error('A category cannot be its own parent.')
  const current = await prisma.category.findUnique({ where: { id }, select: { id: true } })
  if (!current) throw new Error('Category not found.')

  if (parentId) {
    const all = await prisma.category.findMany({ select: { id: true, parentId: true } })
    const children = new Map<string, string[]>()
    for (const row of all) if (row.parentId) children.set(row.parentId, [...(children.get(row.parentId) ?? []), row.id])
    const descendants = new Set<string>()
    const stack = [id]
    while (stack.length) {
      const next = stack.pop()!
      if (descendants.has(next)) continue
      descendants.add(next)
      for (const child of children.get(next) ?? []) stack.push(child)
    }
    if (descendants.has(parentId)) throw new Error('A category cannot be moved inside its own descendant.')
    if (!(await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } }))) throw new Error('Selected parent category does not exist.')
  }

  const duplicate = await prisma.category.findFirst({ where: { id: { not: id }, name: { equals: cleanName, mode: 'insensitive' }, parentId }, select: { id: true } })
  if (duplicate) throw new Error('That category already exists at this level.')
  await prisma.category.update({ where: { id }, data: { name: cleanName, parentId } })
  invalidate()
}


export async function setCategoryActive(id: string, isActive: boolean) {
  await requireAdmin()
  const category = await prisma.category.findUnique({ where: { id }, select: { id: true } })
  if (!category) throw new Error('Category not found.')
  await prisma.category.update({ where: { id }, data: { isActive } })
  invalidate()
}

export async function moveCategoryOrder(id: string, direction: 'up' | 'down') {
  await requireAdmin()
  const current = await prisma.category.findUnique({ where: { id }, select: { id: true, parentId: true, sortOrder: true } })
  if (!current) throw new Error('Category not found.')
  const siblings = await prisma.category.findMany({
    where: { parentId: current.parentId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, sortOrder: true },
  })
  const index = siblings.findIndex((item) => item.id === id)
  const other = siblings[index + (direction === 'up' ? -1 : 1)]
  if (!other) return
  await prisma.$transaction([
    prisma.category.update({ where: { id: current.id }, data: { sortOrder: other.sortOrder } }),
    prisma.category.update({ where: { id: other.id }, data: { sortOrder: current.sortOrder } }),
  ])
  invalidate()
}
