import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTitleWords, scoreMatch, titleSimilarity } from '../lib/matching/similarity'

test('title normalization removes stopwords and punctuation', () => {
  assert.deepEqual(normalizeTitleWords('New, High-Quality Backpack for Travel'), ['quality', 'backpack', 'travel'])
})

test('identical normalized titles produce perfect similarity', () => {
  assert.equal(titleSimilarity('Red Backpack!', 'red backpack'), 1)
})

test('explicit attribute mismatch is penalized more than a match is rewarded', () => {
  const base = scoreMatch({ title: 'Canvas Backpack', color: 'Red' }, { title: 'Canvas Backpack', color: undefined })
  const match = scoreMatch({ title: 'Canvas Backpack', color: 'Red' }, { title: 'Canvas Backpack', color: 'Red' })
  const mismatch = scoreMatch({ title: 'Canvas Backpack', color: 'Red' }, { title: 'Canvas Backpack', color: 'Blue' })
  assert.equal(base.confidence, 1)
  assert.equal(match.confidence, 1)
  assert.equal(mismatch.confidence, 0.75)
})
