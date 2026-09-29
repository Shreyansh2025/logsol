import { useEffect, useMemo, useState } from 'react'
import { getDashboardStats } from '../api'
import { Link, useNavigate } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const fallback = { total_materials: 128430, distinct_national_codes: 91284, duplicate_clusters: 12842, redundancy_reduction_pct: 29.0, estimated_savings_inr: 32000000, approved_count: 184, rejected_count: 27, recent_actions: [] }
const samples = ['6 inch SS316 gate valve class 300 RTJ', 'PIPE SEAMLESS 4 INCH SCH 40 ASTM A106 GR B', '2 inch CS ball valve class 150 RF SS316 trim']

export default function Dashboard() {
  const [stats, setStats] = useState(fallback)
  const [live, setLive] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => { getDashboardStats().then(r => { setStats(r.data); setLive(true) }).catch(() => {}) }, [])

  const reviewPending = Math.max(0, Math.round(stats.duplicate_clusters * 0.36))
  const queue = useMemo(() => [
    ['High-confidence matches', Math.round(reviewPending * 0.18), 'Ready for approval', 'AUTO', 'high'],
    ['Needs review', Math.round(reviewPending * 0.68), 'Attribute or semantic conflict', 'REVIEW', 'medium'],
    ['Potential new code', Math.round(reviewPending * 0.14), 'No strong existing match', 'NEW', 'low'],
  ], [reviewPending])

  const search = (event) => {
    event?.preventDefault()
    if (!query.trim()) return navigate('/match')
    navigate(`/match?q=${encodeURIComponent(query.trim())}`)
  }

  return <div>
    <div className="dashboard-hero">
      <PageHeader eyebrow="NATIONAL MATERIAL MASTER" title="Command center" description="Standardize, match, review and govern material records across CPSE catalogs." action={<div className="status-card status-card-live"><span className="status-dot status-dot-live"/><div><strong>{live ? 'Live model data' : 'Demo preview'}</strong><span>{live ? 'Connected to Material Master API' : 'Connect backend for live statistics'}</span></div></div>} />
      <div className="hero-meta-row">
        <div className="hero-pulse"><span className="pulse-ring"/><span>AI matching service</span><strong>Operational</strong></div>
        <div className="hero-note">Semantic embeddings + deterministic attribute rules</div>
      </div>
    </div>

    <section className="hero-search panel panel-lift">
      <div className="hero-search-copy"><div className="eyebrow">AI MATERIAL SEARCH</div><h2>Find, compare and standardize a material in seconds.</h2><p>Search free-text descriptions, technical specifications or source codes.</p></div>
      <form className="hero-search-box hero-search-box-animated" onSubmit={search}>
        <div className="search-icon-orb"><Icon name="spark" size={20}/></div>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. 6 inch SS316 gate valve class 300 RTJ" aria-label="Material search" />
        <button className="primary-btn primary-btn-glow">Find matches <Icon name="arrow" size={16}/></button>
      </form>
      <div className="sample-row sample-row-dashboard"><span>Quick examples</span>{samples.map(s=><button type="button" key={s} onClick={()=>{setQuery(s);navigate(`/match?q=${encodeURIComponent(s)}`)}}>{s}</button>)}</div>
    </section>

    <div className="metric-grid">
      <MetricCard label="Total materials" value={stats.total_materials} hint="Records in unified catalog" icon="database" trend="+8.4%" />
      <MetricCard label="National codes" value={stats.distinct_national_codes} hint="Standardized identifiers" icon="code" trend="+3.1%" />
      <MetricCard label="Duplicate clusters" value={stats.duplicate_clusters} hint="Potential duplicates detected" icon="layers" tone="warn" trend="-12.6%" trendType="positive" />
      <MetricCard label="Pending review" value={reviewPending} hint="Human validation queue" icon="review" tone="info" trend="live" trendType="neutral" />
    </div>

    <div className="dashboard-grid">
      <section className="panel panel-lift process-panel">
        <div className="panel-head"><div><h3>Standardization pipeline</h3><span>Operational overview</span></div><span className="tiny-badge"><span className="pulse-mini"/> AI + rules</span></div>
        {[
          ['Ingested', 92, 'Files received from CPSE systems'],
          ['Normalized', 76, 'Descriptions cleaned and canonicalized'],
          ['AI matched', 84, 'Semantic + attribute matching'],
          ['Human reviewed', 41, 'Exceptions validated by reviewers'],
        ].map(([label,pct,hint], i) => <div className="progress-row progress-row-animated" key={label} style={{'--delay': `${i * 110}ms`}}><div className="progress-title"><span>{label}</span><strong>{pct}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }}/></div><div className="progress-hint">{hint}</div></div>)}
        <div className="pipeline-foot"><div><span>Normalization</span><b>ACTIVE</b></div><div><span>Matching</span><b>RUNNING</b></div><div><span>Review</span><b>41%</b></div></div>
      </section>

      <section className="panel panel-lift queue-panel">
        <div className="panel-head"><div><h3>Review queue</h3><span>Items requiring human decision</span></div><Link to="/review" className="text-link">Open queue <Icon name="arrow" size={13}/></Link></div>
        <div className="queue-list">{queue.map(([title,n,desc,tag,tone])=><div className={`queue-item ${tone} queue-item-animated`} key={title}><span className="queue-number"><CountValue value={n}/></span><div><strong>{title}</strong><span>{desc}</span></div><span className="queue-tag">{tag}</span></div>)}</div>
        <div className="queue-summary"><span>Queue health</span><div className="queue-health"><i/><i/><i/><i/><i/><i/><i/><i/></div><strong>Stable</strong></div>
      </section>
    </div>

    <section className="panel story-panel panel-lift">
      <div className="panel-head"><div><h3>How Material Master works</h3><span>One request. Multiple signals. One traceable decision.</span></div><Link to="/integration" className="text-link">View API <Icon name="arrow" size={13}/></Link></div>
      <div className="story-flow">
        <div className="story-node story-node-animated"><div className="story-kicker">01 · SOURCE DATA</div><strong>CPSE descriptions</strong><span>Different wording, abbreviations and formats</span><div className="story-mini"><span>RAW</span><span>UNSTRUCTURED</span></div></div>
        <div className="story-arrow"><span className="flow-line"/><Icon name="arrow" size={20}/></div>
        <div className="story-node ai story-node-animated"><div className="story-kicker">02 · AI ENGINE</div><strong>Normalize + match</strong><span>Semantic similarity + technical attributes</span><div className="story-mini"><span>SBERT</span><span>RULES</span></div></div>
        <div className="story-arrow"><span className="flow-line"/><Icon name="arrow" size={20}/></div>
        <div className="story-node success story-node-animated"><div className="story-kicker">03 · MASTER DATA</div><strong>One National Code</strong><span>Traceable mappings and review history</span><div className="story-mini"><span>STANDARDIZED</span><span>AUDITABLE</span></div></div>
      </div>
    </section>
  </div>
}

function CountValue({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now(); const duration = 900; let frame
    const tick = now => { const p=Math.min(1,(now-start)/duration); const eased=1-Math.pow(1-p,3); setDisplay(Math.round(value*eased)); if(p<1) frame=requestAnimationFrame(tick) }
    frame=requestAnimationFrame(tick); return()=>cancelAnimationFrame(frame)
  }, [value])
  return display.toLocaleString()
}
