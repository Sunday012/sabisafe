/**
 * Declarative message-signal catalogue.
 * Detectors describe evidence; they do not decide the final verdict.
 */
export const MESSAGE_SIGNALS: MessageSignal[] = [
  { id: 'urgency', category: 'False urgency', points: 17, severity: 'medium', pattern: /urgent|immediately|today|now|within\s+\d+|act fast|hurry|expire|deadline/i, detail: 'The message pressures you to act before you can verify it.', pidgin: 'The message dey rush you make you no get time verify am.' },
  { id: 'threat', category: 'Threat or pressure', points: 18, severity: 'high', pattern: /suspend|block(?:ed)?|close(?:d)?|deactivate|arrest|lose access|freeze|terminate/i, detail: 'It uses a threat to trigger fear and a quick response.', pidgin: 'Dem dey threaten you so fear go make you act sharp-sharp.' },
  { id: 'secrets', category: 'Sensitive information request', points: 25, severity: 'critical', pattern: /\b(?:otp|pin|password|passcode|bvn|cvv|card details?|login|verification code)\b/i, detail: 'It mentions private banking or identity information that should never be shared.', pidgin: 'E mention private bank details wey you no suppose share with anybody.' },
  { id: 'money', category: 'Payment request', points: 20, severity: 'high', pattern: /transfer|send (?:me )?(?:money|₦|ngn)|pay(?:ment)?|crypto|bitcoin|gift card|wallet/i, detail: 'It asks for money or a hard-to-reverse form of payment.', pidgin: 'Dem want make you send money for way wey fit hard to reverse.' },
  { id: 'reward', category: 'Unrealistic promise', points: 22, severity: 'high', pattern: /you (?:have )?won|winner|giveaway|double your|guaranteed return|investment opportunity|free cash|claim (?:your )?(?:prize|reward)/i, detail: 'The reward or return sounds unusually generous.', pidgin: 'The reward too sweet to be true.' },
  { id: 'impersonation', category: 'Impersonation pattern', points: 14, severity: 'medium', pattern: /dear (?:customer|user)|your bank|customer care|support team|federal government|efcc|cbn|friend.*new number|ceo|boss/i, detail: 'The sender uses a generic identity or claims authority without proof.', pidgin: 'The sender claim big name but no show proof say na really them.' },
  { id: 'secrecy', category: 'Isolation tactic', points: 20, severity: 'high', pattern: /don['’]?t tell|keep (?:this )?secret|between us|confidential|do not contact/i, detail: 'It discourages you from checking with someone you trust.', pidgin: 'Dem no want make you ask another person whether e real.' },
  { id: 'remote', category: 'Remote-access request', points: 26, severity: 'critical', pattern: /anydesk|teamviewer|install (?:this|the) app|screen shar|remote access/i, detail: 'Remote-access software can give a scammer control of your device.', pidgin: 'That app fit give scammer control of your phone or computer.' },
]

function excerptAroundMatch(text: string, match: RegExpExecArray | null, radius = 34): string | undefined {
  if (!match) return undefined
  const start = Math.max(0, match.index - radius)
  const end = Math.min(text.length, match.index + match[0].length + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

export function detectMessageSignals(text: string): Evidence[] {
  return MESSAGE_SIGNALS.flatMap((signal) => {
    const match = signal.pattern.exec(text)
    if (!match) return []
    return [{ id: signal.id, title: signal.category, points: signal.points, severity: signal.severity, detail: signal.detail, pidgin: signal.pidgin, source: 'message-language', excerpt: excerptAroundMatch(text, match) }]
  })
}
import type { Evidence, Severity } from './types'

interface MessageSignal {
  id: string
  category: string
  points: number
  severity: Severity
  pattern: RegExp
  detail: string
  pidgin: string
}
