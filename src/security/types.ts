export type Severity = 'medium' | 'high' | 'critical'
export type EvidenceSource = 'message-language' | 'url-intelligence'
export type RiskLevel = 'Low risk' | 'Medium risk' | 'High risk'
export type ExplanationLanguage = 'english' | 'pidgin'

export interface Evidence {
  id: string
  title: string
  points: number
  severity: Severity
  detail: string
  pidgin: string
  source: EvidenceSource
  excerpt?: string
}

export interface UrlInspection {
  value: string
  domain?: string
  trusted?: boolean
  risky: boolean
  evidence: Evidence[]
}

export type PublicUrlInspection = Omit<UrlInspection, 'evidence'>

export interface RiskInteraction {
  id: string
  requires: string[]
  points: number
  reason: string
}

export interface AnalysisTrace {
  basePoints: number
  interactionPoints: number
  interactions: RiskInteraction[]
  detectorsRun: EvidenceSource[]
  policyVersion: string
}

export interface AnalysisResult {
  score: number
  level: RiskLevel
  scamType: string
  confidence: number
  evidence: Evidence[]
  urls: PublicUrlInspection[]
  english: string
  pidgin: string
  text: string
  analysedAt: string
  trace: AnalysisTrace
}

export interface FraudAnalysisInput {
  text: string
  claimedBrand?: string
  now?: () => Date
}
