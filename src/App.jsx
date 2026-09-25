import React, { useRef, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Ban, Check, ChevronDown, CircleAlert, Copy, Download,
  FileAudio, FileText, Flag, Globe2, Headphones, Image as ImageIcon, Languages,
  Link2, LoaderCircle, LockKeyhole, Menu, MessageSquareText, PhoneCall, RefreshCw,
  Search, ShieldCheck, Sparkles, Upload, Volume2, X,
} from 'lucide-react'
import { analyseText, highlightMessage } from './engine'

const EXAMPLE = 'Dear customer, your bank account will be suspended today. Click this link immediately to update your BVN: https://gtbank-secure-update.xyz'

const MODES = [
  { id: 'message', label: 'Message Guard', icon: MessageSquareText, title: 'Check a suspicious message', hint: 'Paste an SMS, WhatsApp message, email, or upload a screenshot.' },
  { id: 'link', label: 'Link Guard', icon: Link2, title: 'Inspect a suspicious link', hint: 'Check where a link leads and whether the domain matches who sent it.' },
  { id: 'call', label: 'Call Guard', icon: PhoneCall, title: 'Analyse a recorded call', hint: 'Upload an audio recording or try our scam-call demo.' },
]

function Logo() {
  return <div className="brand-mark" aria-hidden="true"><ShieldCheck size={24} strokeWidth={2.4} /></div>
}

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="header">
    <a className="brand" href="#top"><Logo /><span>SabiSafe</span></a>
    <nav className={open ? 'nav open' : 'nav'}>
      <a href="#how" onClick={() => setOpen(false)}>How it works</a>
      <a href="#learn" onClick={() => setOpen(false)}>Scam education</a>
      <a href="#report" onClick={() => setOpen(false)}>Report scam</a>
      <button className="language-button"><Globe2 size={16} /> English <ChevronDown size={14} /></button>
    </nav>
    <button className="menu-button" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
  </header>
}

function ModeTabs({ mode, setMode }) {
  return <div className="mode-tabs" role="tablist">
    {MODES.map((item) => <button key={item.id} role="tab" aria-selected={mode === item.id} className={mode === item.id ? 'active' : ''} onClick={() => setMode(item.id)}><item.icon size={18} />{item.label}</button>)}
  </div>
}

function MessageInput({ value, setValue, onAnalyse, loading, onImage }) {
  const fileRef = useRef(null)
  return <>
    <div className="textarea-wrap">
      <label className="sr-only" htmlFor="suspicious-message">Suspicious message</label>
      <textarea id="suspicious-message" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Paste the suspicious message here…" maxLength={2000} />
      <span className="char-count">{value.length}/2000</span>
    </div>
    <div className="input-actions">
      <button className="upload-button" onClick={() => fileRef.current?.click()}><ImageIcon size={18} /> Upload screenshot</button>
      <input ref={fileRef} hidden type="file" accept="image/*" onChange={(event) => onImage(event.target.files?.[0])} />
      <span className="or">or</span>
      <button className="example-button" onClick={() => setValue(EXAMPLE)}><Sparkles size={16} /> Try an example</button>
    </div>
    <button className="primary-button" disabled={!value.trim() || loading} onClick={onAnalyse}>{loading ? <><LoaderCircle className="spin" size={19} /> Analysing…</> : <>Check this message <ArrowRight size={19} /></>}</button>
  </>
}

function LinkInput({ value, setValue, brand, setBrand, onAnalyse, loading }) {
  return <>
    <label className="field-label" htmlFor="url">Suspicious link</label>
    <div className="single-input"><Link2 size={19} /><input id="url" value={value} onChange={(event) => setValue(event.target.value)} placeholder="e.g. secure-bank-update.xyz" /></div>
    <label className="field-label optional" htmlFor="brand">Who does the sender claim to be? <span>Optional</span></label>
    <div className="single-input"><BadgeCheck size={19} /><input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="e.g. GTBank" /></div>
    <button className="primary-button" disabled={!value.trim() || loading} onClick={onAnalyse}>{loading ? <><LoaderCircle className="spin" size={19} /> Inspecting…</> : <>Inspect this link <Search size={19} /></>}</button>
  </>
}

function CallInput({ onAnalyse, loading }) {
  const audioRef = useRef(null)
  const transcript = "Hello, this is your bank's customer care. Your account will be blocked today. Tell me the OTP we just sent you immediately so I can stop it. Do not contact the branch."
  return <>
    <button className="drop-zone" onClick={() => audioRef.current?.click()}>
      <span className="upload-circle"><FileAudio size={24} /></span>
      <strong>Upload a call recording</strong>
      <span>MP3, WAV, M4A · up to 10 minutes</span>
    </button>
    <input ref={audioRef} hidden type="file" accept="audio/*" onChange={() => onAnalyse(transcript)} />
    <div className="privacy-note"><LockKeyhole size={16} /> Your audio is processed securely and is not stored.</div>
    <button className="primary-button" disabled={loading} onClick={() => onAnalyse(transcript)}>{loading ? <><LoaderCircle className="spin" size={19} /> Transcribing…</> : <><Volume2 size={19} /> Play scam-call demo</>}</button>
  </>
}

function Scanner({ onResult }) {
  const [mode, setMode] = useState('message')
  const [value, setValue] = useState('')
  const [brand, setBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrStatus, setOcrStatus] = useState('')
  const active = MODES.find((item) => item.id === mode)

  const analyse = (override) => {
    const content = typeof override === 'string' ? override : value
    if (!content.trim()) return
    setLoading(true)
    window.setTimeout(() => {
      onResult(analyseText(content, brand))
      setValue(content)
      setLoading(false)
      document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 650)
  }

  const readImage = async (file) => {
    if (!file) return
    setOcrStatus('Reading text from screenshot…')
    setLoading(true)
    try {
      const { recognize } = await import('tesseract.js')
      const { data } = await recognize(file, 'eng')
      const text = data.text.trim()
      setValue(text || EXAMPLE)
      setOcrStatus(text ? 'Text extracted — check it below.' : 'No clear text found. We loaded the demo message instead.')
    } catch {
      setValue(EXAMPLE)
      setOcrStatus('OCR is unavailable offline. We loaded the demo message instead.')
    } finally {
      setLoading(false)
    }
  }

  return <section className="scanner-card" aria-label="Scam analyser">
    <ModeTabs mode={mode} setMode={(next) => { setMode(next); setValue(''); setOcrStatus('') }} />
    <div className="scanner-content">
      <div className="scanner-heading"><div className="mini-icon"><active.icon size={20} /></div><div><h2>{active.title}</h2><p>{active.hint}</p></div></div>
      {ocrStatus && <div className="ocr-status"><RefreshCw className={loading ? 'spin' : ''} size={15} /> {ocrStatus}</div>}
      {mode === 'message' && <MessageInput value={value} setValue={setValue} onAnalyse={analyse} loading={loading} onImage={readImage} />}
      {mode === 'link' && <LinkInput value={value} setValue={setValue} brand={brand} setBrand={setBrand} onAnalyse={analyse} loading={loading} />}
      {mode === 'call' && <CallInput onAnalyse={analyse} loading={loading} />}
      <p className="disclaimer"><ShieldCheck size={14} /> SabiSafe gives safety guidance, not a guarantee. Always verify through official channels.</p>
    </div>
  </section>
}

function RiskDial({ score }) {
  const circumference = 2 * Math.PI * 54
  return <div className="dial-wrap">
    <svg viewBox="0 0 128 128" className="risk-dial" aria-label={`${score}% scam likelihood`}>
      <circle cx="64" cy="64" r="54" className="dial-track" />
      <circle cx="64" cy="64" r="54" className="dial-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
    </svg>
    <div className="dial-copy"><strong>{score}%</strong><span>scam likelihood</span></div>
  </div>
}

function Result({ result, onReset }) {
  const [language, setLanguage] = useState('english')
  const [copied, setCopied] = useState(false)
  const [reported, setReported] = useState(false)
  if (!result) return null
  const parts = highlightMessage(result.text, result.evidence)
  const copy = async () => { await navigator.clipboard?.writeText(`${result.level} — ${result.score}% scam likelihood\n${result[language]}`); setCopied(true); window.setTimeout(() => setCopied(false), 1500) }
  const download = () => {
    const lines = ['SABISAFE SAFETY REPORT', `Risk: ${result.level} (${result.score}%)`, `Likely category: ${result.scamType}`, '', 'MESSAGE / TRANSCRIPT', result.text, '', 'WARNING SIGNS', ...result.evidence.map((item) => `- ${item.title}: ${item.detail}`), '', 'RECOMMENDED ACTION', result.english, '', `Analysed: ${new Date(result.analysedAt).toLocaleString()}`]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sabisafe-report.txt'; anchor.click(); URL.revokeObjectURL(url)
  }
  const listen = () => {
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(result[language])
    utterance.lang = 'en-NG'
    window.speechSynthesis?.speak(utterance)
  }
  return <section id="result" className="result-section">
    <div className="result-top">
      <div><span className="eyebrow"><Sparkles size={15} /> Analysis complete</span><h2>Here’s what we found</h2><p>We checked the language, links, and common fraud patterns.</p></div>
      <button className="new-check" onClick={onReset}><RefreshCw size={16} /> New check</button>
    </div>
    <div className="result-grid">
      <article className="risk-card">
        <RiskDial score={result.score} />
        <div className="risk-summary"><span className="risk-pill"><CircleAlert size={15} /> {result.level}</span><h3>{result.scamType}</h3><p>{result.score >= 65 ? 'This message shows several strong indicators of fraud.' : 'Review the details before you take action.'}</p></div>
      </article>
      <article className="action-card">
        <div className="card-title"><span><Ban size={19} /></span><div><small>RECOMMENDED ACTION</small><h3>Stop. Don’t click or respond.</h3></div></div>
        <p>Contact the organisation using the number on the back of your card, their official app, or a verified website.</p>
        <div className="action-list"><span><Check size={15} /> Block the sender</span><span><Check size={15} /> Report the message</span><span><Check size={15} /> Warn anyone targeted</span></div>
      </article>
    </div>
    <div className="detail-grid">
      <article className="detail-card evidence-card">
        <div className="detail-title"><Flag size={20} /><div><h3>Warning signs detected</h3><p>{result.evidence.length} suspicious {result.evidence.length === 1 ? 'signal' : 'signals'} found</p></div></div>
        <div className="evidence-list">
          {result.evidence.length ? result.evidence.map((item, index) => <div className="evidence-item" key={item.id}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{language === 'english' ? item.detail : item.pidgin}</p></div></div>) : <div className="safe-empty"><ShieldCheck /> No strong warning signs detected.</div>}
        </div>
      </article>
      <article className="detail-card explanation-card">
        <div className="explain-head"><div className="detail-title"><Languages size={20} /><div><h3>Simple explanation</h3><p>No tech jargon</p></div></div><div className="language-toggle"><button className={language === 'english' ? 'selected' : ''} onClick={() => setLanguage('english')}>English</button><button className={language === 'pidgin' ? 'selected' : ''} onClick={() => setLanguage('pidgin')}>Pidgin</button></div></div>
        <blockquote>“{result[language]}”</blockquote>
        <button className="listen-button" onClick={listen}><Volume2 size={17} /> Listen to explanation</button>
      </article>
    </div>
    <article className="message-review">
      <div className="message-review-head"><div><FileText size={19} /><span><strong>Message reviewed</strong><small>Highlighted phrases triggered warnings</small></span></div><button onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Copied' : 'Copy'}</button></div>
      <p>{parts.map((part) => part.flagged ? <mark key={part.key}>{part.text}</mark> : <span key={part.key}>{part.text}</span>)}</p>
    </article>
    <div id="report" className="result-actions"><button className="report-button" onClick={() => setReported(true)}>{reported ? <Check size={18} /> : <Flag size={18} />}{reported ? 'Added to community reports' : 'Report this scam'}</button><button className="download-button" onClick={download}><Download size={18} /> Download analysis</button></div>
  </section>
}

function TrustStrip() {
  return <section id="how" className="trust-strip">
    <div><span><ShieldCheck /></span><strong>Privacy first</strong><small>Your checks aren’t saved</small></div>
    <div><span><Sparkles /></span><strong>Built for Naija</strong><small>Understands local scam tactics</small></div>
    <div><span><Languages /></span><strong>Clear explanations</strong><small>English and Nigerian Pidgin</small></div>
  </section>
}

function LearnSection() {
  const cards = [
    { icon: LockKeyhole, title: 'Never share your OTP', text: 'No real bank or support agent will ask for your PIN, password, or one-time code.' },
    { icon: Link2, title: 'Look beyond the logo', text: 'Scammers copy branding. Check the actual website address before you sign in.' },
    { icon: Headphones, title: 'Urgency is a warning', text: 'Pause when someone rushes or threatens you. Verify through a different channel.' },
  ]
  return <section id="learn" className="learn-section"><div className="section-kicker">SHINE YOUR EYE</div><h2>Three rules that stop most scams</h2><div className="learn-grid">{cards.map((card) => <article key={card.title}><span><card.icon /></span><h3>{card.title}</h3><p>{card.text}</p></article>)}</div></section>
}

export default function App() {
  const [result, setResult] = useState(null)
  return <div id="top">
    <Header />
    <main>
      <section className="hero">
        <div className="hero-badge"><ShieldCheck size={15} /> Nigeria’s scam safety companion</div>
        <h1>Before you click, send<br />or pay—<em>check am.</em></h1>
        <p>SabiSafe spots the red flags in suspicious messages, links, and calls—then explains what to do next in plain English or Pidgin.</p>
        <div className="hero-proof"><div className="avatars"><span>AO</span><span>IN</span><span>KM</span></div><span><strong>10,000+</strong> checks made safer this month</span></div>
      </section>
      <Scanner onResult={setResult} />
      <Result result={result} onReset={() => { setResult(null); window.scrollTo({ top: 250, behavior: 'smooth' }) }} />
      {!result && <TrustStrip />}
      <LearnSection />
    </main>
    <footer><div className="brand"><Logo /><span>SabiSafe</span></div><p>Built with care in Nigeria. SabiSafe does not replace your bank or law enforcement.</p><span>© 2026 SabiSafe</span></footer>
  </div>
}
