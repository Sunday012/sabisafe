// LearnSection: blog-style safety education
// Rendered into mobile Learn tab and desktop SafetyCentre replacement
import { useEffect, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check,
  ChevronRight, Clock, ExternalLink, Filter,
  LockKeyhole, Link2, PhoneCall,
  ReceiptText, Share2, ShieldCheck, WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { articles, getArticleBySlug, getRelatedArticles } from './data/articles'
import type { Article, ArticleCategory, Block } from './data/articles'

// ── Category colours ────────────────────────────────────────────
const CATEGORY_META: Record<ArticleCategory, { colour: string; bg: string; icon: LucideIcon }> = {
  'Scams 101':   { colour: '#b53f5c', bg: '#ffe8ef', icon: AlertTriangle },
  'Banking':     { colour: '#1a5fa8', bg: '#e8f1ff', icon: ReceiptText },
  'Links':       { colour: '#5543b8', bg: '#eeeaff', icon: Link2 },
  'Jobs & Money':{ colour: '#b07d15', bg: '#fff5d6', icon: WalletCards },
  'Recovery':    { colour: '#1a8558', bg: '#e6f5ee', icon: ShieldCheck },
}

const TOOL_LABELS: Record<string, string> = {
  message: 'Message Guard',
  screenshot: 'Screenshot Guard',
  link: 'Link Guard',
  call: 'Call Guard',
  payment: 'Payment Guard',
}

const CATEGORIES: ArticleCategory[] = ['Scams 101', 'Banking', 'Links', 'Jobs & Money', 'Recovery']

// ── Reading progress bar ─────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrolled = el.scrollTop || document.body.scrollTop
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  return (
    <div className="article-progress-track" aria-hidden="true">
      <div className="article-progress-fill" style={{ width: progress + '%' }} />
    </div>
  )
}

// ── Block renderer ───────────────────────────────────────────────
function BlockRenderer({ block }: { block: Block }) {
  if (block.type === 'heading')
    return <h2 className="article-h2">{block.text}</h2>
  if (block.type === 'paragraph')
    return <p className="article-p">{block.text}</p>
  if (block.type === 'list')
    return (
      <ul className="article-list">
        {block.items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    )
  if (block.type === 'callout') {
    const icons = {
      'red-flag':  <AlertTriangle size={16} />,
      'what-to-do': <ShieldCheck size={16} />,
      'tip':       <LockKeyhole size={16} />,
    }
    return (
      <div className={'article-callout callout-' + block.variant}>
        <div className="callout-header">
          {icons[block.variant]}
          <strong>{block.title}</strong>
        </div>
        <p>{block.text}</p>
      </div>
    )
  }
  return null
}

// ── Article view ─────────────────────────────────────────────────
export interface ArticleViewProps {
  slug: string
  onBack: () => void
  onOpenTool: (tool: string) => void
}

export function ArticleView({ slug, onBack, onOpenTool }: ArticleViewProps) {
  const article = getArticleBySlug(slug)
  const related = getRelatedArticles(slug)
  const [pidginOpen, setPidginOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const meta = article ? CATEGORY_META[article.category] : null

  useEffect(() => {
    window.scrollTo(0, 0)
    const prevTitle = document.title
    if (article) {
      document.title = `${article.title} — SabiSafe`
    } else {
      document.title = 'Article Not Found — SabiSafe'
    }
    return () => {
      document.title = prevTitle
    }
  }, [slug, article])

  const share = async () => {
    const url = window.location.href.split('#')[0] + '#/learn/' + slug
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title, url })
        return
      } catch { /* cancelled */ }
    }
    await navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (!article || !meta) {
    return (
      <main className="article-page-wrap">
        <div className="learn-not-found">
          <ShieldCheck size={48} />
          <h2>Article not found</h2>
          <p>The safety guide you are looking for doesn't exist or has been moved.</p>
          <button className="article-back" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Safety Centre
          </button>
        </div>
      </main>
    )
  }

  const CatIcon = meta.icon

  return (
    <main className="article-page-wrap">
      <article className="article-view">
        <ReadingProgressBar />

        {/* Breadcrumbs */}
        <nav className="article-breadcrumbs" aria-label="Breadcrumb">
          <button className="breadcrumb-link" onClick={onBack}>
            Safety centre
          </button>
          <ChevronRight size={13} className="breadcrumb-sep" />
          <span className="breadcrumb-cat">{article.category}</span>
          <ChevronRight size={13} className="breadcrumb-sep" />
          <span className="breadcrumb-current">{article.title}</span>
        </nav>

        {/* Header actions */}
        <header className="article-header">
          <button className="article-back" onClick={onBack} aria-label="Back to Safety Centre">
            <ArrowLeft size={16} /> Back to Safety Centre
          </button>
          <button className="article-share" onClick={() => void share()}>
            {copied ? <><Check size={15} /> Copied</> : <><Share2 size={15} /> Share</>}
          </button>
        </header>

        {/* Article hero (sitting directly on page, no big bordered box) */}
        <div className="article-hero">
          <div className="article-cat-tag" style={{ color: meta.colour, background: meta.bg }}>
            <CatIcon size={12} />
            {article.category}
          </div>
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span><Clock size={13} /> {article.readMinutes} min read</span>
            <span>{new Date(article.publishedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <button
            className={'pidgin-toggle' + (pidginOpen ? ' open' : '')}
            onClick={() => setPidginOpen((v) => !v)}
            aria-expanded={pidginOpen}
          >
            <span>Short version in Pidgin</span>
            <ChevronRight size={15} className="pidgin-chevron" />
          </button>
          {pidginOpen && (
            <div className="pidgin-box">
              <p>{article.pidginSummary}</p>
            </div>
          )}
        </div>

        {/* Article body */}
        <div className="article-body">
          {article.body.map((block, i) => <BlockRenderer key={i} block={block} />)}
        </div>

        {/* Try it yourself */}
        <div className="article-try-card">
          <span className="try-icon"><ShieldCheck size={22} /></span>
          <div>
            <strong>Try it yourself</strong>
            <p>Paste a real example into SabiSafe and see the evidence analysis in seconds.</p>
          </div>
          <button className="try-btn" onClick={() => onOpenTool(article.relatedTool)}>
            Open {TOOL_LABELS[article.relatedTool]} <ArrowRight size={15} />
          </button>
        </div>

        {/* Read next */}
        {related.length > 0 && (
          <div className="article-read-next">
            <h3>Read next</h3>
            <div className="read-next-grid">
              {related.map((rel) => {
                const rm = CATEGORY_META[rel.category]
                const RI = rm.icon
                return (
                  <button key={rel.slug} className="read-next-card" onClick={() => {
                    window.location.hash = '/learn/' + rel.slug
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}>
                    <div className="rnc-cat" style={{ color: rm.colour, background: rm.bg }}>
                      <RI size={11} /> {rel.category}
                    </div>
                    <strong>{rel.title}</strong>
                    <span><Clock size={11} /> {rel.readMinutes} min</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </article>
    </main>
  )
}

// ── Article card ─────────────────────────────────────────────────
function ArticleCard({ article, featured = false, onClick }: { article: Article; featured?: boolean; onClick: () => void }) {
  const meta = CATEGORY_META[article.category]
  const CatIcon = meta.icon
  return (
    <button
      className={'article-card' + (featured ? ' article-card-featured' : '')}
      onClick={onClick}
    >
      <div className="ac-cat-tag" style={{ color: meta.colour, background: meta.bg }}>
        <CatIcon size={11} /> {article.category}
      </div>
      <h3 className="ac-title">{article.title}</h3>
      <p className="ac-excerpt">{article.excerpt}</p>
      <div className="ac-footer">
        <span className="ac-footer-left"><Clock size={12} /> {article.readMinutes} min read</span>
        <ChevronRight size={14} />
      </div>
    </button>
  )
}

// ── Quick rules strip ────────────────────────────────────────────
function QuickRules({ onCheck }: { onCheck?: () => void }) {
  const rules = [
    { icon: LockKeyhole, text: 'Never share your OTP, PIN, or password with anyone' },
    { icon: Link2,       text: 'Check the real domain before typing credentials' },
    { icon: ReceiptText, text: 'Screenshots are not payments — verify in your app' },
    { icon: PhoneCall,   text: 'Hang up on pressure calls; call back on official numbers' },
  ]
  return (
    <div className="quick-rules">
      <div className="qr-header">
        <span>QUICK RULES</span>
        {onCheck && (
          <button className="qr-check-btn" onClick={onCheck}>
            Run a check <ExternalLink size={12} />
          </button>
        )}
      </div>
      <div className="qr-strip">
        {rules.map((r) => {
          const Icon = r.icon
          return (
            <div key={r.text} className="qr-item">
              <span className="qr-icon"><Icon size={15} /></span>
              <span>{r.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Learn list view ──────────────────────────────────────────────
interface LearnListProps {
  onOpenArticle: (slug: string) => void
  onCheck?: () => void
}

function LearnList({ onOpenArticle, onCheck }: LearnListProps) {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory | null>(null)
  const filtered = activeCategory ? articles.filter((a) => a.category === activeCategory) : articles
  const [featured, ...rest] = filtered

  return (
    <div className="learn-section">
      <div className="learn-header">
        <div>
          <span className="learn-kicker">SAFETY CENTRE</span>
          <h2 className="learn-title">Know the pattern before it reaches you</h2>
          <p className="learn-subtitle">8 guides on the scams most likely to target you in Nigeria.</p>
        </div>
        <div className="learn-header-tile">
          <BookOpen size={26} className="learn-header-icon" />
        </div>
      </div>

      <QuickRules onCheck={onCheck} />

      {/* Category chips */}
      <div className="learn-filters" role="group" aria-label="Filter by category">
        <button
          className={'learn-chip' + (!activeCategory ? ' active' : '')}
          onClick={() => setActiveCategory(null)}
        >
          <Filter size={12} /> All
        </button>
        {CATEGORIES.map((cat) => {
          const m = CATEGORY_META[cat]
          const CI = m.icon
          return (
            <button
              key={cat}
              className={'learn-chip' + (activeCategory === cat ? ' active' : '')}
              style={activeCategory === cat ? { background: m.bg, color: m.colour, borderColor: m.colour + '40' } : {}}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            >
              <CI size={12} /> {cat}
            </button>
          )
        })}
      </div>

      {/* Article grid */}
      <div className="learn-grid">
        {featured && (
          <ArticleCard article={featured} featured onClick={() => onOpenArticle(featured.slug)} />
        )}
        {rest.map((article) => (
          <ArticleCard key={article.slug} article={article} onClick={() => onOpenArticle(article.slug)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="learn-empty">
          <BookOpen size={32} />
          <strong>No articles in this category yet</strong>
        </div>
      )}

      {/* Report centre */}
      <div className="report-centre">
        <div>
          <span className="section-kicker">REPORT CENTRE</span>
          <h3>Preserve evidence before you report</h3>
          <p>Download or print the SabiSafe analysis, keep the original message or receipt, then contact your bank or the impersonated organisation through a verified channel.</p>
        </div>
        <button className="report-centre-btn" onClick={onCheck}>
          Analyse evidence <ExternalLink size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Main export ─────────────────────────────────────────────────
export interface LearnSectionProps {
  onOpenTool?: (tool: string) => void
  onCheck?: () => void
}

export function LearnSection({ onCheck }: LearnSectionProps) {
  const openArticle = (slug: string) => {
    window.location.hash = '/learn/' + slug
  }

  return (
    <LearnList
      onOpenArticle={openArticle}
      onCheck={onCheck}
    />
  )
}

export default LearnSection
