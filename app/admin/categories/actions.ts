'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/auth'
import { prisma } from '@/lib/prisma'

export type CategoryActionState = {
  ok: boolean
  message: string
}

export async function createCategory(_previous: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  await requireAdmin()

  const name = String(formData.get('name') ?? '').trim()
  const parentId = String(formData.get('parentId') ?? '').trim() || null

  if (!name) return { ok: false, message: 'Enter a category name.' }

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } })
    if (!parent) return { ok: false, message: 'The selected parent category does not exist.' }
  }

  const existing = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      parentId,
    },
    select: { id: true },
  })

  if (existing) {
    return { ok: false, message: 'That category already exists at this level.' }
  }

  await prisma.category.create({
    data: { name, parentId },
  })

  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')
  return { ok: true, message: parentId ? 'Subcategory created.' : 'Category created.' }
}
