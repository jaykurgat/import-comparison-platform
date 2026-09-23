'use server'

import { revalidatePath } from 'next/cache'
import { ingestCsv } from '@/lib/ingestion/ingestCsv'
import { promoteLocalListings } from '@/lib/matching/promoteLocalSku'

export type ImportState = {
  ok: boolean
  message: string
  inserted?: number
  rejected?: number
  promoted?: {
    created: number
    updated: number
    rawRowsLinked: number
  }
}

export async function importLocalCsv(_previous: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin()

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Choose a CSV file first.' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, message: 'CSV files are limited to 10 MB.' }
  }

  const mapping = {
    title: String(formData.get('title') ?? '').trim(),
    price: String(formData.get('price') ?? '').trim(),
    category: String(formData.get('category') ?? '').trim() || undefined,
    sourceRef: String(formData.get('sourceRef') ?? '').trim() || undefined,
    sourceUrl: String(formData.get('sourceUrl') ?? '').trim() || undefined,
    description: String(formData.get('description') ?? '').trim() || undefined,
    imageUrls: String(formData.get('imageUrls') ?? '').trim() || undefined,
    currency: String(formData.get('currency') ?? '').trim() || undefined,
    inStock: String(formData.get('inStock') ?? '').trim() || undefined,
    color: String(formData.get('color') ?? '').trim() || undefined,
    size: String(formData.get('size') ?? '').trim() || undefined,
  }

  if (!mapping.title || !mapping.price) {
    return { ok: false, message: 'Title and price column names are required.' }
  }

  try {
    const result = await ingestCsv(await file.text(), mapping)
    revalidatePath('/admin/import')
    revalidatePath('/admin/review')
    return {
      ok: result.errors.length === 0,
      message: result.errors.length
        ? 'Import completed with rejected rows. Review the validation summary below.'
        : 'CSV imported successfully into the raw audit layer.',
      inserted: result.inserted,
      rejected: result.errors.length,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'CSV import failed.',
    }
  }
}

export async function promoteImportedListings(): Promise<ImportState> {
  await requireAdmin()

  try {
    const result = await promoteLocalListings()
    revalidatePath('/admin/import')
    revalidatePath('/products')
    return {
      ok: true,
      message: 'Valid raw listings promoted into the canonical local catalog.',
      promoted: result,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Promotion failed.',
    }
  }
}
