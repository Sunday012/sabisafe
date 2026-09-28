/** Combinations that are riskier together than their individual signals. */
export const INTERACTIONS: RiskInteraction[] = [
  { id: 'coercive-disclosure', requires: ['urgency', 'secrets'], points: 8, reason: 'Urgency is being used to obtain sensitive information.' },
  { id: 'coercive-threat', requires: ['urgency', 'threat'], points: 6, reason: 'Urgency and threats combine into a coercive pattern.' },
  { id: 'credential-phishing', requires: ['secrets', 'url'], points: 8, reason: 'A link is paired with a request involving private credentials.' },
  { id: 'authority-pressure', requires: ['impersonation', 'threat'], points: 5, reason: 'Claimed authority is reinforced with a threat.' },
  { id: 'isolated-payment', requires: ['money', 'secrecy'], points: 9, reason: 'Payment is requested while discouraging independent verification.' },
]

function activeFamilies(evidence: Evidence[]): Set<string> {
  const families = new Set(evidence.map((item) => item.id))
  if (evidence.some((item) => item.source === 'url-intelligence')) families.add('url')
  return families
}

interface ScoreResult {
  score: number
  basePoints: number
  interactionPoints: number
  interactions: RiskInteraction[]
}

export function scoreEvidence(evidence: Evidence[], hasContent: boolean): ScoreResult {
  if (!hasContent) return { score: 0, basePoints: 0, interactionPoints: 0, interactions: [] }
  const families = activeFamilies(evidence)
  const interactions = INTERACTIONS.filter((interaction) => interaction.requires.every((id) => families.has(id)))
  const basePoints = evidence.reduce((total, item) => total + item.points, 0)
  const interactionPoints = interactions.reduce((total, item) => total + item.points, 0)
  return { score: Math.min(92, Math.max(8, basePoints + interactionPoints)), basePoints, interactionPoints, interactions }
}

export const classifyRisk = (score: number): RiskLevel => score >= 65 ? 'High risk' : score >= 35 ? 'Medium risk' : 'Low risk'

export function inferScamType(evidence: Evidence[], score: number): string {
  const ids = new Set(evidence.map((item) => item.id))
  if ([...ids].some((id) => id.startsWith('payment-'))) return 'Suspicious payment proof'
  if (ids.has('secrets') && evidence.some((item) => item.source === 'url-intelligence')) return 'Bank impersonation / phishing'
  if (ids.has('reward')) return 'Prize or investment scam'
  if (ids.has('money')) return 'Payment scam'
  if (ids.has('impersonation')) return 'Impersonation attempt'
  return score >= 35 ? 'Suspicious solicitation' : 'No clear scam pattern'
}

export function estimateConfidence(evidence: Evidence[], urls: UrlInspection[]): number {
  const detectorFamilies = new Set(evidence.map((item) => item.source)).size
  const criticalSignals = evidence.filter((item) => item.severity === 'critical').length
  return Math.min(96, 38 + detectorFamilies * 12 + criticalSignals * 8 + Math.max(0, evidence.length - 1) * 7 + (urls.length ? 6 : 0))
}
import type { Evidence, RiskInteraction, RiskLevel, UrlInspection } from './types'
