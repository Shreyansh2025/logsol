import { useState } from 'react'
import { classifyNewMaterial } from '../api'
import ScoreBadge from '../components/ScoreBadge'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const samples = [
  '2 inch CS ball valve class 150 RF SS316 trim',
  'PIPE SEAMLESS 4 INCH SCH 40 ASTM A106 GR B',
  'SPIRAL WOUND GASKET DN80 300# SS316 GRAPHITE',
]

export default function Generator() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (query = text) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const response = await classifyNewMaterial(query)
      setResult(response.data)
    } catch (error) {
      console.error(error)
      alert('Backend not reachable. Start FastAPI on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="MASTER DATA"
        title="National code generator"
        description="Turn an unstructured material description into a canonical description and a proposed National Material Code."
      />

      <section className="panel generator-input">
        <div className="stepbar">
          <span className="done">1 · Input</span>
          <span className="active">2 · AI analysis</span>
          <span>3 · Recommendation</span>
        </div>

        <div className="field-label">Material description</div>
        <div className="search-input-row">
          <Icon name="file" size={19} />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            placeholder="Describe the material…"
          />
          <button className="primary-btn" onClick={() => run()} disabled={loading}>
            {loading ? 'Analyzing…' : 'Generate code'}
            <Icon name="arrow" size={15} />
          </button>
        </div>

        <div className="sample-row">
          <span>Examples:</span>
          {samples.map((sample) => (
            <button
              key={sample}
              onClick={() => {
                setText(sample)
                run(sample)
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </section>

      {result && (
        <>
          <section className="recommendation-card">
            <div className="rec-left">
              <span className="eyebrow">FINAL RECOMMENDATION</span>
              <div className="rec-code">{result.final_recommendation?.national_code || '—'}</div>
              <div className="rec-action">
                {(result.final_recommendation?.action || '').replaceAll('_', ' ')}
              </div>
            </div>

            <div className="rec-visual">
              <div className="rec-circle">
                <span>AI</span>
                <b>
                  {result.recommendations?.[0]
                    ? Math.round(result.recommendations[0].hybrid_score * 100)
                    : 0}%
                </b>
              </div>
              <span>Top match confidence</span>
            </div>
          </section>

          <section className="two-col">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Extracted attributes</h3>
                  <span>What the engine understood</span>
                </div>
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

            <div className="panel">
              <div className="panel-head">
                <div>
                  <h3>Top existing matches</h3>
                  <span>Alternative codes considered</span>
                </div>
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
            </div>
          </section>
        </>
      )}
    </div>
  )
}
