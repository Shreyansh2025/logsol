import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchMaterials } from '../api'
import PageHeader from '../components/PageHeader'
import ScoreBadge from '../components/ScoreBadge'
import Icon from '../components/Icon'

const demo = ['2 inch CS ball valve class 150 RF SS316 trim','PIPE SEAMLESS 4 INCH SCH 40 ASTM A106 GR B','Stainless steel 316 gate valve 6 inch class 300 RTJ']

export default function Match() {
  const [params, setParams] = useSearchParams()
  const [text,setText]=useState(params.get('q') || '')
  const [result,setResult]=useState(null)
  const [loading,setLoading]=useState(false)

  useEffect(()=>{
    const q=params.get('q') || ''
    if(q && !result) run(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const run=async(q=text)=>{
    if(!q.trim()) return
    setText(q); setParams({q:q.trim()},{replace:true}); setLoading(true); setResult(null)
    try { const r=await searchMaterials(q.trim(),6); setResult(r.data) }
    catch(e) { setResult({error:true}) }
    finally { setLoading(false) }
  }

  return <div>
    <PageHeader eyebrow="AI WORKSPACE" title="AI material matching" description="Compare a raw material description against the unified catalog using semantic and technical-attribute matching." action={<div className="match-engine-badge"><span className="status-dot status-dot-live"/> Hybrid engine</div>} />
    <section className="panel search-panel match-command-panel">
      <div className="match-command-top"><div><div className="field-label">Material description</div><h3>What material do you want to standardize?</h3></div><span className="command-chip">55% semantic · 45% attributes</span></div>
      <form className="search-input-row search-input-row-focus" onSubmit={e=>{e.preventDefault();run()}}><div className="search-command-icon"><Icon name="spark" size={19}/></div><input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. 6 inch SS316 gate valve class 300 RTJ"/><button className="primary-btn primary-btn-glow" disabled={loading}>{loading?<><span className="button-spinner"/>Analyzing…</>:<>Find matches <Icon name="arrow" size={15}/></>}</button></form>
      <div className="sample-row"><span>Try a sample</span>{demo.map(s=><button type="button" key={s} onClick={()=>run(s)}>{s}</button>)}</div>
      {loading && <div className="analysis-progress"><span>Normalizing</span><i/><span>Extracting attributes</span><i/><span>Embedding</span><i/><span>Ranking</span></div>}
    </section>

    {result?.error && <section className="panel error-panel"><Icon name="x" size={18}/><div><strong>Backend connection failed</strong><span>Check the Render API URL in VITE_API_URL and confirm /health is responding.</span></div></section>}

    {result && !result.error && <>
      <section className="result-banner result-banner-animated"><div><span className="eyebrow">CANONICAL FORM</span><strong>{result.canonical || 'Insufficient attributes'}</strong><span>{result.normalized}</span></div><div className="attribute-chips">{Object.entries(result.extracted_attributes||{}).filter(([,v])=>v!==null&&v!==''&&v!=='UNKNOWN').map(([k,v])=><span key={k}><b>{k}</b>{String(v)}</span>)}</div></section>
      <section className="panel results-panel">
        <div className="panel-head"><div><h3>Top AI matches</h3><span>Ranked by hybrid semantic + attribute confidence</span></div><span className="tiny-badge"><span className="pulse-mini"/> {result.results?.length || 0} candidates</span></div>
        <div className="results-list">{(result.results||[]).map((r,i)=><div className="result-row result-row-animated" style={{'--delay':`${i*75}ms`}} key={i}><div className="rank">{String(i+1).padStart(2,'0')}</div><div className="result-main"><div className="result-code">{r.cpse_id} · {r.source_code}</div><strong>{r.raw_description}</strong><span>{r.canonical_description}</span><div className="result-meta"><span>National code <b>{r.national_code}</b></span><span>Semantic {Math.round(r.semantic_score*100)}%</span><span>Attributes {Math.round(r.attribute_score*100)}%</span></div></div><div className="result-score"><ScoreBadge score={r.hybrid_score} decision={r.decision}/></div><Icon name="chevron" size={17}/></div>)}</div>
      </section>
    </>}
  </div>
}
