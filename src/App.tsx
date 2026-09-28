import { useEffect, useRef, useState } from 'react'
import type { Dispatch, MouseEvent as ReactMouseEvent, ReactNode, SetStateAction } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Banknote, BookOpen, Check, ChevronRight,
  CircleAlert, Clock3, Copy, Download, ExternalLink, FileAudio, FileText, Flag,
  History, Image as ImageIcon, Languages, Link2, LoaderCircle, LockKeyhole, Menu,
  Cloud, CloudOff, Home, LogIn, LogOut, Mail, MessageSquareText, Mic2, PhoneCall, Printer, ReceiptText, RefreshCw, Search, Settings2, Smartphone,
  ShieldCheck, Sparkles, Trash2, Upload, UserRound, Volume2, WalletCards, X,
} from 'lucide-react'
import { analysePayment, analyseText, highlightMessage } from './engine'
import type { AnalysisResult, ExplanationLanguage } from './engine'
import { clearHistory, loadHistory, saveCheck } from './features/history'
import type { GuardKind, SavedCheck } from './features/history'
import { transcribeAudio } from './features/transcription'
import type { TranscriptChunk, TranscriptionProgress } from './features/transcription'
import { useAccount } from './features/account'
import type { AccountState } from './features/account'
import { clearAccountHistory, saveAccountCheck, syncAccountHistory } from './features/account-history'

const MESSAGE_EXAMPLE = 'Dear customer, your bank account will be suspended today. Click this link immediately to update your BVN: https://gtbank-secure-update.xyz'
const CALL_EXAMPLE = "Hello, this is your bank's customer care. Your account will be blocked today. Tell me the OTP we just sent you immediately so I can stop it. Do not contact the branch."
const PAYMENT_EXAMPLE = 'Proof of payment: NGN 45,000. Status: processing. Please release the goods immediately before the credit alert reflects. Screenshot attached.'

interface GuardDefinition {
  id: GuardKind
  label: string
  shortLabel: string
  icon: LucideIcon
  title: string
  hint: string
}

const GUARDS: GuardDefinition[] = [
  { id: 'message', label: 'Message Guard', shortLabel: 'Message', icon: MessageSquareText, title: 'Check a suspicious message', hint: 'Paste an SMS, WhatsApp message, email, or social message.' },
  { id: 'screenshot', label: 'Screenshot Guard', shortLabel: 'Screenshot', icon: ImageIcon, title: 'Read a suspicious screenshot', hint: 'Extract text locally, review it, then run the same evidence checks.' },
  { id: 'link', label: 'Link Guard', shortLabel: 'Link', icon: Link2, title: 'Inspect a suspicious link', hint: 'Check the destination, connection, domain pattern, and claimed brand.' },
  { id: 'call', label: 'Call Guard', shortLabel: 'Call', icon: PhoneCall, title: 'Transcribe and analyse a call', hint: 'Use local Whisper transcription, then flag dangerous moments in the transcript.' },
  { id: 'payment', label: 'Payment Guard', shortLabel: 'Payment', icon: WalletCards, title: 'Verify payment evidence', hint: 'Review a receipt or alert for amount mismatches, pending status, and release pressure.' },
]

interface PresentedResult {
  analysis: AnalysisResult
  mode: GuardKind
  transcriptChunks?: TranscriptChunk[]
  sourceName?: string
}

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true">
    <svg width="39" height="39" viewBox="0 0 64 64" fill="none">
      <path d="M49.8 16.3C44.6 9.7 36.5 6.2 27.4 7.1 17 8.1 9.8 14.4 9.8 23.1c0 9.1 7.2 13.8 18.4 15.3l6.4.9c4.8.7 7.1 2.2 6.8 5-.4 3.7-4.7 6-10 6-7.1 0-12.8-2.9-17.2-8.1L5.7 50c6.2 8.2 15.3 12.4 25.7 12 13.8-.5 23.1-7.5 23.1-18.1 0-10.2-7.7-14.6-19.1-16.2l-6.2-.9c-4.5-.6-6.8-2-6.8-4.5 0-3 3.4-5.2 7.9-5.2 5.3 0 9.6 2.1 12.8 6.3l6.7-7.1Z" fill="currentColor" />
      <path d="M52.8 2.3c.8 5.6 3.9 8.8 9.2 9.7-5.3.9-8.4 4.1-9.2 9.7-.9-5.6-4-8.8-9.3-9.7 5.3-.9 8.4-4.1 9.3-9.7Z" fill="currentColor" />
    </svg>
  </span>
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function useInstallPrompt(): [BeforeInstallPromptEvent | null, () => Promise<void>] {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const installed = () => setInstallPrompt(null)
    window.addEventListener('beforeinstallprompt', capturePrompt)
    window.addEventListener('appinstalled', installed)
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt)
      window.removeEventListener('appinstalled', installed)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  return [installPrompt, install]
}

function Header({ inDashboard, onEnterApp, onProfile, signedIn, installPrompt, onInstall }: { inDashboard: boolean; onEnterApp: () => void; onProfile: () => void; signedIn: boolean; installPrompt: BeforeInstallPromptEvent | null; onInstall: () => Promise<void> }) {
  const [open, setOpen] = useState(false)

  return <header className="header">
    <a className="brand" href="#top"><BrandMark /><span>SabiSafe</span></a>
    <nav className={open ? 'nav open' : 'nav'}>
      <button className="nav-action" onClick={() => { onEnterApp(); setOpen(false) }}>{inDashboard ? 'New safety check' : 'Open dashboard'}</button>
      {inDashboard && <a href="#history" onClick={() => setOpen(false)}>Recent checks</a>}
      <a href="#learn" onClick={() => setOpen(false)}>Safety centre</a>
      {installPrompt && <button className="install-button border border-white/30 bg-gradient-to-br from-brand-500/95 to-brand-700/90 shadow-glass backdrop-blur-xl hover:from-brand-600 hover:to-brand-700" onClick={() => { void onInstall(); setOpen(false) }}><Smartphone size={15} /> Install app</button>}
      <span className="local-badge"><LockKeyhole size={14} /> Local first</span>
      <button className="header-profile" onClick={() => { onProfile(); setOpen(false) }}><UserRound size={16} /> {signedIn ? 'Profile' : 'Sign in'}</button>
    </nav>
    <button className="menu-button" aria-label="Toggle menu" onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</button>
  </header>
}

function ModeTabs({ mode, setMode }: { mode: GuardKind; setMode: (mode: GuardKind) => void }) {
  return <div className="mode-tabs" role="tablist" aria-label="Protection tools">
    {GUARDS.map((guard) => <button key={guard.id} role="tab" aria-selected={mode === guard.id} className={mode === guard.id ? 'active' : ''} onClick={() => setMode(guard.id)}><guard.icon size={18} /><span>{guard.shortLabel}</span></button>)}
  </div>
}

function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return <button className="primary-button" disabled={disabled} onClick={onClick}>{children}</button>
}

function TextArea({ value, setValue, label, placeholder }: { value: string; setValue: Dispatch<SetStateAction<string>>; label: string; placeholder: string }) {
  return <div className="textarea-wrap">
    <label className="sr-only" htmlFor={`text-${label}`}>{label}</label>
    <textarea id={`text-${label}`} value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} maxLength={4000} />
    <span className="char-count">{value.length}/4000</span>
  </div>
}

interface PanelProps {
  loading: boolean
  onResult: (result: PresentedResult) => void
}

function MessagePanel({ loading, onResult }: PanelProps) {
  const [value, setValue] = useState('')
  return <>
    <TextArea value={value} setValue={setValue} label="Suspicious message" placeholder="Paste the suspicious message here…" />
    <div className="input-helper"><button onClick={() => setValue(MESSAGE_EXAMPLE)}><Sparkles size={15} /> Load phishing example</button><span>Works offline</span></div>
    <PrimaryButton disabled={!value.trim() || loading} onClick={() => onResult({ analysis: analyseText(value), mode: 'message' })}>Analyse message <ArrowRight size={18} /></PrimaryButton>
  </>
}

async function extractImageText(file: File, onProgress: (message: string) => void): Promise<string> {
  const { recognize } = await import('tesseract.js')
  const { data } = await recognize(file, 'eng', { logger: (event) => {
    const percent = event.progress ? ` ${Math.round(event.progress * 100)}%` : ''
    onProgress(`${event.status.replace(/_/g, ' ')}${percent}`)
  } })
  return data.text.trim()
}

function ScreenshotPanel({ loading, onResult }: PanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  const chooseImage = async (file?: File) => {
    if (!file) return
    setFileName(file.name)
    setStatus('Preparing OCR…')
    setOcrLoading(true)
    setValue('')
    try {
      const text = await extractImageText(file, setStatus)
      setValue(text)
      setStatus(text ? 'Text extracted. Review it before analysis.' : 'No readable text was found. Try a clearer image.')
    } catch {
      setStatus('Text extraction failed. Your image was not uploaded; try another file.')
    } finally {
      setOcrLoading(false)
    }
  }

  return <>
    <button className="drop-zone compact" onClick={() => inputRef.current?.click()}>
      <span className="upload-circle">{ocrLoading ? <LoaderCircle className="spin" /> : <ImageIcon />}</span>
      <strong>{fileName || 'Choose a screenshot'}</strong>
      <span>PNG, JPG or WEBP · OCR runs in this browser</span>
    </button>
    <input ref={inputRef} hidden type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0])} />
    {status && <div className={value ? 'status-note success' : 'status-note'}>{ocrLoading ? <LoaderCircle className="spin" size={15} /> : <FileText size={15} />}{status}</div>}
    {value && <TextArea value={value} setValue={setValue} label="Extracted screenshot text" placeholder="Extracted text appears here…" />}
    <PrimaryButton disabled={!value.trim() || loading || ocrLoading} onClick={() => onResult({ analysis: analyseText(value), mode: 'screenshot', sourceName: fileName })}>Analyse screenshot text <ArrowRight size={18} /></PrimaryButton>
  </>
}

function LinkPanel({ loading, onResult }: PanelProps) {
  const [value, setValue] = useState('')
  const [brand, setBrand] = useState('')
  return <>
    <label className="field-label" htmlFor="url">Suspicious link</label>
    <div className="single-input"><Link2 size={19} /><input id="url" value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://secure-bank-update.xyz" /></div>
    <label className="field-label optional" htmlFor="brand">Claimed organisation <span>Optional</span></label>
    <div className="single-input"><BadgeCheck size={19} /><input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="e.g. GTBank" /></div>
    <p className="field-help">Structural checks run locally. No live reputation lookup is claimed.</p>
    <PrimaryButton disabled={!value.trim() || loading} onClick={() => onResult({ analysis: analyseText(value, brand), mode: 'link' })}>Inspect link <Search size={18} /></PrimaryButton>
  </>
}

function formatProgress(progress: TranscriptionProgress): string {
  if (progress.status === 'transcribing') return 'Transcribing audio locally…'
  if (typeof progress.progress === 'number') return `${progress.status.replace(/_/g, ' ')} ${Math.round(progress.progress)}%`
  return progress.status.replace(/_/g, ' ')
}

function CallPanel({ loading, onResult }: PanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [status, setStatus] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!file) {
      setAudioUrl('')
      return undefined
    }
    const nextUrl = URL.createObjectURL(file)
    setAudioUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [file])

  const selectFile = (next?: File) => {
    if (!next) return
    setFile(next)
    setStatus('Ready to transcribe')
    setError('')
  }

  const runTranscription = async () => {
    if (!file) return
    setTranscribing(true)
    setError('')
    try {
      const transcript = await transcribeAudio(file, (progress) => setStatus(formatProgress(progress)))
      if (!transcript.text) throw new Error('No speech was detected')
      setStatus(`Transcribed locally with ${transcript.device === 'webgpu' ? 'WebGPU' : 'WebAssembly'}`)
      onResult({ analysis: analyseText(transcript.text), mode: 'call', transcriptChunks: transcript.chunks, sourceName: file.name })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Transcription failed. Try a shorter, clearer recording.')
    } finally {
      setTranscribing(false)
    }
  }

  return <>
    <button className="drop-zone" onClick={() => inputRef.current?.click()}>
      <span className="upload-circle">{transcribing ? <LoaderCircle className="spin" /> : <FileAudio />}</span>
      <strong>{file?.name || 'Choose a call recording'}</strong>
      <span>MP3, WAV or M4A · clearer audio gives better results</span>
    </button>
    <input ref={inputRef} hidden type="file" accept="audio/*" onChange={(event) => selectFile(event.target.files?.[0])} />
    {audioUrl && <audio className="audio-player" controls src={audioUrl}>Your browser does not support audio playback.</audio>}
    <div className="model-note"><LockKeyhole size={16} /><span>Audio stays in your browser. The first use downloads and caches the transcription model.</span></div>
    {status && <div className="status-note"><LoaderCircle className={transcribing ? 'spin' : ''} size={15} />{status}</div>}
    {error && <div className="status-note error"><CircleAlert size={15} />{error}</div>}
    <div className="split-actions">
      <PrimaryButton disabled={!file || loading || transcribing} onClick={runTranscription}>{transcribing ? <><LoaderCircle className="spin" size={18} /> Working…</> : <><Mic2 size={18} /> Transcribe and analyse</>}</PrimaryButton>
      <button className="secondary-button" disabled={loading || transcribing} onClick={() => onResult({ analysis: analyseText(CALL_EXAMPLE), mode: 'call', sourceName: 'Example transcript' })}>Use transcript demo</button>
    </div>
  </>
}

function PaymentPanel({ loading, onResult }: PanelProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [amount, setAmount] = useState('')
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)

  const readReceipt = async (file?: File) => {
    if (!file) return
    setOcrLoading(true)
    setOcrStatus('Reading receipt…')
    try {
      const text = await extractImageText(file, setOcrStatus)
      setValue(text)
      setOcrStatus(text ? 'Receipt text extracted. Confirm the expected amount.' : 'No readable receipt text was found.')
    } catch {
      setOcrStatus('Receipt extraction failed. Try a clearer image.')
    } finally {
      setOcrLoading(false)
    }
  }

  return <>
    <div className="payment-grid">
      <div><label className="field-label" htmlFor="expected-amount">Expected amount <span>Optional</span></label><div className="single-input"><Banknote size={19} /><span className="currency">₦</span><input id="expected-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))} placeholder="45,000" /></div></div>
      <div><label className="field-label" htmlFor="receipt-image">Receipt image <span>Optional</span></label><button className="receipt-upload" onClick={() => imageRef.current?.click()}><Upload size={17} /> Upload receipt</button><input id="receipt-image" ref={imageRef} hidden type="file" accept="image/*" onChange={(event) => readReceipt(event.target.files?.[0])} /></div>
    </div>
    {ocrStatus && <div className="status-note">{ocrLoading ? <LoaderCircle className="spin" size={15} /> : <ReceiptText size={15} />}{ocrStatus}</div>}
    <TextArea value={value} setValue={setValue} label="Payment evidence" placeholder="Paste the payment alert, receipt text, or buyer’s message…" />
    <div className="input-helper"><button onClick={() => { setValue(PAYMENT_EXAMPLE); setAmount('50000') }}><Sparkles size={15} /> Load fake payment example</button><span>Always confirm inside your own bank app</span></div>
    <PrimaryButton disabled={!value.trim() || loading || ocrLoading} onClick={() => onResult({ analysis: analysePayment(value, amount ? Number(amount) : undefined), mode: 'payment' })}>Verify payment evidence <ArrowRight size={18} /></PrimaryButton>
  </>
}

function GuardList({ onSelect }: { onSelect: (guard: GuardKind) => void }) {
  return <section className="guard-list" aria-label="Choose a protection tool">
    <div className="guard-list-header"><span>PROTECTION TOOLS</span><h2>What do you want to check?</h2><p>Choose a tool below to get started.</p></div>
    <div className="guard-list-items">
      {GUARDS.map((guard) => <button key={guard.id} className="guard-list-item" onClick={() => onSelect(guard.id)}>
        <span className="guard-list-icon"><guard.icon size={20} /></span>
        <div className="guard-list-text"><strong>{guard.label}</strong><small>{guard.hint}</small></div>
        <ChevronRight size={18} className="guard-list-arrow" />
      </button>)}
    </div>
  </section>
}

function GuardWorkspace({ onResult, initialMode = 'message', mobile = false }: { onResult: (result: PresentedResult) => void; initialMode?: GuardKind; mobile?: boolean }) {
  const [mode, setMode] = useState<GuardKind>(initialMode)
  const [loading, setLoading] = useState(false)
  const active = GUARDS.find((guard) => guard.id === mode) ?? GUARDS[0]!

  const deliver = (result: PresentedResult) => {
    setLoading(true)
    window.setTimeout(() => {
      onResult(result)
      setLoading(false)
      document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
  }

  return <section id="check" className={mobile ? 'workspace mobile-workspace' : 'workspace'} aria-label="SabiSafe protection tools">
    {!mobile && <ModeTabs mode={mode} setMode={setMode} />}
    <div className="workspace-body">
      <div className="workspace-heading"><span className="mini-icon"><active.icon size={21} /></span><div><small>{active.label}</small><h2>{active.title}</h2><p>{active.hint}</p></div></div>
      {mode === 'message' && <MessagePanel loading={loading} onResult={deliver} />}
      {mode === 'screenshot' && <ScreenshotPanel loading={loading} onResult={deliver} />}
      {mode === 'link' && <LinkPanel loading={loading} onResult={deliver} />}
      {mode === 'call' && <CallPanel loading={loading} onResult={deliver} />}
      {mode === 'payment' && <PaymentPanel loading={loading} onResult={deliver} />}
    </div>
  </section>
}

function RiskDial({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54
  return <div className="dial-wrap"><svg viewBox="0 0 128 128" className="risk-dial" aria-label={`${score}% risk score`}><circle cx="64" cy="64" r="54" className="dial-track" /><circle cx="64" cy="64" r="54" className="dial-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} /></svg><div className="dial-copy"><strong>{score}</strong><span>risk score</span></div></div>
}

function ResultView({ presented, onReset, defaultLanguage = 'english' }: { presented: PresentedResult | null; onReset: () => void; defaultLanguage?: ExplanationLanguage }) {
  const [language, setLanguage] = useState<ExplanationLanguage>(defaultLanguage)
  const [copied, setCopied] = useState(false)
  if (!presented) return null
  const { analysis: result } = presented
  const parts = highlightMessage(result.text, result.evidence)

  const copy = async () => {
    await navigator.clipboard?.writeText(`${result.level} · ${result.score}/100 risk\n${result[language]}\n\n${result.text}`)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  const download = () => {
    const lines = [
      'SABISAFE INCIDENT REVIEW', `Tool: ${presented.mode}`, `Risk: ${result.level} (${result.score}/100)`,
      `Confidence: ${result.confidence}%`, `Category: ${result.scamType}`, '', 'CONTENT REVIEWED', result.text,
      '', 'EVIDENCE', ...result.evidence.map((item) => `- ${item.title} (+${item.points}): ${item.detail}`),
      '', 'RECOMMENDED ACTION', result.english, '', `Policy: ${result.trace.policyVersion}`, `Analysed: ${new Date(result.analysedAt).toLocaleString()}`,
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `sabisafe-${presented.mode}-report.txt`; anchor.click(); URL.revokeObjectURL(url)
  }
  const listen = () => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(result[language]); utterance.lang = 'en-NG'; window.speechSynthesis.speak(utterance)
  }

  return <section id="result" className="result-section">
    <div className="result-heading"><div><span className="eyebrow"><Sparkles size={14} /> Analysis complete</span><h2>Evidence, not just a warning</h2><p>{presented.sourceName ? `Reviewed ${presented.sourceName}` : 'Review what triggered the result and choose a safer next step.'}</p></div><button className="new-check" onClick={onReset}><RefreshCw size={16} /> New check</button></div>
    <div className="result-overview">
      <article className="risk-card"><RiskDial score={result.score} /><div><span className={`risk-pill ${result.level.toLowerCase().replace(' ', '-')}`}><CircleAlert size={14} />{result.level}</span><h3>{result.scamType}</h3><p>{result.evidence.length} evidence signals · {result.confidence}% analysis confidence</p><div className="confidence-track"><span style={{ width: `${result.confidence}%` }} /></div></div></article>
      <article className="next-action"><span className="action-icon"><ShieldCheck /></span><div><small>SAFEST NEXT ACTION</small><h3>{result.score >= 65 ? 'Stop and verify independently' : 'Pause and confirm before acting'}</h3><p>{result[language]}</p></div></article>
    </div>
    <div className="result-details">
      <article className="detail-card"><div className="detail-title"><Flag size={19} /><div><h3>Evidence detected</h3><p>Each signal contributed to the score</p></div></div><div className="evidence-list">{result.evidence.length ? result.evidence.map((item) => <div className="evidence-item" key={item.id}><span className={`severity-dot ${item.severity}`} /><div><strong>{item.title}<em>+{item.points}</em></strong><p>{language === 'english' ? item.detail : item.pidgin}</p>{item.excerpt && <small>“{item.excerpt}”</small>}</div></div>) : <div className="safe-empty"><ShieldCheck /> No strong warning pattern was detected.</div>}</div></article>
      <article className="detail-card"><div className="explain-head"><div className="detail-title"><Languages size={19} /><div><h3>Plain explanation</h3><p>Same verdict, clearer language</p></div></div><div className="language-toggle"><button className={language === 'english' ? 'selected' : ''} onClick={() => setLanguage('english')}>English</button><button className={language === 'pidgin' ? 'selected' : ''} onClick={() => setLanguage('pidgin')}>Pidgin</button></div></div><blockquote>“{result[language]}”</blockquote><button className="text-action" onClick={listen}><Volume2 size={16} /> Listen</button><div className="trace"><strong>How the score was built</strong><span>Base evidence {result.trace.basePoints} points</span><span>Pattern interactions {result.trace.interactionPoints} points</span><span>Policy {result.trace.policyVersion}</span></div></article>
    </div>
    {presented.transcriptChunks?.length ? <article className="transcript-card"><div className="detail-title"><Clock3 size={19} /><div><h3>Call timeline</h3><p>Timestamped transcript from the uploaded recording</p></div></div><div className="timeline">{presented.transcriptChunks.map((chunk) => <div key={`${chunk.timestamp[0]}-${chunk.text}`}><time>{Math.floor(chunk.timestamp[0] / 60)}:{String(Math.floor(chunk.timestamp[0] % 60)).padStart(2, '0')}</time><p>{chunk.text}</p></div>)}</div></article> : null}
    <article className="reviewed-content"><div><FileText size={18} /><span><strong>{presented.mode === 'call' ? 'Transcript reviewed' : 'Content reviewed'}</strong><small>Flagged language is highlighted</small></span><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy'}</button></div><p>{parts.map((part) => part.flagged ? <mark key={part.key}>{part.text}</mark> : <span key={part.key}>{part.text}</span>)}</p></article>
    <div className="report-actions"><button onClick={download}><Download size={17} /> Download evidence</button><button onClick={() => window.print()}><Printer size={17} /> Print or save PDF</button></div>
  </section>
}

function HistorySection({ enabled, setEnabled, history, setHistory, accountBacked = false, onClear }: { enabled: boolean; setEnabled: Dispatch<SetStateAction<boolean>>; history: SavedCheck[]; setHistory: Dispatch<SetStateAction<SavedCheck[]>>; accountBacked?: boolean; onClear?: () => void }) {
  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    window.localStorage.setItem('sabisafe-history-enabled', String(next))
  }
  const clear = () => { clearHistory(); setHistory([]); onClear?.() }
  return <section id="history" className="history-section"><div className="section-heading"><div><span className="section-kicker">{accountBacked ? 'YOUR ACCOUNT' : 'ON THIS DEVICE'}</span><h2>Recent safety checks</h2><p>{accountBacked ? 'Your checks are protected by your account and available across signed-in devices.' : 'History is off by default. Turn it on only if this is your private device.'}</p></div><button className={enabled ? 'history-toggle enabled' : 'history-toggle'} onClick={toggle} role="switch" aria-checked={enabled}><span />{enabled ? accountBacked ? 'Account sync on' : 'Saving locally' : 'History off'}</button></div>
    {!enabled ? <div className="empty-history"><History /><div><strong>Nothing is stored</strong><p>Your checks disappear when you refresh unless you enable history.</p></div></div> : history.length ? <div className="history-list">{history.map((item) => <article key={item.id}><span className={`history-score ${item.level.toLowerCase().replace(' ', '-')}`}>{item.score}</span><div><small>{item.mode} · {new Date(item.analysedAt).toLocaleDateString()}</small><strong>{item.scamType}</strong><p>{item.preview}</p></div></article>)}<button className="clear-history" onClick={clear}><Trash2 size={15} /> Clear {accountBacked ? 'account' : 'local'} history</button></div> : <div className="empty-history"><History /><div><strong>History is ready</strong><p>Your next completed check will appear here{accountBacked ? ' and sync to your account.' : ' on this device.'}</p></div></div>}
  </section>
}

function SafetyCentre({ onCheck }: { onCheck?: () => void } = {}) {
  const lessons = [
    { icon: LockKeyhole, title: 'Guard every secret', text: 'No bank or support agent should ask for your OTP, PIN, password, or card security code.' },
    { icon: Link2, title: 'Read the real domain', text: 'Logos and display names are easy to copy. Verify the actual website address before signing in.' },
    { icon: ReceiptText, title: 'Trust your own account', text: 'A screenshot is not payment. Confirm the balance or transaction inside your own bank app.' },
    { icon: PhoneCall, title: 'End pressured calls', text: 'If a caller rushes or threatens you, hang up and call the organisation on an official number.' },
  ]
  const startCheck = (event: ReactMouseEvent<HTMLAnchorElement>) => { if (onCheck) { event.preventDefault(); onCheck() } }
  return <section id="learn" className="safety-centre"><div className="section-heading"><div><span className="section-kicker">SAFETY CENTRE</span><h2>Know the pattern before it reaches you</h2><p>Four rules prevent many common social engineering attacks.</p></div><BookOpen size={30} /></div><div className="lesson-grid">{lessons.map((lesson) => <article key={lesson.title}><span><lesson.icon /></span><h3>{lesson.title}</h3><p>{lesson.text}</p><a href="#check" onClick={startCheck}>Run a check <ChevronRight size={15} /></a></article>)}</div>
    <div className="report-centre"><div><span className="section-kicker">REPORT CENTRE</span><h3>Preserve evidence before you report</h3><p>Download or print the SabiSafe analysis, keep the original message or receipt, then contact your bank or the impersonated organisation through a verified channel. SabiSafe does not submit reports on your behalf yet.</p></div><a href="#check" onClick={startCheck}>Analyse evidence <ExternalLink size={16} /></a></div>
  </section>
}

type SafetyConcern = 'general' | 'banking' | 'shopping' | 'calls' | 'jobs'

interface AppPreferences {
  language: ExplanationLanguage
  concern: SafetyConcern
  historyEnabled: boolean
}

const DEFAULT_PREFERENCES: AppPreferences = { language: 'english', concern: 'general', historyEnabled: false }
const CONCERNS: Array<{ id: SafetyConcern; label: string; icon: LucideIcon }> = [
  { id: 'general', label: 'General safety', icon: ShieldCheck },
  { id: 'banking', label: 'Banking', icon: Banknote },
  { id: 'shopping', label: 'Online shopping', icon: ReceiptText },
  { id: 'calls', label: 'Suspicious calls', icon: PhoneCall },
  { id: 'jobs', label: 'Jobs & investment', icon: Sparkles },
]

function loadPreferences(): AppPreferences {
  try {
    const saved = JSON.parse(window.localStorage.getItem('sabisafe-preferences-v1') || '') as Partial<AppPreferences>
    return { ...DEFAULT_PREFERENCES, ...saved }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

function useMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 700px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    const update = (event: MediaQueryListEvent) => setMobile(event.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return mobile
}

function OnboardingArtwork({ page }: { page: number }) {
  if (page === 1) return <div className="onboarding-art evidence-art" aria-hidden="true"><div className="mini-result"><span>Risk evidence</span><strong>92</strong><small>High risk</small></div><div className="evidence-chip one"><AlertTriangle /> Urgency</div><div className="evidence-chip two"><Link2 /> Fake domain</div><div className="evidence-chip three"><LockKeyhole /> OTP request</div></div>
  if (page === 2) return <div className="onboarding-art preference-art" aria-hidden="true"><div className="preference-phone"><span><Languages /> Your language</span><strong>English or Pidgin</strong><span><LockKeyhole /> Private by default</span></div></div>
  if (page === 3) return <div className="onboarding-art privacy-art" aria-hidden="true"><div className="privacy-shield"><LockKeyhole /><strong>Your checks stay yours</strong><span>Saved only when you choose</span></div></div>
  return <div className="onboarding-art orb-art" aria-hidden="true"><div className="glow-orb"><ShieldCheck /></div><span className="orbit-icon message"><MessageSquareText /></span><span className="orbit-icon link"><Link2 /></span><span className="orbit-icon payment"><WalletCards /></span></div>
}

function MobileOnboarding({ initialPage, initialPreferences, onComplete }: { initialPage: number; initialPreferences: AppPreferences; onComplete: (preferences: AppPreferences) => void }) {
  const [page, setPage] = useState(initialPage)
  const [preferences, setPreferences] = useState(initialPreferences)
  const copy = [
    { eyebrow: 'Welcome to SabiSafe', title: <>Check before you <em>trust</em></>, text: 'One calm place to inspect suspicious messages, screenshots, links, calls, and payment proof.' },
    { eyebrow: 'Evidence you can understand', title: <>See <em>why</em> it looks risky</>, text: 'SabiSafe highlights the tactic, shows what affected the score, and recommends a safer next step.' },
    { eyebrow: 'Make it yours', title: <>Choose your <em>guidance</em></>, text: 'Tell SabiSafe how to explain results and what kind of protection matters most to you.' },
    { eyebrow: 'Your privacy', title: <>You decide what <em>stays</em></>, text: 'Recent checks can stay on this device for easy reference. Nothing is saved unless you turn it on.' },
  ]
  const current = copy[page] ?? copy[0]!

  return <main className="onboarding-shell">
    <div className="onboarding-top"><div className="brand"><BrandMark /><span>SabiSafe</span></div>{page < 2 && <button onClick={() => onComplete(preferences)}>Skip</button>}</div>
    <div className="onboarding-content" aria-live="polite">
      <OnboardingArtwork page={page} />
      <div className="onboarding-copy"><span>{current.eyebrow}</span><h1>{current.title}</h1><p>{current.text}</p></div>
      {page === 2 && <div className="preference-form">
        <fieldset><legend>Explanation language</legend><div className="choice-row"><button className={preferences.language === 'english' ? 'selected' : ''} onClick={() => setPreferences({ ...preferences, language: 'english' })}>English</button><button className={preferences.language === 'pidgin' ? 'selected' : ''} onClick={() => setPreferences({ ...preferences, language: 'pidgin' })}>Pidgin</button></div></fieldset>
        <fieldset><legend>What do you want help with?</legend><div className="concern-grid">{CONCERNS.map((concern) => <button key={concern.id} className={preferences.concern === concern.id ? 'selected' : ''} onClick={() => setPreferences({ ...preferences, concern: concern.id })}><concern.icon />{concern.label}</button>)}</div></fieldset>
      </div>}
      {page === 3 && <div className="preference-form privacy-step">
        <span className="privacy-label">RECENT CHECKS</span>
        <button className={preferences.historyEnabled ? 'privacy-choice selected' : 'privacy-choice'} onClick={() => setPreferences({ ...preferences, historyEnabled: !preferences.historyEnabled })}><span><History /> Save recent checks on this device</span><i>{preferences.historyEnabled ? 'On' : 'Off'}</i></button>
        <p className="privacy-note"><LockKeyhole /> Your checks remain in this browser. You can disable history or clear it at any time.</p>
      </div>}
    </div>
    <div className="onboarding-footer"><div className="progress-dots" aria-label={`Step ${page + 1} of 4`}>{[0, 1, 2, 3].map((step) => <span key={step} className={step === page ? 'active' : ''} />)}</div><div className="onboarding-actions">{page > 0 && <button className="onboarding-back" aria-label="Previous step" onClick={() => setPage((value) => value - 1)}><ArrowLeft /></button>}<button className="onboarding-next border border-white/30 bg-gradient-to-br from-brand-500/95 to-brand-700/90 shadow-glass backdrop-blur-xl hover:from-brand-600 hover:to-brand-700" onClick={() => page === 3 ? onComplete(preferences) : setPage((value) => value + 1)}>{page === 3 ? 'Get started' : 'Continue'} <ArrowRight /></button></div></div>
  </main>
}

type MobileView = 'home' | 'check' | 'history' | 'learn'

function MobileNavigation({ view, onChange }: { view: MobileView; onChange: (view: MobileView) => void }) {
  const items: Array<{ id: MobileView; label: string; icon: LucideIcon }> = [
    { id: 'home', label: 'Home', icon: Home }, { id: 'check', label: 'Check', icon: Search },
    { id: 'history', label: 'History', icon: History }, { id: 'learn', label: 'Learn', icon: BookOpen },
  ]
  return <nav className="mobile-nav" aria-label="App navigation">{items.map((item) => <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => onChange(item.id)}><item.icon /><span>{item.label}</span></button>)}</nav>
}

type SyncState = 'idle' | 'syncing' | 'synced' | 'error'

function AccountSheet({ account, syncState, historyCount, onClose, onEditPreferences }: { account: AccountState; syncState: SyncState; historyCount: number; onClose: () => void; onEditPreferences: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setMessage('')
    if (!email.trim() || password.length < 8 || (mode === 'signup' && !name.trim())) {
      setMessage(mode === 'signup' ? 'Enter your name, email, and a password of at least 8 characters.' : 'Enter your email and password.')
      return
    }
    setSubmitting(true)
    const result = mode === 'login'
      ? await account.signIn(email.trim(), password)
      : await account.signUp(name.trim(), email.trim(), password)
    setMessage(result ?? '')
    setSubmitting(false)
    if (!result) setPassword('')
  }

  const displayName = String(account.user?.user_metadata.display_name || account.user?.email?.split('@')[0] || 'SabiSafe user')

  return <div className="account-overlay" role="presentation" onClick={onClose}>
    <section className="account-sheet" role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={(event) => event.stopPropagation()}>
      <div className="sheet-handle" />
      <div className="account-heading"><div><span className="section-kicker">YOUR SABISAFE ACCOUNT</span><h2 id="account-title">{account.user ? `Hi, ${displayName}` : 'Keep your safety history'}</h2><p>{account.user ? 'Your completed checks can follow you across devices.' : 'Sign in to securely sync checks. Guest mode remains private to this device.'}</p></div><button aria-label="Close account" onClick={onClose}><X /></button></div>
      {account.user ? <>
        <div className="profile-card"><span className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><small>{account.user.email}</small></div><span className={`sync-badge ${syncState}`}><Cloud size={14} />{syncState === 'syncing' ? 'Syncing' : syncState === 'error' ? 'Sync issue' : 'Synced'}</span></div>
        <div className="account-stat"><History /><span><strong>{historyCount} saved checks</strong><small>Protected by your account</small></span></div>
        <button className="account-row" onClick={() => { onClose(); onEditPreferences() }}><Settings2 /><span><strong>Preferences</strong><small>Language, safety focus, and privacy</small></span><ChevronRight /></button>
        <button className="signout-button" onClick={() => void account.signOut()}><LogOut /> Sign out</button>
      </> : !account.configured ? <div className="account-unavailable"><CloudOff /><h3>Account connection needed</h3><p>The account interface is ready. Add your Supabase URL and public anon key to enable secure sign up, login, and cross-device history.</p><code>Copy .env.example to .env</code></div> : <>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage('') }}>Log in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setMessage('') }}>Create account</button></div>
        <div className="auth-form">
          {mode === 'signup' && <label><span>Name</span><div><UserRound /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" /></div></label>}
          <label><span>Email</span><div><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></div></label>
          <label><span>Password</span><div><LockKeyhole /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" /></div></label>
          {message && <p className="auth-message">{message}</p>}
          <button className="auth-submit" disabled={submitting || account.loading} onClick={() => void submit()}>{submitting ? <LoaderCircle className="spin" /> : mode === 'login' ? <LogIn /> : <UserRound />}{mode === 'login' ? 'Log in securely' : 'Create my account'}</button>
          
          <div className="auth-divider"><span>or</span></div>
          <button className="auth-google" onClick={() => void account.signInWithGoogle()}><svg viewBox="0 0 24 24" width="18" height="18"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Continue with Google</button>

          <small className="auth-privacy"><LockKeyhole /> Authentication is secured by Supabase.</small>
        </div>
      </>}
    </section>
  </div>
}

function MobileDashboard({ account, syncState, preferences, historyEnabled, setHistoryEnabled, history, setHistory, presented, onResult, onClearResult, onClearHistory, onEditPreferences, installPrompt, onInstall }: { account: AccountState; syncState: SyncState; preferences: AppPreferences; historyEnabled: boolean; setHistoryEnabled: Dispatch<SetStateAction<boolean>>; history: SavedCheck[]; setHistory: Dispatch<SetStateAction<SavedCheck[]>>; presented: PresentedResult | null; onResult: (result: PresentedResult) => void; onClearResult: () => void; onClearHistory: () => void; onEditPreferences: () => void; installPrompt: BeforeInstallPromptEvent | null; onInstall: () => Promise<void> }) {
  const [view, setView] = useState<MobileView>('home')
  const [activeGuard, setActiveGuard] = useState<GuardKind | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const concern = CONCERNS.find((item) => item.id === preferences.concern)?.label ?? 'General safety'

  const openGuard = (guard: GuardKind) => {
    onClearResult()
    setActiveGuard(guard)
    setView('check')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const changeView = (next: MobileView) => {
    setView(next)
    if (next !== 'check') setActiveGuard(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="mobile-app" id="top">
    <header className="mobile-app-header"><div className="brand"><BrandMark /><span>SabiSafe</span></div><button className={account.user ? 'profile-button signed-in' : 'profile-button'} aria-label={account.user ? 'Open profile' : 'Sign up or log in'} onClick={() => setAccountOpen(true)}>{account.user ? String(account.user.user_metadata.display_name || account.user.email || 'S').slice(0, 1).toUpperCase() : <UserRound />}</button></header>
    <main className="mobile-app-main">
      {view === 'home' && <>
        <section className="mobile-welcome"><div><span>Your safety space</span><h1>Good to see you.</h1><p>{concern} · {preferences.language === 'pidgin' ? 'Pidgin' : 'English'} guidance</p></div><div className="small-orb"><ShieldCheck /></div></section>
        <button className="mobile-primary-card border border-white/30 bg-gradient-to-br from-brand-500/95 to-brand-700/90 shadow-glass backdrop-blur-xl" onClick={() => openGuard('message')}><span className="card-orb"><Sparkles /></span><span><small>START A NEW CHECK</small><strong>Something feels off?</strong><p>Let’s inspect it together before you act.</p></span><ArrowRight /></button>
        {installPrompt && <button className="mobile-install-card" onClick={() => void onInstall()}><Smartphone /><span><strong>Install SabiSafe</strong><small>Keep your safety tools one tap away</small></span><ChevronRight /></button>}
        <section className="mobile-guard-section"><div className="mobile-section-title"><div><span>QUICK CHECK</span><h2>What do you want to inspect?</h2></div><small>5 tools</small></div><div className="mobile-guard-grid">{GUARDS.map((guard, index) => <button key={guard.id} className={`guard-${index + 1}`} onClick={() => openGuard(guard.id)}><span><guard.icon /></span><strong>{guard.shortLabel}</strong><small>{guard.id === 'payment' ? 'Verify proof' : guard.id === 'call' ? 'Hear the tactic' : 'Check evidence'}</small></button>)}</div></section>
        <section className="mobile-recent"><div className="mobile-section-title"><div><span>{account.user ? 'YOUR ACCOUNT' : 'ON THIS DEVICE'}</span><h2>Recent checks</h2></div><button onClick={() => changeView('history')}>View all</button></div>{historyEnabled && history[0] ? <article><span className={`history-score ${history[0].level.toLowerCase().replace(' ', '-')}`}>{history[0].score}</span><div><small>{history[0].mode}</small><strong>{history[0].scamType}</strong><p>{history[0].preview}</p></div></article> : <div className="mobile-empty"><History /><span><strong>{historyEnabled ? 'Your next check will appear here' : 'History is off'}</strong><small>{historyEnabled ? account.user ? 'Synced securely to your account.' : 'Saved only on this device.' : 'Turn it on from your preferences.'}</small></span></div>}</section>
        <aside className="daily-tip"><span><BookOpen /></span><div><small>SAFETY NOTE</small><strong>A screenshot is not a payment.</strong><p>Confirm the balance inside your own bank app.</p></div></aside>
      </>}
      {view === 'check' && !activeGuard && <GuardList onSelect={openGuard} />}
      {view === 'check' && activeGuard && <div className="mobile-tool-view"><button className="mobile-back" onClick={() => { setActiveGuard(null); onClearResult() }}><ArrowLeft /> Back to tools</button><GuardWorkspace key={activeGuard} initialMode={activeGuard} mobile onResult={onResult} /><ResultView presented={presented} defaultLanguage={preferences.language} onReset={() => { onClearResult(); setActiveGuard(null) }} /></div>}
      {view === 'history' && <HistorySection enabled={historyEnabled} setEnabled={setHistoryEnabled} history={history} setHistory={setHistory} accountBacked={Boolean(account.user)} onClear={onClearHistory} />}
      {view === 'learn' && <SafetyCentre onCheck={() => openGuard('message')} />}
    </main>
    <MobileNavigation view={view} onChange={changeView} />
    {accountOpen && <AccountSheet account={account} syncState={syncState} historyCount={history.length} onClose={() => setAccountOpen(false)} onEditPreferences={onEditPreferences} />}
  </div>
}

function DesktopLanding({ onStart }: { onStart: (guard?: GuardKind) => void }) {
  return <main>
    <section className="hero"><div className="hero-copy"><span className="eyebrow"><ShieldCheck size={14} /> Built for Nigerian scam patterns</span><h1>One place to check the whole scam story</h1><p>Analyse the message, screenshot, link, call, or payment proof. SabiSafe shows the evidence, explains the tactic, and helps you choose a safer next action.</p><div className="hero-points"><span><Check /> No account required</span><span><Check /> English and Pidgin</span><span><Check /> Local-first processing</span></div><button className="hero-cta border border-white/30 bg-gradient-to-br from-brand-500/95 to-brand-700/90 shadow-glass backdrop-blur-xl hover:from-brand-600 hover:to-brand-700" onClick={() => onStart()}>Open your safety dashboard <ArrowRight size={18} /></button></div><div className="hero-visual"><div className="hero-orb"><ShieldCheck /></div><div className="signal-card main"><span><AlertTriangle /></span><small>Pattern detected</small><strong>Urgency plus OTP request</strong><p>Two tactics reinforce each other</p></div><div className="signal-card floating top"><Link2 /><span><strong>Domain mismatch</strong><small>Not the claimed bank</small></span></div><div className="signal-card floating bottom"><Languages /><span><strong>Explain am simply</strong><small>English or Pidgin</small></span></div></div></section>
    <section className="tool-strip" aria-label="Available protection tools">{GUARDS.map((guard) => <button key={guard.id} onClick={() => onStart(guard.id)}><guard.icon /><span><strong>{guard.shortLabel}</strong><small>{guard.id === 'call' ? 'Local AI transcript' : guard.id === 'payment' ? 'Receipt checks' : 'Evidence checks'}</small></span></button>)}</section>
    <SafetyCentre onCheck={() => onStart()} />
  </main>
}

function DesktopDashboard({ initialGuard, presented, onResult, onClearResult, historyEnabled, setHistoryEnabled, history, setHistory, accountBacked, onClearHistory }: { initialGuard: GuardKind; presented: PresentedResult | null; onResult: (result: PresentedResult) => void; onClearResult: () => void; historyEnabled: boolean; setHistoryEnabled: Dispatch<SetStateAction<boolean>>; history: SavedCheck[]; setHistory: Dispatch<SetStateAction<SavedCheck[]>>; accountBacked: boolean; onClearHistory: () => void }) {
  return <main className="desktop-dashboard"><section className="dashboard-welcome"><div><span className="section-kicker">YOUR SAFETY DASHBOARD</span><h1>Check it before you trust it.</h1><p>Choose a guard, review the evidence, and take a safer next step.</p></div><div className="dashboard-orb"><ShieldCheck /></div></section><GuardWorkspace key={initialGuard} initialMode={initialGuard} onResult={onResult} /><ResultView presented={presented} onReset={onClearResult} /><HistorySection enabled={historyEnabled} setEnabled={setHistoryEnabled} history={history} setHistory={setHistory} accountBacked={accountBacked} onClear={onClearHistory} /><SafetyCentre /></main>
}

export default function App() {
  const isMobile = useMobileLayout()
  const [presented, setPresented] = useState<PresentedResult | null>(null)
  const [historyEnabled, setHistoryEnabled] = useState(() => window.localStorage.getItem('sabisafe-history-enabled') === 'true')
  const [history, setHistory] = useState<SavedCheck[]>(() => loadHistory())
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadPreferences())
  const [onboardingComplete, setOnboardingComplete] = useState(() => window.localStorage.getItem('sabisafe-onboarding-v1') === 'complete')
  const [onboardingStart, setOnboardingStart] = useState(0)
  const [desktopStarted, setDesktopStarted] = useState(false)
  const [desktopGuard, setDesktopGuard] = useState<GuardKind>('message')
  const [accountOpen, setAccountOpen] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [installPrompt, install] = useInstallPrompt()
  const account = useAccount()
  const previousUser = useRef<string | null>(null)
  const userId = account.user?.id ?? null

  useEffect(() => {
    if (!userId) {
      if (previousUser.current) { clearHistory(); setHistory([]) }
      previousUser.current = null
      setSyncState('idle')
      return
    }
    previousUser.current = userId
    setHistoryEnabled(true)
    window.localStorage.setItem('sabisafe-history-enabled', 'true')
    setSyncState('syncing')
    void syncAccountHistory(userId, loadHistory())
      .then((items) => { setHistory(items); setSyncState('synced') })
      .catch(() => setSyncState('error'))
  }, [userId])

  const receiveResult = (next: PresentedResult) => {
    setPresented(next)
    if (historyEnabled) {
      const local = saveCheck(next.mode, next.analysis)
      const saved = local[0]!
      setHistory((current) => userId ? [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 50) : local)
      if (userId) {
        setSyncState('syncing')
        void saveAccountCheck(userId, saved).then(() => setSyncState('synced')).catch(() => setSyncState('error'))
      }
    }
  }
  const clearAllHistory = () => {
    clearHistory()
    setHistory([])
    if (userId) {
      setSyncState('syncing')
      void clearAccountHistory(userId).then(() => setSyncState('synced')).catch(() => setSyncState('error'))
    }
  }
  const completeOnboarding = (next: AppPreferences) => {
    setPreferences(next)
    setHistoryEnabled(next.historyEnabled)
    window.localStorage.setItem('sabisafe-preferences-v1', JSON.stringify(next))
    window.localStorage.setItem('sabisafe-history-enabled', String(next.historyEnabled))
    window.localStorage.setItem('sabisafe-onboarding-v1', 'complete')
    setOnboardingComplete(true)
    setOnboardingStart(0)
    window.scrollTo({ top: 0 })
  }
  const enterDesktop = (guard: GuardKind = 'message') => {
    setDesktopGuard(guard)
    setDesktopStarted(true)
    setPresented(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isMobile && !onboardingComplete) return <MobileOnboarding initialPage={onboardingStart} initialPreferences={preferences} onComplete={completeOnboarding} />
  if (isMobile) return <MobileDashboard account={account} syncState={syncState} preferences={preferences} historyEnabled={historyEnabled} setHistoryEnabled={setHistoryEnabled} history={history} setHistory={setHistory} presented={presented} onResult={receiveResult} onClearResult={() => setPresented(null)} onClearHistory={clearAllHistory} onEditPreferences={() => { setOnboardingStart(2); setOnboardingComplete(false) }} installPrompt={installPrompt} onInstall={install} />

  return <div id="top"><Header inDashboard={desktopStarted} onEnterApp={() => enterDesktop()} onProfile={() => setAccountOpen(true)} signedIn={Boolean(account.user)} installPrompt={installPrompt} onInstall={install} />{desktopStarted ? <DesktopDashboard initialGuard={desktopGuard} presented={presented} onResult={receiveResult} onClearResult={() => setPresented(null)} historyEnabled={historyEnabled} setHistoryEnabled={setHistoryEnabled} history={history} setHistory={setHistory} accountBacked={Boolean(account.user)} onClearHistory={clearAllHistory} /> : <DesktopLanding onStart={enterDesktop} />}{accountOpen && <AccountSheet account={account} syncState={syncState} historyCount={history.length} onClose={() => setAccountOpen(false)} onEditPreferences={() => { setOnboardingStart(2); setOnboardingComplete(false) }} />}<footer><div className="brand"><BrandMark /><span>SabiSafe</span></div><p>Safety guidance, not a guarantee. Verify unexpected requests through official channels.</p><span>© 2026 SabiSafe</span></footer></div>
}
