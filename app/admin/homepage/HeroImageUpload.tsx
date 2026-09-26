'use client'

import { useRef, useState } from 'react'

type HeroImageUploadProps = {
  value?: string
  onChange: (url: string) => void
  label: string
  compact?: boolean
}

export default function HeroImageUpload({
  value = '',
  onChange,
  label,
  compact = false,
}: HeroImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    setError('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use JPG, PNG or WebP.')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be 4 MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/homepage/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Image upload failed.')
      }

      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold">{label}</span>
        {value && (
          <button
            type="button"
            className="text-xs font-bold text-[#A6432D]"
            onClick={() => onChange('')}
          >
            Remove
          </button>
        )}
      </div>

      <div className={`mt-2 border border-dashed border-[#CFCFC9] bg-[#FAFAF8] p-3 ${compact ? 'min-h-24' : 'min-h-32'}`}>
        {value ? (
          <div className="space-y-3">
            <div className={`relative overflow-hidden bg-[#F0F0EC] ${compact ? 'h-20' : 'h-28'}`}>
              <img
                src={value}
                alt="Hero preview"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="border bg-white px-3 py-2 text-xs font-bold"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Replace image
              </button>
              <span className="truncate text-xs text-[#6B6B6E]">
                Image stored in Vercel Blob
              </span>
            </div>
          </div>
        ) : (
          <div className="flex min-h-20 flex-col items-center justify-center gap-2 text-center">
            <p className="text-xs text-[#6B6B6E]">Choose an image from your computer.</p>
            <button
              type="button"
              className="border bg-white px-4 py-2 text-xs font-black"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Upload from PC'}
            </button>
          </div>
        )}

        {uploading && (
          <p className="mt-2 text-xs font-bold text-[#2F6B4F]">
            Uploading image…
          </p>
        )}
        {error && (
          <p className="mt-2 text-xs font-bold text-[#A6432D]">{error}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
      </div>
    </div>
  )
}
