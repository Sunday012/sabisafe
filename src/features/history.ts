import type { AnalysisResult } from '../engine'

export type GuardKind = 'message' | 'screenshot' | 'link' | 'call' | 'payment'

export interface SavedCheck {
  id: string
  mode: GuardKind
  score: number
  level: AnalysisResult['level']
  scamType: string
  preview: string
  analysedAt: string
}

const STORAGE_KEY = 'sabisafe-history-v1'

export function loadHistory(): SavedCheck[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as SavedCheck[]) : []
  } catch {
    return []
  }
}

export function saveCheck(mode: GuardKind, result: AnalysisResult): SavedCheck[] {
  const next: SavedCheck[] = [{
    id: crypto.randomUUID(), mode, score: result.score, level: result.level,
    scamType: result.scamType, preview: result.text.slice(0, 90), analysedAt: result.analysedAt,
  }, ...loadHistory()].slice(0, 8)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearHistory(): void {
  window.localStorage.removeItem(STORAGE_KEY)
}
