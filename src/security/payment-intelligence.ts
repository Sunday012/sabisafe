import type { Evidence } from './types'

interface PaymentContext {
  expectedAmount?: number
}

const finding = (
  id: string,
  title: string,
  points: number,
  detail: string,
  pidgin: string,
  severity: Evidence['severity'] = 'high',
): Evidence => ({ id, title, points, detail, pidgin, severity, source: 'payment-intelligence' })

function extractNairaAmounts(text: string): number[] {
  const matches = [...text.matchAll(/(?:₦|ngn\s*)([\d,]+(?:\.\d{1,2})?)/gi)]
  return matches
    .map((match) => Number(match[1]?.replace(/,/g, '')))
    .filter((amount) => Number.isFinite(amount))
}

export function inspectPaymentEvidence(text: string, context: PaymentContext = {}): Evidence[] {
  const evidence: Evidence[] = []

  if (/pending|processing|reversal|reversed|scheduled transfer|awaiting confirmation/i.test(text)) {
    evidence.push(finding('payment-pending', 'Payment is not final', 24, 'The receipt or message says the payment is pending, reversible, or still processing.', 'The payment never complete yet, or dem still fit reverse am.', 'critical'))
  }

  if (/release (?:the )?(?:item|goods)|send (?:the )?(?:item|goods)|dispatch.*(?:now|immediately)|before.*(?:alert|reflect)/i.test(text)) {
    evidence.push(finding('payment-release-pressure', 'Pressure to release goods', 25, 'The sender wants goods or value released before the payment is independently confirmed.', 'Dem dey rush you release goods before money show for your own account.', 'critical'))
  }

  if (/screenshot|receipt|proof of payment|debit alert/i.test(text) && !/reference|transaction id|session id/i.test(text)) {
    evidence.push(finding('payment-no-reference', 'Missing transaction reference', 15, 'The payment proof mentions a transfer but does not show a transaction or session reference.', 'The payment proof no show transaction or session reference.', 'medium'))
  }

  if (context.expectedAmount && context.expectedAmount > 0) {
    const amounts = extractNairaAmounts(text)
    const matchesExpected = amounts.some((amount) => Math.abs(amount - context.expectedAmount!) < 0.01)
    if (amounts.length && !matchesExpected) {
      evidence.push(finding('payment-amount-mismatch', 'Amount does not match', 28, `The receipt amounts do not match the expected ₦${context.expectedAmount.toLocaleString('en-NG')}.`, `The amount for receipt no match ₦${context.expectedAmount.toLocaleString('en-NG')} wey you expect.`, 'critical'))
    }
  }

  return evidence
}
