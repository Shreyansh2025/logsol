import { useEffect, useState } from 'react'
import { getDashboardStats } from '../api'
import { Link } from 'react-router-dom'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const fallback = { total_materials: 128430, distinct_national_codes: 91284, duplicate_clusters: 12842, redundancy_reduction_pct: 29.0, estimated_savings_inr: 32000000, approved_count: 184, rejected_count: 27, recent_actions: [] }
export default function Dashboard() {
  const [stats, setStats] = useState(fallback)
  const [live, setLive] = useState(false)
  useEffect(() => { getDashboardStats().then(r => { setStats(r.data); setLive(true) }).catch(() => {}) }, [])
  const reviewPending = Math.max(0, Math.round(stats.duplicate_clusters * 0.36))
  return <div>
    <PageHeader eyebrow="NATIONAL MATERIAL MASTER" title="Command center" description="Standardize, match, review and govern material records across CPSE catalogs." action={<div className="status-card"><span className="status-dot"/><div><strong>{live ? 'Live model data' : 'Demo preview'}</strong><span>{live ? 'Connected to Material Master API' : 'Connect backend for live statistics'}</span></div></div>} />
    <div className="hero-search panel">
      <div><div className="eyebrow">AI MATERIAL SEARCH</div><h2>Find, compare and standardize a material in seconds.</h2><p>Search by free-text description, source code or technical specification.</p></div>
      <div className="hero-search-box"><Icon name="search" size={20}/><input placeholder="e.g. 6 inch SS316 gate valve class 300 RTJ"/><button className="primary-btn">Find matches <Icon name="arrow" size={16}/></button></div>
    </div>
    <div className="metric-grid">
      <MetricCard label="Total materials" value={stats.total_materials.toLocaleString()} hint="Records in unified catalog" icon="database" />
      <MetricCard label="National codes" value={stats.distinct_national_codes.toLocaleString()} hint="Standardized identifiers" icon="code" />
      <MetricCard label="Duplicate clusters" value={stats.duplicate_clusters.toLocaleString()} hint="Potential duplicates detected" icon="layers" tone="warn" />
      <MetricCard label="Pending review" value={reviewPending.toLocaleString()} hint="Human validation queue" icon="review" tone="info" />
    </div>
    <div className="dashboard-grid">
      <section className="panel process-panel"><div className="panel-head"><div><h3>Standardization pipeline</h3><span>Operational overview</span></div><span className="tiny-badge">AI + rules</span></div>
        {[
          ['Ingested', 92, 'Files received from CPSE systems'],
          ['Normalized', 76, 'Descriptions cleaned and canonicalized'],
          ['AI matched', 84, 'Semantic + attribute matching'],
          ['Human reviewed', 41, 'Exceptions validated by reviewers'],
        ].map(([label, pct, hint]) => <div className="progress-row" key={label}><div className="progress-title"><span>{label}</span><strong>{pct}%</strong></div><div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }}/></div><div className="progress-hint">{hint}</div></div>)}
      </section>
      <section className="panel queue-panel"><div className="panel-head"><div><h3>Review queue</h3><span>Items requiring human decision</span></div><Link to="/review" className="text-link">Open queue <Icon name="arrow" size={13}/></Link></div>
        <div className="queue-list"><div className="queue-item high"><span className="queue-number">{Math.round(reviewPending * 0.18)}</span><div><strong>High-confidence matches</strong><span>Ready for approval</span></div><span className="queue-tag">AUTO</span></div><div className="queue-item medium"><span className="queue-number">{Math.round(reviewPending * 0.68)}</span><div><strong>Needs review</strong><span>Attribute or semantic conflict</span></div><span className="queue-tag">REVIEW</span></div><div className="queue-item low"><span className="queue-number">{Math.round(reviewPending * 0.14)}</span><div><strong>Potential new code</strong><span>No strong existing match</span></div><span className="queue-tag">NEW</span></div></div>
      </section>
    </div>
    <section className="panel story-panel"><div className="panel-head"><div><h3>Before → AI → After</h3><span>The core transformation this platform demonstrates</span></div></div><div className="story-flow"><div className="story-node"><div className="story-kicker">BEFORE</div><strong>CPSE descriptions</strong><span>Different wording, abbreviations and formats</span></div><div className="story-arrow"><Icon name="arrow" size={20}/></div><div className="story-node ai"><div className="story-kicker">AI ENGINE</div><strong>Normalize + match</strong><span>Semantic similarity + technical attributes</span></div><div className="story-arrow"><Icon name="arrow" size={20}/></div><div className="story-node success"><div className="story-kicker">AFTER</div><strong>One National Code</strong><span>Traceable CPSE mappings and review history</span></div></div></section>
  </div>
}
