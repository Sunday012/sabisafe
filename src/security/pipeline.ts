import { detectMessageSignals } from './signals'
import { inspectUrls } from './url-intelligence'
import { classifyRisk, estimateConfidence, inferScamType, scoreEvidence } from './risk-policy'
import type { AnalysisResult, EvidenceSource, ExplanationLanguage, FraudAnalysisInput } from './types'

const GUIDANCE: Record<'high' | 'medium' | 'low', Record<ExplanationLanguage, string>> = {
  high: { english: 'This looks dangerous. Do not click any link, send money, or share personal details. Contact the organisation using its official app, website, or phone number.', pidgin: 'This one get serious red flags. No click any link, send money, or share your private details. Contact the organisation with their correct app or number.' },
  medium: { english: 'There are warning signs here. Pause and verify the sender through a separate, trusted channel before taking any action.', pidgin: 'Some things no clear for here. Calm down first, then confirm the sender with another correct channel before you do anything.' },
  low: { english: 'No strong scam pattern was found, but stay careful. Verify unexpected requests independently before you act.', pidgin: 'We no see strong scam sign, but still shine your eye. Confirm any surprise request before you act.' },
}

const riskKey = (score: number): 'high' | 'medium' | 'low' => score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low'

/**
 * Explainable detection pipeline. Each stage returns facts; the trace keeps
 * every score contribution observable to the UI, tests, and auditors.
 */
export function runFraudAnalysis({ text, claimedBrand = '', now = () => new Date(), additionalEvidence = [] }: FraudAnalysisInput): AnalysisResult {
  const normalizedText = String(text || '').trim()
  const messageEvidence = detectMessageSignals(normalizedText)
  const urls = inspectUrls(normalizedText, claimedBrand)
  const evidence = [...messageEvidence, ...urls.flatMap((url) => url.evidence), ...additionalEvidence]
  const scoring = scoreEvidence(evidence, Boolean(normalizedText))
  const guidance = GUIDANCE[riskKey(scoring.score)]
  return {
    score: scoring.score,
    level: classifyRisk(scoring.score),
    scamType: inferScamType(evidence, scoring.score),
    confidence: estimateConfidence(evidence, urls),
    evidence,
    urls: urls.map((url) => ({ value: url.value, domain: url.domain, trusted: url.trusted, risky: url.risky })),
    english: guidance.english,
    pidgin: guidance.pidgin,
    text: normalizedText,
    analysedAt: now().toISOString(),
    trace: {
      basePoints: scoring.basePoints,
      interactionPoints: scoring.interactionPoints,
      interactions: scoring.interactions,
      detectorsRun: [...new Set<EvidenceSource>(['message-language', 'url-intelligence', ...additionalEvidence.map((item) => item.source)])],
      policyVersion: '2026.10',
    },
  }
}
