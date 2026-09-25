import { runFraudAnalysis } from './security/pipeline.js'
import { MESSAGE_SIGNALS } from './security/signals.js'

/** Public adapter retained for the UI and future API consumers. */
export function analyseText(text, claimedBrand = '') {
  return runFraudAnalysis({ text, claimedBrand })
}

export function highlightMessage(text, evidence) {
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
