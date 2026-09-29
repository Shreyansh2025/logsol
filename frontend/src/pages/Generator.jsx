import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { classifyNewMaterial } from '../api'
import ScoreBadge from '../components/ScoreBadge'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const samples = [
  '2 inch CS ball valve class 150 RF SS316 trim',
  'PIPE SEAMLESS 4 INCH SCH 40 ASTM A106 GR B',
  'SPIRAL WOUND GASKET DN80 300# SS316 GRAPHITE',
]

const stages = [
  ['01', 'Normalizing description', 'Cleaning text and expanding abbreviations'],
  ['02', 'Extracting attributes', 'Category, MOC, size, pressure and connection'],
  ['03', 'Semantic comparison', 'Encoding against National Material Codes'],
  ['04', 'Ranking recommendation', 'Combining semantic and technical confidence'],
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export default function Generator() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [error, setError] = useState('')
  const timerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => () => timerRef.current && clearTimeout(timerRef.current), [])

  const routeToHumanReview = (data, sourceText) => {
    const payload = {
      id: `ai-${Date.now()}`,
      createdAt: new Date().toISOString(),
      input: sourceText,
      normalized: data.normalized,
      canonical: data.canonical,
      extracted_attributes: data.extracted_attributes || {},
      recommendations: data.recommendations || [],
      final_recommendation: data.final_recommendation || {},
      status: 'PENDING_HUMAN_APPROVAL',
    }
    localStorage.setItem('material_master_pending_review', JSON.stringify(payload))
    window.dispatchEvent(new Event('material-pending-review'))
    return payload
  }

  const run = async (query = text) => {
    const clean = query.trim()
    if (!clean || loading) return
    setText(clean)
    setError('')
    setResult(null)
    setLoading(true)
    setStageIndex(0)

    const cycle = setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, stages.length - 1))
    }, 420)

    try {
      const [response] = await Promise.all([
        classifyNewMaterial(clean),
        wait(1550),
      ])
      setStageIndex(3)
      setResult(response.data)
      routeToHumanReview(response.data, clean)
      timerRef.current = setTimeout(() => navigate('/review'), 950)
    } catch (err) {
      console.error(err)
      setError('The AI service could not complete the recommendation. Check the Render API URL and /health endpoint.')
    } finally {
      clearInterval(cycle)
      setLoading(false)
    }
  }

  const clearAll = () => {
    if (loading) return
    setText('')
    setResult(null)
    setError('')
  }

  const finalRecommendation = result?.final_recommendation || {}
  const confidence = result?.recommendations?.[0]
    ? Math.round(result.recommendations[0].hybrid_score * 100)
    : 0

  return (
    <div>
      <PageHeader
        eyebrow="MASTER DATA"
        title="National code generator"
        description="Turn an unstructured material description into a canonical description. AI proposes the code first — a human reviewer makes the final decision."
        action={
          <div className="human-gate-badge">
            <span className="human-gate-dot" />
            Human approval gate
          </div>
        }
      />

      <section className="panel generator-input generator-input-enhanced">
        <div className="stepbar">
          <span className="done">1 · Input</span>
          <span className={loading ? 'active' : result ? 'done' : ''}>2 · AI analysis</span>
          <span className={result ? 'active' : ''}>3 · Human approval</span>
        </div>

        <div className="generator-intro-row">
          <div>
            <div className="field-label">Material description</div>
            <h3>What should the AI standardize?</h3>
            <p>Use a raw description exactly as it arrives from a source system.</p>
          </div>
          <div className="ai-mini-status"><span className="status-dot status-dot-live" /> Model ready</div>
        </div>

        <div className="search-input-row generator-search-row">
          <Icon name="file" size={19} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="e.g. 6 inch SS316 gate valve class 300 RTJ"
            disabled={loading}
          />
          {text && !loading && (
            <button className="ghost-icon-btn" type="button" onClick={clearAll} title="Clear input" aria-label="Clear input">
              <Icon name="x" size={15} />
            </button>
          )}
          <button className="primary-btn primary-btn-glow" type="button" onClick={() => run()} disabled={loading || !text.trim()}>
            {loading ? <><span className="button-spinner" />Analyzing…</> : <>Generate & review <Icon name="arrow" size={15} /></>}
          </button>
        </div>

        <div className="sample-row sample-row-enhanced">
          <span>Quick samples</span>
          {samples.map((sample) => (
            <button
              type="button"
              key={sample}
              disabled={loading}
              onClick={() => {
                setText(sample)
                run(sample)
              }}
            >
              {sample}
            </button>
          ))}
        </div>

        {loading && (
          <div className="analysis-loader" aria-live="polite">
            <div className="loader-head">
              <div>
                <span className="eyebrow">AI ENGINE RUNNING</span>
                <strong>{stages[stageIndex][1]}</strong>
                <span>{stages[stageIndex][2]}</span>
              </div>
              <div className="loader-orb"><span /></div>
            </div>
            <div className="loader-track"><div style={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }} /></div>
            <div className="loader-steps">
              {stages.map(([num, title], index) => (
                <div className={index < stageIndex ? 'complete' : index === stageIndex ? 'current' : ''} key={num}>
                  <span>{index < stageIndex ? '✓' : num}</span>
                  <label>{title}</label>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && (
        <section className="panel error-panel generator-error">
          <Icon name="x" size={18} />
          <div>
            <strong>Recommendation failed</strong>
            <span>{error}</span>
          </div>
          <button className="secondary-btn" type="button" onClick={() => run()}>Try again</button>
        </section>
      )}

      {result && !loading && (
        <>
          <section className="recommendation-card recommendation-card-human result-banner-animated">
            <div className="rec-left">
              <span className="eyebrow">AI RECOMMENDATION READY</span>
              <div className="rec-code">{finalRecommendation.national_code || '—'}</div>
              <div className="rec-action">{(finalRecommendation.action || '').replaceAll('_', ' ')}</div>
              <div className="human-routing-note">
                <span className="status-dot status-dot-live" />
                Routed to Human Approval
              </div>
            </div>

            <div className="rec-visual">
              <div className="rec-circle rec-circle-animated">
                <span>AI</span>
                <b>{confidence}%</b>
              </div>
              <span>Top recommendation confidence</span>
            </div>
          </section>

          <section className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Extracted attributes</h3>
                  <span>Evidence captured before human approval</span>
                </div>
                <span className="tiny-badge">Read only</span>
              </div>

              <div className="attribute-grid">
                {Object.entries(result.extracted_attributes || {}).map(([key, value]) => (
                  <div key={key}>
                    <span>{key.replaceAll('_', ' ')}</span>
                    <strong>{String(value ?? '—')}</strong>
                  </div>
                ))}
              </div>

              <div className="canonical-block">
                <span>Canonical description</span>
                <strong>{result.canonical || '—'}</strong>
              </div>
            </div>

            <div className="panel human-next-panel">
              <div className="panel-head">
                <div>
                  <h3>Human-in-the-loop</h3>
                  <span>AI cannot finalize the recommendation</span>
                </div>
                <span className="approval-lock"><Icon name="shield" size={13} /> Approval required</span>
              </div>
              <div className="human-next-body">
                <div className="human-avatar">H</div>
                <div>
                  <strong>Material reviewer</strong>
                  <p>The recommendation will open in the Review workspace with Approve, Reject and Request Changes actions.</p>
                </div>
              </div>
              <button className="secondary-btn review-route-btn" type="button" onClick={() => navigate('/review')}>
                Open human review now <Icon name="arrow" size={14} />
              </button>
            </div>
          </section>
        </>
      )}

      {result && !loading && (
        <section className="panel" style={{ marginTop: 14 }}>
          <div className="panel-head">
            <div><h3>Top existing National Codes considered</h3><span>The AI ranked alternatives before handing control to a human.</span></div>
            <span className="tiny-badge"><span className="pulse-mini" /> {result.recommendations?.length || 0} candidates</span>
          </div>
          <div className="mini-match-list">
            {(result.recommendations || []).map((match, index) => (
              <div key={index}>
                <div>
                  <strong>{match.national_code}</strong>
                  <span>{match.canonical_description}</span>
                </div>
                <ScoreBadge score={match.hybrid_score} decision={match.decision} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
