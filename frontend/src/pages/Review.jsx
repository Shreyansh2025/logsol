import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCatalog, explainMatch, sendFeedback } from '../api'
import ExplainPanel from '../components/ExplainPanel'
import PageHeader from '../components/PageHeader'
import ScoreBadge from '../components/ScoreBadge'
import Icon from '../components/Icon'

const PENDING_KEY = 'material_master_pending_review'
const REVIEWED_KEY = 'material_master_reviewed_items'

const readReviewed = () => {
  try { return JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]') } catch { return [] }
}

export default function Review() {
  const [rows, setRows] = useState([])
  const [explanation, setExplanation] = useState(null)
  const [filter, setFilter] = useState('clusters')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)
  const [reviewAction, setReviewAction] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [reviewedIds, setReviewedIds] = useState(readReviewed)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = () => {
      try { setPending(JSON.parse(localStorage.getItem(PENDING_KEY) || 'null')) } catch { setPending(null) }
    }
    load()
    getCatalog(300, 0).then((r) => setRows(r.data.rows)).catch(() => setRows([])).finally(() => setLoading(false))
    const onPending = () => load()
    window.addEventListener('material-pending-review', onPending)
    return () => window.removeEventListener('material-pending-review', onPending)
  }, [])

  const grouped = rows.reduce((acc, row) => {
    ;(acc[row.national_code] ||= []).push(row)
    return acc
  }, {})

  const clusters = Object.entries(grouped).filter(([, items]) => items.length > 1)
  const isReviewed = (item) => reviewedIds.includes(`${item.cpse_id}-${item.source_code}`)

  const visibleClusters = useMemo(() => {
    if (filter === 'reviewed') return clusters.filter(([, items]) => items.every(isReviewed))
    if (filter === 'pending') return clusters.filter(([, items]) => items.some((item) => !isReviewed(item)))
    return clusters
  }, [clusters, filter, reviewedIds])

  const open = async (a, b) => {
    const ia = rows.findIndex((r) => `${r.cpse_id}-${r.source_code}` === a)
    const ib = rows.findIndex((r) => `${r.cpse_id}-${r.source_code}` === b)
    if (ia >= 0 && ib >= 0) setExplanation((await explainMatch(ia, ib)).data)
  }

  const markReviewed = (id) => {
    const next = [...new Set([...reviewedIds, id])]
    setReviewedIds(next)
    localStorage.setItem(REVIEWED_KEY, JSON.stringify(next))
  }

  const act = async (action, item, nationalCode) => {
    try {
      await sendFeedback({
        national_code: nationalCode,
        cpse_id: item.cpse_id,
        source_code: item.source_code,
        action,
      })
      markReviewed(`${item.cpse_id}-${item.source_code}`)
      setNotice(`${action.replaceAll('_', ' ')} logged for ${item.source_code}`)
    } catch {
      setNotice('Could not save the review action. Check the backend connection.')
    }
  }

  const approvePending = async (action) => {
    if (!pending || busy) return
    setBusy(true)
    try {
      const code = pending.final_recommendation?.national_code || 'AI-RECOMMENDATION'
      await sendFeedback({
        national_code: code,
        cpse_id: 'AI_GENERATED',
        source_code: code,
        action,
        reviewer: 'human_reviewer',
        notes: reviewNote,
      })
      const text = action === 'APPROVE' ? 'Recommendation approved and finalized.' : action === 'REJECT' ? 'Recommendation rejected. Send it back for another analysis.' : 'Changes requested. The recommendation remains in human review.'
      setNotice(text)
      if (action === 'REQUEST_CHANGES') {
        setReviewAction('REQUEST_CHANGES')
      } else {
        localStorage.removeItem(PENDING_KEY)
        window.dispatchEvent(new Event('material-pending-review'))
        setPending(null)
        setReviewAction('')
        setReviewNote('')
      }
    } catch {
      setNotice('Could not record the approval decision. Check the Render backend.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="GOVERNANCE"
        title="Human interaction & review"
        description="AI proposes. A human reviewer approves, rejects, or requests changes before the recommendation is considered final."
        action={
          <div className="review-gate-status">
            <span className="human-gate-dot" />
            {pending ? '1 pending approval' : 'No pending AI approval'}
          </div>
        }
      />

      {notice && (
        <div className="review-toast" role="status">
          <Icon name="check" size={15} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><Icon name="x" size={13} /></button>
        </div>
      )}

      {pending && (
        <section className="panel pending-human-card result-banner-animated">
          <div className="pending-topline">
            <div>
              <span className="eyebrow">AI → HUMAN HANDOFF</span>
              <h2>Recommendation awaiting human approval</h2>
              <p>The model has completed its recommendation. It cannot finalize the code without a reviewer decision.</p>
            </div>
            <div className="pending-status"><span className="status-dot status-dot-live" /> Pending</div>
          </div>

          <div className="pending-grid">
            <div className="pending-main-card">
              <span>PROPOSED NATIONAL CODE</span>
              <strong>{pending.final_recommendation?.national_code || '—'}</strong>
              <b>{(pending.final_recommendation?.action || '').replaceAll('_', ' ')}</b>
            </div>
            <div className="pending-main-card">
              <span>AI CONFIDENCE</span>
              <strong>{pending.recommendations?.[0] ? `${Math.round(pending.recommendations[0].hybrid_score * 100)}%` : '—'}</strong>
              <b>{pending.recommendations?.[0]?.decision || 'REVIEW'}</b>
            </div>
            <div className="pending-main-card wide">
              <span>INPUT DESCRIPTION</span>
              <strong className="pending-input">{pending.input || '—'}</strong>
            </div>
          </div>

          <div className="pending-detail-grid">
            <div>
              <span className="detail-label">Canonical description</span>
              <div className="canonical-inline">{pending.canonical || 'No canonical description returned'}</div>
            </div>
            <div>
              <span className="detail-label">Extracted attributes</span>
              <div className="attribute-chip-wrap">
                {Object.entries(pending.extracted_attributes || {}).map(([key, value]) => (
                  <span className="attribute-chip" key={key}><b>{key.replaceAll('_', ' ')}</b>{String(value ?? '—')}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="approval-zone">
            <div>
              <span className="eyebrow">HUMAN DECISION</span>
              <h3>What should happen to this AI recommendation?</h3>
              <p>Choose one action. The decision is sent to the backend audit trail.</p>
            </div>
            <div className="decision-actions">
              <button className="approval-btn approve" type="button" disabled={busy} onClick={() => approvePending('APPROVE')}>
                {busy && reviewAction === '' ? <span className="button-spinner dark" /> : <Icon name="check" size={16} />}
                Approve & finalize
              </button>
              <button className="approval-btn reject" type="button" disabled={busy} onClick={() => approvePending('REJECT')}>
                <Icon name="x" size={16} /> Reject
              </button>
              <button className="approval-btn changes" type="button" onClick={() => setReviewAction(reviewAction === 'REQUEST_CHANGES' ? '' : 'REQUEST_CHANGES')}>
                <Icon name="activity" size={16} /> Request changes
              </button>
            </div>
          </div>

          {reviewAction === 'REQUEST_CHANGES' && (
            <div className="review-note-row">
              <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Tell the next reviewer or AI run what needs to change…" />
              <button className="primary-btn" type="button" disabled={busy || !reviewNote.trim()} onClick={() => approvePending('REQUEST_CHANGES')}>Send request <Icon name="arrow" size={14} /></button>
            </div>
          )}

          <div className="pending-actions-footer">
            <button className="secondary-btn" type="button" onClick={() => navigate('/generator')}><Icon name="chevron" size={13} className="rotate-180" /> Back to generator</button>
            <span>Decision history is recorded through <code>/feedback</code>.</span>
          </div>
        </section>
      )}

      <div className="review-section-heading">
        <div><span className="eyebrow">CATALOG GOVERNANCE</span><h2>Duplicate review queue</h2><p>Validate material clusters already present in the catalog.</p></div>
        <div className="filter-pills">
          {[
            ['clusters', 'All clusters'],
            ['pending', 'Needs review'],
            ['reviewed', 'Reviewed'],
          ].map(([value, label]) => (
            <button className={filter === value ? 'selected' : ''} key={value} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="panel loading-state"><div className="catalog-loader"><span className="loader-orb small"><i /></span><strong>Loading review queue</strong><span>Preparing catalog clusters…</span></div></div> : (
        <div className="review-layout">
          <div className="cluster-list">
            {visibleClusters.slice(0, 30).map(([nc, items], idx) => (
              <section className="panel cluster-card" key={nc}>
                <div className="cluster-head">
                  <div><span className="cluster-index">CLUSTER {String(idx + 1).padStart(3, '0')}</span><strong>{nc}</strong></div>
                  <ScoreBadge score={Math.min(.98, .72 + items.length * .05)} decision={items.length > 2 ? 'REVIEW' : 'AUTO'} />
                </div>
                <div className="cluster-table">
                  <div className="cluster-table-head"><span>CPSE / SOURCE</span><span>DESCRIPTION</span><span>ACTION</span></div>
                  {items.map((item, i) => (
                    <div className={`cluster-line ${isReviewed(item) ? 'row-reviewed' : ''}`} key={i}>
                      <div><strong>{item.cpse_id}</strong><span>{item.source_code}</span></div>
                      <div>{item.raw_description}</div>
                      <div className="action-stack">
                        <button className="link-btn approve" disabled={isReviewed(item)} onClick={() => act('APPROVE', item, nc)}>{isReviewed(item) ? 'Reviewed' : 'Approve'}</button>
                        <button className="link-btn reject" disabled={isReviewed(item)} onClick={() => act('REJECT', item, nc)}>Reject</button>
                        {i > 0 && <button className="link-btn explain" onClick={() => open(`${items[0].cpse_id}-${items[0].source_code}`, `${item.cpse_id}-${item.source_code}`)}>Explain</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {!visibleClusters.length && <div className="panel empty-queue"><Icon name="check" size={20} /><h3>Nothing in this filter</h3><p>Try another queue filter or generate a new recommendation to start a human approval flow.</p><button className="secondary-btn" onClick={() => navigate('/generator')}>Generate material code</button></div>}
          </div>
          <div className="explain-sticky">
            {explanation ? <ExplainPanel data={explanation} /> : <section className="panel empty-explain"><div className="empty-icon">AI</div><h3>Select a pair to explain</h3><p>Click <b>Explain</b> on any duplicate cluster to inspect semantic and attribute-level evidence.</p></section>}
          </div>
        </div>
      )}
    </div>
  )
}
