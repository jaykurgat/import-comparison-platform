import type { ProductDescriptionFeature } from '@/lib/product/buildProductDescription'

export default function ProductDescription({
  description,
  coreFeatures,
}: {
  description: string
  coreFeatures: ProductDescriptionFeature[]
}) {
  const paragraphs = description.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)

  return (
    <section className="mt-7 border-t border-slate-100 pt-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Product information</p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">Product description</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
        {paragraphs.map((paragraph, index) => <p key={index} className="whitespace-pre-line">{paragraph}</p>)}
      </div>
      {coreFeatures.length > 0 && (
        <div className="mt-6 rounded-2xl bg-[#f7f7f3] p-5">
          <h3 className="text-sm font-black text-slate-900">Core features</h3>
          <dl className="mt-4 divide-y divide-slate-200/70">
            {coreFeatures.map((feature) => (
              <div key={feature.label} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[150px_1fr] sm:gap-5">
                <dt className="text-xs font-black uppercase tracking-[0.08em] text-slate-400">{feature.label}</dt>
                <dd className="text-sm font-semibold text-slate-700">{feature.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
