import test from 'node:test'
import assert from 'node:assert/strict'
import { runFraudAnalysis } from '../src/security/pipeline.js'

const fixedNow = () => new Date('2026-09-25T12:00:00.000Z')

test('corroborates language and URL evidence without claiming certainty', () => {
  const result = runFraudAnalysis({ text: 'Dear customer, your bank account will be suspended today. Click immediately to update your BVN: https://gtbank-secure-update.xyz', claimedBrand: 'GTBank', now: fixedNow })
  assert.equal(result.score, 92)
  assert.equal(result.level, 'High risk')
  assert.equal(result.scamType, 'Bank impersonation / phishing')
  assert.ok(result.evidence.some((item) => item.id === 'secrets'))
  assert.ok(result.evidence.some((item) => item.title === 'Brand and domain mismatch'))
  assert.ok(result.trace.interactions.some((item) => item.id === 'credential-phishing'))
  assert.equal(result.trace.policyVersion, '2026.09')
})

test('does not treat a trusted subdomain as a brand mismatch', () => {
  const result = runFraudAnalysis({ text: 'Read more at https://help.kuda.com/security', claimedBrand: 'Kuda', now: fixedNow })
  assert.equal(result.level, 'Low risk')
  assert.equal(result.urls[0].trusted, true)
  assert.equal(result.evidence.some((item) => item.title === 'Brand and domain mismatch'), false)
})

test('raises risk when ambiguous tactics form a coercive pattern', () => {
  const result = runFraudAnalysis({ text: 'Act immediately or access will be suspended. Send the OTP now.', now: fixedNow })
  assert.equal(result.level, 'High risk')
  assert.ok(result.trace.interactionPoints > 0)
  assert.deepEqual(result.trace.detectorsRun, ['message-language', 'url-intelligence'])
})

test('keeps benign text above zero to express residual uncertainty', () => {
  const result = runFraudAnalysis({ text: 'See you at the office tomorrow.', now: fixedNow })
  assert.equal(result.score, 8)
  assert.equal(result.level, 'Low risk')
  assert.equal(result.evidence.length, 0)
})
