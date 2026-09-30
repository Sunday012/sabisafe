/* global Deno */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_REDIRECTS = 4
const MAX_HTML_BYTES = 128_000
const REQUEST_TIMEOUT_MS = 7_000

type InspectionStatus = 'clear' | 'threat' | 'unreachable' | 'error'

interface InspectionResult {
  status: InspectionStatus
  reachable: boolean
  finalUrl?: string
  httpStatus?: number
  pageTitle?: string
  description?: string
  redirectCount?: number
  usesHttps?: boolean
  threatTypes: string[]
  reputationChecked: boolean
  checkedAt: string
  message?: string
}

function json(body: InspectionResult | { error: string }, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isPrivateIpv4(value: string): boolean {
  const parts = value.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] >= 224
}

function isPrivateIpv6(value: string): boolean {
  const normalized = value.toLowerCase()
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb')
}

function validatePublicUrl(value: string): URL {
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  const url = new URL(candidate)
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS links can be inspected.')
  if (url.username || url.password) throw new Error('Links containing usernames or passwords are not accepted.')

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') ||
    hostname.endsWith('.internal') || isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    throw new Error('Private or local network addresses cannot be inspected.')
  }
  return url
}

async function assertPublicDns(hostname: string): Promise<void> {
  const checks = await Promise.allSettled([
    Deno.resolveDns(hostname, 'A'),
    Deno.resolveDns(hostname, 'AAAA'),
  ])
  const addresses = checks.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  if (!addresses.length) throw new Error('The site address could not be resolved.')
  if (addresses.some((address) => isPrivateIpv4(address) || isPrivateIpv6(address))) {
    throw new Error('The link resolves to a private network address and was blocked.')
  }
}

async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let output = ''

  while (received < MAX_HTML_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    const remaining = MAX_HTML_BYTES - received
    const slice = value.byteLength > remaining ? value.slice(0, remaining) : value
    received += slice.byteLength
    output += decoder.decode(slice, { stream: true })
    if (value.byteLength > remaining) break
  }
  await reader.cancel().catch(() => undefined)
  return output + decoder.decode()
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchMeta(html: string, name: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  const matching = tags.find((tag) => new RegExp(`(?:name|property)=["']${name}["']`, 'i').test(tag))
  const content = matching?.match(/content=["']([^"']*)["']/i)?.[1]
  return content ? decodeHtml(content).slice(0, 240) : undefined
}

async function checkWebRisk(url: string): Promise<{ checked: boolean; threats: string[] }> {
  const apiKey = Deno.env.get('GOOGLE_WEB_RISK_API_KEY')?.trim()
  if (!apiKey) return { checked: false, threats: [] }

  const endpoint = new URL('https://webrisk.googleapis.com/v1/uris:search')
  endpoint.searchParams.set('uri', url)
  endpoint.searchParams.append('threatTypes', 'MALWARE')
  endpoint.searchParams.append('threatTypes', 'SOCIAL_ENGINEERING')
  endpoint.searchParams.append('threatTypes', 'UNWANTED_SOFTWARE')
  endpoint.searchParams.set('key', apiKey)

  const response = await fetch(endpoint, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`Web Risk lookup failed with status ${response.status}.`)
  const payload = await response.json() as { threat?: { threatTypes?: string[] } }
  return { checked: true, threats: payload.threat?.threatTypes ?? [] }
}

async function inspect(value: string): Promise<InspectionResult> {
  let current = validatePublicUrl(value)
  let redirects = 0
  let response: Response | undefined

  while (redirects <= MAX_REDIRECTS) {
    await assertPublicDns(current.hostname)
    response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'SabiSafe-Link-Inspector/1.0',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (![301, 302, 303, 307, 308].includes(response.status)) break
    const location = response.headers.get('location')
    if (!location) break
    if (redirects === MAX_REDIRECTS) throw new Error('The link redirected too many times.')
    current = validatePublicUrl(new URL(location, current).toString())
    redirects += 1
  }

  if (!response) throw new Error('The site did not return a response.')
  const reputation = await checkWebRisk(current.toString())
  const contentType = response.headers.get('content-type') ?? ''
  const html = contentType.includes('text/html') ? await readLimitedText(response) : ''
  const pageTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const description = matchMeta(html, 'description') ?? matchMeta(html, 'og:description')

  return {
    status: reputation.threats.length ? 'threat' : 'clear',
    reachable: true,
    finalUrl: current.toString(),
    httpStatus: response.status,
    pageTitle: pageTitle ? decodeHtml(pageTitle).slice(0, 160) : undefined,
    description,
    redirectCount: redirects,
    usesHttps: current.protocol === 'https:',
    threatTypes: reputation.threats,
    reputationChecked: reputation.checked,
    checkedAt: new Date().toISOString(),
    message: reputation.checked
      ? 'The destination was reached and checked against Google Web Risk.'
      : 'The destination was reached. Connect Google Web Risk for known-threat reputation checks.',
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const body = await request.json() as { url?: unknown }
    if (typeof body.url !== 'string' || !body.url.trim()) return json({ error: 'A link is required.' }, 400)
    return json(await inspect(body.url))
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The online inspection failed.'
    const status: InspectionStatus = /resolve|respond|timeout|network|fetch/i.test(message) ? 'unreachable' : 'error'
    return json({
      status,
      reachable: false,
      threatTypes: [],
      reputationChecked: false,
      checkedAt: new Date().toISOString(),
      message,
    })
  }
})
