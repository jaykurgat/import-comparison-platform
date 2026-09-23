import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canReviewDecision,
  getMatchDecisionStatus,
  isHumanDecision,
  selectBestCandidate,
} from '../lib/matching/matchDecision'

const local = { title: 'Canvas Backpack', color: 'Red' }

test('no candidate is returned when every candidate was rejected', () => {
  const result = selectBestCandidate(
    local,
    [{ id: 'rejected', title: 'Canvas Backpack', color: 'Red' }],
    new Set(['rejected']),
  )
  assert.equal(result, null)
})

test('a rejected candidate is skipped in favor of the next available candidate', () => {
  const result = selectBestCandidate(
    local,
    [
      { id: 'rejected', title: 'Canvas Backpack', color: 'Red' },
      { id: 'alternative', title: 'Canvas Backpack', color: 'Blue' },
    ],
    new Set(['rejected']),
  )
  assert.equal(result?.candidate.id, 'alternative')
  assert.equal(result?.score.confidence, 0.75)
})

test('low-confidence candidates do not qualify for a match decision', () => {
  assert.equal(getMatchDecisionStatus(0.39), null)
  assert.equal(getMatchDecisionStatus(0.4), 'NEEDS_REVIEW')
})

test('high-confidence candidates qualify for automatic matching', () => {
  assert.equal(getMatchDecisionStatus(0.9), 'AUTO_MATCHED')
  assert.equal(getMatchDecisionStatus(1), 'AUTO_MATCHED')
})

test('human decisions are terminal and cannot be reviewed again', () => {
  assert.equal(isHumanDecision('MANUAL_CONFIRMED'), true)
  assert.equal(isHumanDecision('REJECTED'), true)
  assert.equal(canReviewDecision('MANUAL_CONFIRMED'), false)
  assert.equal(canReviewDecision('REJECTED'), false)
  assert.equal(canReviewDecision('NEEDS_REVIEW'), true)
  assert.equal(canReviewDecision('AUTO_MATCHED'), true)
})
