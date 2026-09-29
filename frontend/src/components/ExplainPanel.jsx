import ScoreBadge from './ScoreBadge'
import Icon from './Icon'
export default function ExplainPanel({ data }) {
  if (!data) return null
  const { item_a, item_b, reasons, semantic_score, attribute_score, hybrid_score, decision } = data
  return <section className="panel explain-panel">
    <div className="panel-head"><div><h3>Why these materials matched</h3><span>AI explanation for the selected comparison</span></div><ScoreBadge score={hybrid_score} decision={decision}/></div>
    <div className="compare-cards">
      {[item_a, item_b].map((item, idx) => <div className="compare-item" key={idx}><div className="compare-meta">{item.cpse_id} · {item.source_code}</div><div className="compare-description">{item.description}</div><div className="compare-code">{item.national_code}</div></div>)}
    </div>
    <div className="score-strip">
      <div><span>Semantic similarity</span><strong>{(semantic_score * 100).toFixed(1)}%</strong></div>
      <div><span>Attribute similarity</span><strong>{(attribute_score * 100).toFixed(1)}%</strong></div>
      <div><span>Hybrid confidence</span><strong>{(hybrid_score * 100).toFixed(1)}%</strong></div>
    </div>
    <div className="reason-list">
      {reasons.map((r, i) => <div className="reason-row" key={i}><span className="reason-field">{r.field}</span><span className="reason-values">{r.a} <b>vs</b> {r.b}</span><span className={`reason-status ${r.status}`}>{r.status === 'matched' ? <><Icon name="check" size={13}/>Matched</> : r.status === 'differ' ? <><Icon name="x" size={13}/>Differ</> : <>Missing</>}</span></div>)}
    </div>
  </section>
}
