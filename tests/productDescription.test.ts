import assert from 'node:assert/strict'
import testFn from 'node:test'
import { buildProductDescription, cleanProductDescription } from '../lib/product/buildProductDescription'

testFn('builds a description when the source description is missing', () => {
  const result = buildProductDescription({
    title: 'Portable Blender',
    source: 'import',
    categoryName: 'Kitchen Appliances',
    color: 'White',
    size: '500 ml',
    specs: { material: 'BPA-free plastic', power: '150W' },
  })
  assert.ok(result.overview.includes('Portable Blender'))
  assert.match(result.overview, /direct import listing/i)
  assert.deepEqual(result.coreFeatures, [
    { label: 'Color', value: 'White' },
    { label: 'Size', value: '500 ml' },
    { label: 'Material', value: 'BPA-free plastic' },
    { label: 'Power', value: '150W' },
  ])
  assert.match(result.text, /Core features:/)
})

testFn('cleans supplier HTML before displaying it', () => {
  const cleaned = cleanProductDescription('<p>Simple product</p><ul><li>Steel body</li><li>Compact size</li></ul>')
  assert.equal(cleaned, 'Simple product\n• Steel body\n• Compact size')
})

testFn('combines variant attributes without inventing product claims', () => {
  const result = buildProductDescription({
    title: 'Cotton T-Shirt',
    source: 'import',
    color: 'Black',
    additionalColors: ['White', 'Black'],
    additionalSizes: ['M', 'L'],
    additionalSpecs: [{ material: 'Cotton' }, { material: 'Cotton' }, { sleeve: 'Short sleeve' }],
    variantCount: 4,
  })
  assert.equal(result.coreFeatures[0].label, 'Color')
  assert.equal(result.coreFeatures[0].value, 'Black · White')
  assert.equal(result.coreFeatures[1].label, 'Size')
  assert.equal(result.coreFeatures[1].value, 'M · L')
  assert.match(result.text, /Available variants: 4\./)
})
