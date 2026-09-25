const RULES = [
  { id: 'urgency', category: 'False urgency', weight: 19, test: /urgent|immediately|today|now|within\s+\d+|act fast|hurry|expire|deadline/i, detail: 'The message pressures you to act before you can verify it.', pidgin: 'The message dey rush you make you no get time verify am.' },
  { id: 'threat', category: 'Threat or pressure', weight: 18, test: /suspend|block(?:ed)?|close(?:d)?|deactivate|arrest|lose access|freeze|terminate/i, detail: 'It uses a threat to trigger fear and a quick response.', pidgin: 'Dem dey threaten you so fear go make you act sharp-sharp.' },
  { id: 'secrets', category: 'Sensitive information request', weight: 27, test: /\b(?:otp|pin|password|passcode|bvn|cvv|card details?|login|verification code)\b/i, detail: 'It mentions private banking or identity information that should never be shared.', pidgin: 'E mention private bank details wey you no suppose share with anybody.' },
  { id: 'money', category: 'Payment request', weight: 20, test: /transfer|send (?:me )?(?:money|₦|ngn)|pay(?:ment)?|crypto|bitcoin|gift card|wallet/i, detail: 'It asks for money or a hard-to-reverse form of payment.', pidgin: 'Dem want make you send money for way wey fit hard to reverse.' },
  { id: 'reward', category: 'Unrealistic promise', weight: 22, test: /you (?:have )?won|winner|giveaway|double your|guaranteed return|investment opportunity|free cash|claim (?:your )?(?:prize|reward)/i, detail: 'The reward or return sounds unusually generous.', pidgin: 'The reward too sweet to be true.' },
  { id: 'impersonation', category: 'Impersonation pattern', weight: 15, test: /dear (?:customer|user)|your bank|customer care|support team|federal government|efcc|cbn|friend.*new number|ceo|boss/i, detail: 'The sender uses a generic identity or claims authority without proof.', pidgin: 'The sender claim big name but no show proof say na really them.' },
  { id: 'secrecy', category: 'Isolation tactic', weight: 20, test: /don['’]?t tell|keep (?:this )?secret|between us|confidential|do not contact/i, detail: 'It discourages you from checking with someone you trust.', pidgin: 'Dem no want make you ask another person whether e real.' },
  { id: 'remote', category: 'Remote-access request', weight: 26, test: /anydesk|teamviewer|install (?:this|the) app|screen shar|remote access/i, detail: 'Remote-access software can give a scammer control of your device.', pidgin: 'That app fit give scammer control of your phone or computer.' },
]

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s]+/gi
const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd', 'tiny.cc']
const TRUSTED_DOMAINS = ['gtbank.com', 'accessbankplc.com', 'zenithbank.com', 'firstbanknigeria.com', 'uba.com', 'fcmb.com', 'stanbicibtcbank.com', 'opayweb.com', 'palmpay.com', 'kuda.com', 'moniepoint.com']

function normaliseUrl(value) {
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`)
  } catch {
    return null
  }
}

function inspectUrls(text, claimedBrand = '') {
  const raw = text.match(URL_REGEX) || (/^[\w.-]+\.\w{2,}/.test(text.trim()) ? [text.trim()] : [])
  return raw.map((item) => {
    const parsed = normaliseUrl(item.replace(/[),.!]+$/, ''))
    if (!parsed) return { value: item, risky: true, reason: 'The link format is malformed.' }
    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const shortened = SHORTENERS.some((shortener) => domain === shortener || domain.endsWith(`.${shortener}`))
    const punycode = domain.includes('xn--')
    const ipAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)
    const oddTld = /\.(?:xyz|top|click|live|buzz|rest|work|loan)$/i.test(domain)
    const brandMismatch = claimedBrand && !domain.includes(claimedBrand.toLowerCase().replace(/\s+/g, ''))
    const trusted = TRUSTED_DOMAINS.some((trustedDomain) => domain === trustedDomain || domain.endsWith(`.${trustedDomain}`))
    const reasons = []
    if (shortened) reasons.push('The shortened URL hides its final destination')
    if (punycode) reasons.push('The domain uses lookalike characters')
    if (ipAddress) reasons.push('The link uses an IP address instead of a recognisable domain')
    if (oddTld) reasons.push('The domain ending is frequently abused in disposable sites')
    if (brandMismatch && !trusted) reasons.push(`The domain does not clearly match ${claimedBrand}`)
    if (!parsed.protocol.startsWith('https')) reasons.push('The connection is not encrypted with HTTPS')
    return { value: item, domain, risky: reasons.length > 0, trusted, reasons }
  })
}

export function analyseText(text, claimedBrand = '') {
  const matches = RULES.filter((rule) => rule.test.test(text))
  const urls = inspectUrls(text, claimedBrand)
  const urlPoints = urls.reduce((sum, url) => sum + (url.risky ? 24 : 3), 0)
  const rawScore = matches.reduce((sum, match) => sum + match.weight, 0) + urlPoints
  const score = Math.min(92, Math.max(text.trim() ? 8 : 0, rawScore))
  const level = score >= 65 ? 'High risk' : score >= 35 ? 'Medium risk' : 'Low risk'
  const categories = matches.map((match) => match.category)
  const scamType = categories.includes('Sensitive information request') ? 'Bank impersonation / phishing' : categories.includes('Unrealistic promise') ? 'Prize or investment scam' : categories.includes('Payment request') ? 'Payment scam' : categories.includes('Impersonation pattern') ? 'Impersonation attempt' : score >= 35 ? 'Suspicious solicitation' : 'No clear scam pattern'
  const evidence = matches.map(({ id, category, detail, pidgin }) => ({ id, title: category, detail, pidgin }))
  urls.filter((url) => url.risky).forEach((url) => evidence.push({ id: `url-${url.domain}`, title: 'Suspicious link', detail: url.reasons.join('. ') + '.', pidgin: `This website (${url.domain}) get warning signs and e fit no be who dem claim.`, value: url.value }))
  const english = score >= 65
    ? 'This looks dangerous. Do not click any link, send money, or share personal details. Contact the organisation using its official app, website, or phone number.'
    : score >= 35
      ? 'There are warning signs here. Pause and verify the sender through a separate, trusted channel before taking any action.'
      : 'No strong scam pattern was found, but stay careful. Verify unexpected requests independently before you act.'
  const pidgin = score >= 65
    ? 'This one get serious red flags. No click any link, send money, or share your private details. Contact the organisation with their correct app or number.'
    : score >= 35
      ? 'Some things no clear for here. Calm down first, then confirm the sender with another correct channel before you do anything.'
      : 'We no see strong scam sign, but still shine your eye. Confirm any surprise request before you act.'
  return { score, level, scamType, evidence, urls, english, pidgin, text, analysedAt: new Date().toISOString() }
}

export function highlightMessage(text, evidence) {
  const patterns = RULES.filter((rule) => evidence.some((item) => item.id === rule.id)).map((rule) => rule.test.source)
  if (!patterns.length) return [{ text, flagged: false, key: 'plain-0' }]
  const regex = new RegExp(`(${patterns.join('|')})`, 'gi')
  let offset = 0
  return text.split(regex).filter(Boolean).map((part) => {
    const item = { text: part, flagged: regexTest(part, patterns), key: `${offset}-${part}` }
    offset += part.length
    return item
  })
}

function regexTest(value, patterns) {
  return patterns.some((pattern) => new RegExp(pattern, 'i').test(value))
}
