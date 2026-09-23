'use client'

import ProductGallery from '@/components/ProductGallery'
import { useImportVariantContext } from './ImportVariantContext'

export default function ImportVariantGallery({
  title,
  fallbackImages,
}: {
  title: string
  fallbackImages: string[]
}) {
  const { selectedVariant } = useImportVariantContext()

  const images = selectedVariant?.imageUrl
    ? [selectedVariant.imageUrl, ...fallbackImages.filter((image) => image !== selectedVariant.imageUrl)]
    : fallbackImages

  return <ProductGallery key={selectedVariant?.skuId ?? 'default'} title={title} imageUrls={images} />
}
