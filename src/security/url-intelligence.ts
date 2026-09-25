const URL_REGEX = /(?:https?:\/\/|www\.)[^\s]+/gi
const BARE_DOMAIN_REGEX = /^[\w.-]+\.\w{2,}(?:\/[^\s]*)?$/i
const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd', 'tiny.cc'])
const HIGH_ABUSE_TLDS = /\.(?:xyz|top|click|live|buzz|rest|work|loan)$/i

export const TRUSTED_DOMAINS = ['gtbank.com', 'accessbankplc.com', 'zenithbank.com', 'firstbanknigeria.com', 'uba.com', 'fcmb.com', 'stanbicibtcbank.com', 'opayweb.com', 'palmpay.com', 'kuda.com', 'moniepoint.com']

const BRAND_ALIASES: Record<string, string[]> = {
  gtbank: ['gtbank.com'], guarantytrustbank: ['gtbank.com'], accessbank: ['accessbankplc.com'],
  zenithbank: ['zenithbank.com'], firstbank: ['firstbanknigeria.com'], uba: ['uba.com'],
  fcmb: ['fcmb.com'], kuda: ['kuda.com'], opay: ['opayweb.com'], palmpay: ['palmpay.com'], moniepoint: ['moniepoint.com'],
}

function parseUrl(value: string): URL | null {
  try { return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`) } catch { return null }
}

const canonicalBrand = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '')
const belongsTo = (domain: string, expectedDomains: string[]): boolean => expectedDomains.some((expected) => domain === expected || domain.endsWith(`.${expected}`))
const findUrls = (text: string): string[] => text.match(URL_REGEX) || (BARE_DOMAIN_REGEX.test(text.trim()) ? [text.trim()] : [])
const finding = (id: string, title: string, points: number, detail: string, pidgin: string, severity: Severity = 'high'): Evidence => ({ id, title, points, detail, pidgin, severity, source: 'url-intelligence' })

/** Return deterministic URL facts and evidence without making a network request. */
export function inspectUrls(text: string, claimedBrand = ''): UrlInspection[] {
  const expectedDomains = BRAND_ALIASES[canonicalBrand(claimedBrand)] || []
  return findUrls(text).map((rawValue) => {
    const value = rawValue.replace(/[),.!]+$/, '')
    const parsed = parseUrl(value)
    if (!parsed) return { value, risky: true, evidence: [finding(`url-malformed-${value}`, 'Malformed link', 26, 'The link is not a valid web address.', 'This link no be correct website address.')] }

    const domain = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const evidence: Evidence[] = []
    const trusted = belongsTo(domain, TRUSTED_DOMAINS)
    if (SHORTENERS.has(domain)) evidence.push(finding(`url-shortened-${domain}`, 'Hidden link destination', 24, 'The shortened URL hides its final destination.', 'Short link hide the real website wey e wan carry you go.'))
    if (domain.includes('xn--')) evidence.push(finding(`url-punycode-${domain}`, 'Lookalike domain', 30, 'The domain uses encoded lookalike characters.', 'The website use lookalike letters to deceive person.', 'critical'))
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain)) evidence.push(finding(`url-ip-${domain}`, 'Unrecognisable destination', 27, 'The link uses an IP address instead of a recognisable domain.', 'The link use number instead of website name.'))
    if (HIGH_ABUSE_TLDS.test(domain)) evidence.push(finding(`url-tld-${domain}`, 'Suspicious link', 24, 'The domain ending is frequently abused in disposable sites.', 'This website ending get warning signs and scammers dey use am well-well.'))
    if (expectedDomains.length && !belongsTo(domain, expectedDomains)) evidence.push(finding(`url-brand-${domain}`, 'Brand and domain mismatch', 30, `The domain does not belong to ${claimedBrand}.`, `This website no belong to ${claimedBrand}.`, 'critical'))
    if (parsed.protocol !== 'https:') evidence.push(finding(`url-http-${domain}`, 'Unencrypted connection', 16, 'The connection is not protected with HTTPS.', 'The website connection no get proper protection.', 'medium'))
    return { value, domain, trusted, risky: evidence.length > 0, evidence }
  })
}
import type { Evidence, Severity, UrlInspection } from './types'
