import { runFraudAnalysis } from './security/pipeline'
import { MESSAGE_SIGNALS } from './security/signals'
import { inspectPaymentEvidence } from './security/payment-intelligence'
import type { AnalysisResult, Evidence } from './security/types'

export type { AnalysisResult, Evidence, ExplanationLanguage } from './security/types'

export interface HighlightedPart {
  text: string
  flagged: boolean
  key: string
}

/** Public adapter retained for the UI and future API consumers. */
export function analyseText(text: string, claimedBrand = ''): AnalysisResult {
  return runFraudAnalysis({ text, claimedBrand })
}

export function analysePayment(text: string, expectedAmount?: number): AnalysisResult {
  return runFraudAnalysis({ text, additionalEvidence: inspectPaymentEvidence(text, { expectedAmount }) })
}

export function highlightMessage(text: string, evidence: Evidence[]): HighlightedPart[] {
  const patterns = MESSAGE_SIGNALS
    .filter((signal) => evidence.some((item) => item.id === signal.id))
    .map((signal) => signal.pattern.source)
  if (!patterns.length) return [{ text, flagged: false, key: 'plain-0' }]

  const regex = new RegExp(`(${patterns.join('|')})`, 'gi')
  let offset = 0
  return text.split(regex).filter(Boolean).map((part) => {
    const flagged = patterns.some((pattern) => new RegExp(pattern, 'i').test(part))
    const item = { text: part, flagged, key: `${offset}-${part}` }
    offset += part.length
    return item
  })
}
