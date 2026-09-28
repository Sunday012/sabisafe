import { expect, test } from 'vitest'
import { analysePayment } from '../src/engine'
import { runFraudAnalysis } from '../src/security/pipeline'

const fixedNow = () => new Date('2026-09-25T12:00:00.000Z')

test('corroborates language and URL evidence without claiming certainty', () => {
  const result = runFraudAnalysis({ text: 'Dear customer, your bank account will be suspended today. Click immediately to update your BVN: https://gtbank-secure-update.xyz', claimedBrand: 'GTBank', now: fixedNow })
  expect(result.score).toBe(92)
  expect(result.level).toBe('High risk')
  expect(result.scamType).toBe('Bank impersonation / phishing')
  expect(result.evidence.some((item) => item.id === 'secrets')).toBe(true)
  expect(result.evidence.some((item) => item.title === 'Brand and domain mismatch')).toBe(true)
  expect(result.trace.interactions.some((item) => item.id === 'credential-phishing')).toBe(true)
  expect(result.trace.policyVersion).toBe('2026.10')
})

test('does not treat a trusted subdomain as a brand mismatch', () => {
  const result = runFraudAnalysis({ text: 'Read more at https://help.kuda.com/security', claimedBrand: 'Kuda', now: fixedNow })
  expect(result.level).toBe('Low risk')
  expect(result.urls[0]?.trusted).toBe(true)
  expect(result.evidence.some((item) => item.title === 'Brand and domain mismatch')).toBe(false)
})

test('raises risk when ambiguous tactics form a coercive pattern', () => {
  const result = runFraudAnalysis({ text: 'Act immediately or access will be suspended. Send the OTP now.', now: fixedNow })
  expect(result.level).toBe('High risk')
  expect(result.trace.interactionPoints).toBeGreaterThan(0)
  expect(result.trace.detectorsRun).toEqual(['message-language', 'url-intelligence'])
})

test('keeps benign text above zero to express residual uncertainty', () => {
  const result = runFraudAnalysis({ text: 'See you at the office tomorrow.', now: fixedNow })
  expect(result.score).toBe(8)
  expect(result.level).toBe('Low risk')
  expect(result.evidence).toHaveLength(0)
})

test('corroborates pending payment, release pressure, and amount mismatch', () => {
  const result = analysePayment(
    'Proof of payment: NGN 45,000. Status: processing. Release the goods immediately before the alert reflects.',
    50000,
  )

  expect(result.level).toBe('High risk')
  expect(result.scamType).toBe('Suspicious payment proof')
  expect(result.evidence.map((item) => item.id)).toEqual(expect.arrayContaining([
    'payment-pending',
    'payment-release-pressure',
    'payment-amount-mismatch',
  ]))
  expect(result.trace.detectorsRun).toContain('payment-intelligence')
})
