from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, csv, datetime
from material_engine import (
    search, explain_pair, classify_new_material,
    CATALOG, NATIONAL_CODES,
)

app = FastAPI(title="Material Master API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

FEEDBACK_PATH = os.path.join(os.path.dirname(__file__), 'feedback_store.csv')
if not os.path.exists(FEEDBACK_PATH):
    with open(FEEDBACK_PATH, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['timestamp','national_code','cpse_id','source_code',
                    'action','reviewer','notes'])

class SearchQuery(BaseModel):
    text: str; top_k: int = 5
class ExplainQuery(BaseModel):
    index_a: int; index_b: int
class NewMaterialQuery(BaseModel):
    text: str
class Feedback(BaseModel):
    national_code: str; cpse_id: str; source_code: str
    action: str; reviewer: str = "demo_user"; notes: str = ""

@app.get("/")
def root(): return {"ok": True, "service": "Material Master API", "catalog_size": len(CATALOG)}

@app.get("/health")
def health():
    return {"status": "healthy", "catalog_rows": len(CATALOG),
            "national_codes": len(NATIONAL_CODES)}

@app.post("/search")
def api_search(q: SearchQuery): return search(q.text, q.top_k)

@app.post("/match/explain")
def api_explain(q: ExplainQuery):
    try: return explain_pair(q.index_a, q.index_b)
    except IndexError: raise HTTPException(400, "Index out of range")

@app.post("/national-code/new")
def api_new_material(q: NewMaterialQuery): return classify_new_material(q.text)

@app.post("/feedback")
def api_feedback(f: Feedback):
    with open(FEEDBACK_PATH, 'a', newline='') as fp:
        csv.writer(fp).writerow([datetime.datetime.utcnow().isoformat(),
            f.national_code, f.cpse_id, f.source_code, f.action, f.reviewer, f.notes])
    return {"ok": True, "logged": f.action}

@app.get("/dashboard/stats")
def dashboard_stats():
    total = len(CATALOG)
    distinct_nc = CATALOG['national_code'].nunique()
    clusters = sum(1 for v in NATIONAL_CODES.values() if len(v['members']) > 1)
    redundancy = round(100 * (1 - distinct_nc / total), 1) if total else 0
    savings = clusters * 2500
    rows = []
    if os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH) as fp:
            rows = list(csv.DictReader(fp))
    approved = sum(1 for r in rows if r['action'] == 'APPROVE')
    rejected = sum(1 for r in rows if r['action'] == 'REJECT')
    return {"total_materials": total, "distinct_national_codes": int(distinct_nc),
            "duplicate_clusters": int(clusters),
            "redundancy_reduction_pct": redundancy,
            "estimated_savings_inr": int(savings),
            "approved_count": approved, "rejected_count": rejected,
            "recent_actions": rows[-10:][::-1]}

@app.get("/catalog")
def catalog_page(limit: int = 100, offset: int = 0):
    sub = CATALOG.iloc[offset:offset+limit]
    return {"total": len(CATALOG),
            "rows": sub[['cpse_id','source_code','raw_description','canonical_desc',
                         'national_code','category','moc','size_mm',
                         'pressure_class','end_connection']].to_dict('records')}
