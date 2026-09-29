import { useState } from 'react'
import { searchMaterials } from '../api'
import PageHeader from '../components/PageHeader'
import ScoreBadge from '../components/ScoreBadge'
import Icon from '../components/Icon'

const demo = ['2 inch CS ball valve class 150 RF SS316 trim','PIPE SEAMLESS 4 INCH SCH 40 ASTM A106 GR B','Stainless steel 316 gate valve 6 inch class 300 RTJ']
export default function Match() {
 const [text,setText]=useState('')
 const [result,setResult]=useState(null)
 const [loading,setLoading]=useState(false)
 const run=async(q=text)=>{ if(!q.trim()) return; setLoading(true); try { const r=await searchMaterials(q,6); setResult(r.data) } catch(e) { setResult(null); alert('Backend not reachable. Start the FastAPI service on port 8000.') } finally { setLoading(false) } }
 return <div><PageHeader eyebrow="AI WORKSPACE" title="AI material matching" description="Compare a raw material description against the unified catalog using semantic and technical-attribute matching." />
 <section className="panel search-panel"><div className="field-label">Material description</div><div className="search-input-row"><Icon name="spark" size={19}/><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&run()} placeholder="e.g. 6 inch SS316 gate valve class 300 RTJ"/><button className="primary-btn" onClick={()=>run()} disabled={loading}>{loading?'Analyzing…':'Find matches'} <Icon name="arrow" size={15}/></button></div><div className="sample-row"><span>Try a sample:</span>{demo.map(s=><button key={s} onClick={()=>{setText(s);run(s)}}>{s}</button>)}</div></section>
 {result && <><section className="result-banner"><div><span className="eyebrow">CANONICAL FORM</span><strong>{result.canonical || 'Insufficient attributes'}</strong><span>{result.normalized}</span></div><div className="attribute-chips">{Object.entries(result.extracted_attributes||{}).filter(([,v])=>v!==null&&v!==''&&v!=='UNKNOWN').map(([k,v])=><span key={k}><b>{k}</b>{String(v)}</span>)}</div></section><section className="panel"><div className="panel-head"><div><h3>Top AI matches</h3><span>Ranked by hybrid semantic + attribute confidence</span></div></div><div className="results-list">{result.results.map((r,i)=><div className="result-row" key={i}><div className="rank">{String(i+1).padStart(2,'0')}</div><div className="result-main"><div className="result-code">{r.cpse_id} · {r.source_code}</div><strong>{r.raw_description}</strong><span>{r.canonical_description}</span><div className="result-meta"><span>National code <b>{r.national_code}</b></span><span>Semantic {Math.round(r.semantic_score*100)}%</span><span>Attributes {Math.round(r.attribute_score*100)}%</span></div></div><div className="result-score"><ScoreBadge score={r.hybrid_score} decision={r.decision}/></div><Icon name="chevron" size={17}/></div>)}</div></section></>}
 </div>
}
