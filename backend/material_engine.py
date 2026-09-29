"""
Material Master Engine — wraps the trained SBERT model + catalog + National Codes.
Loads everything from artifacts/ produced by the Colab notebook.
"""
import os, re, json, hashlib
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

ART = os.path.join(os.path.dirname(__file__), 'artifacts')

with open(os.path.join(ART, 'config.json')) as f:
    CFG = json.load(f)
with open(os.path.join(ART, 'national_codes.json')) as f:
    NATIONAL_CODES = json.load(f)

CATALOG = pd.read_csv(os.path.join(ART, 'catalog.csv')).fillna('')
EMB = np.load(os.path.join(ART, 'catalog_emb.npy'))
MODEL = SentenceTransformer(os.path.join(ART, 'material-sbert-ft'))

ABBREV = CFG['ABBREV']
T_AUTO = CFG.get('T_AUTO', 0.88)
T_REVIEW = CFG.get('T_REVIEW', 0.62)
STRICTNESS = CFG.get('CATEGORY_STRICTNESS', {})

def normalize_text(text: str) -> str:
    t = str(text).upper().strip()
    t = re.sub(r'[",;\[\]?]+', ' ', t)
    t = re.sub(r'\s+', ' ', t)
    for pat, rep in ABBREV.items():
        t = re.sub(pat, rep, t)
    return t.strip()

CATEGORY_KEYWORDS = {
    'BALL VALVE':'VALVE','GATE VALVE':'VALVE','GLOBE VALVE':'VALVE',
    'CHECK VALVE':'VALVE','BUTTERFLY':'VALVE','SAFETY RELIEF':'VALVE',
    'PRESSURE SAFETY':'VALVE','RELIEF VALVE':'VALVE','CONTROL VALVE':'VALVE',
    'PIPE':'PIPE','FLANGE':'FLANGE','GASKET':'GASKET','ELBOW':'FITTING',
    'TEE':'FITTING','REDUCER':'FITTING','STUD BOLT':'FASTENER','BOLT':'FASTENER',
    'BEARING':'BEARING','PUMP':'PUMP','MOTOR':'MOTOR','TRANSMITTER':'INSTRUMENT',
    'STRAINER':'FITTING','O-RING':'GASKET','V-BELT':'DRIVE',
}
MOC_PATTERNS = [
    (r'STAINLESS STEEL 316','SS316'),(r'STAINLESS STEEL 304','SS304'),
    (r'STAINLESS STEEL','SS'),(r'CARBON STEEL','CS'),(r'MILD STEEL','MS'),
    (r'CAST IRON','CI'),(r'ALLOY 20','ALLOY20'),(r'ALY20','ALLOY20'),
    (r'DUPLEX','DUPLEX'),(r'FKM','FKM'),(r'NITRILE','NBR'),(r'GRAPHITE','GRAPHITE'),
]
END_PATTERNS = [
    (r'RING TYPE JOINT','RTJ'),(r'RAISED FACE','RF'),
    (r'BUTT WELD','BW'),(r'SOCKET WELD','SW'),
    (r'THREADED NPT','NPT'),(r'WAFER','WAFER'),
]
STD_PATTERNS = [
    r'\b(IS[:\s]?\d+)\b', r'\b(ASTM\s+[A-Z]?\d+[A-Z0-9\s]*?)\b',
    r'\b(API\s+\d+[A-Z]?)\b', r'\b(ANSI\s+B?\d+(\.\d+)?)\b',
    r'\b(ASME\s+B?\d+(\.\d+)?)\b', r'\b(ISO)\b',
]

def extract_attributes(t: str) -> dict:
    out = {'category':'UNKNOWN','item':None,'moc':'UNKNOWN',
           'size_mm':None,'pressure_class':None,'schedule':None,
           'end_connection':'UNKNOWN','standard':None}
    for kw, cat in CATEGORY_KEYWORDS.items():
        if kw in t:
            out['category'] = cat; out['item'] = kw; break
    for pat, code in MOC_PATTERNS:
        if re.search(pat, t): out['moc'] = code; break
    m = re.search(r'DN\s*(\d+)', t)
    if m: out['size_mm'] = float(m.group(1))
    else:
        m = re.search(r'(\d+(?:\.\d+)?)\s*IN\b', t)
        if m: out['size_mm'] = round(float(m.group(1))*25.4, 1)
        else:
            m = re.search(r'(\d+(?:\.\d+)?)\s*MM\b', t)
            if m: out['size_mm'] = float(m.group(1))
    m = re.search(r'CLASS\s*(\d+)', t); out['pressure_class'] = int(m.group(1)) if m else None
    m = re.search(r'SCH(?:EDULE)?\s*(\d+)', t); out['schedule'] = m.group(1) if m else None
    for pat, code in END_PATTERNS:
        if re.search(pat, t): out['end_connection'] = code; break
    for p in STD_PATTERNS:
        m = re.search(p, t)
        if m: out['standard'] = re.sub(r'\s+','',m.group(1)); break
    return out

def build_canonical(attrs: dict) -> str:
    parts = []
    moc = attrs.get('moc'); item = attrs.get('item')
    size = attrs.get('size_mm'); pcl = attrs.get('pressure_class')
    sch = attrs.get('schedule'); end = attrs.get('end_connection')
    if moc and moc != 'UNKNOWN': parts.append(moc)
    if item: parts.append(item)
    if size: parts.append(f"DN{int(size)}")
    if pcl: parts.append(f"CL{pcl}")
    if sch: parts.append(f"SCH{sch}")
    if end and end != 'UNKNOWN': parts.append(end)
    return ' '.join(parts)

def attribute_score(a: dict, b: dict) -> float:
    score, weight = 0.0, 0.0
    def w(key, wgt, cmp):
        nonlocal score, weight
        va, vb = a.get(key), b.get(key)
        if va in (None,'UNKNOWN','') or vb in (None,'UNKNOWN',''): return
        weight += wgt
        if cmp(va, vb): score += wgt
    w('category',       0.30, lambda x,y: x==y)
    w('moc',            0.20, lambda x,y: x==y)
    w('size_mm',        0.20, lambda x,y: abs(float(x)-float(y)) < 1.0)
    w('pressure_class', 0.15, lambda x,y: str(x)==str(y))
    w('end_connection', 0.08, lambda x,y: x==y)
    w('schedule',       0.05, lambda x,y: x==y)
    w('standard',       0.02, lambda x,y: x==y)
    return (score/weight) if weight > 0 else 0.0

def search(query: str, top_k: int = 5):
    norm = normalize_text(query)
    attrs = extract_attributes(norm)
    canonical = build_canonical(attrs)
    q_emb = MODEL.encode([canonical], normalize_embeddings=True)
    sims = cosine_similarity(q_emb, EMB)[0]
    order = np.argsort(-sims)[:top_k]
    results = []
    for idx in order:
        row = CATALOG.iloc[idx]
        attr_row = {k: row[k] for k in ['category','moc','size_mm','pressure_class',
                                        'end_connection','schedule','standard']}
        at = attribute_score(attrs, attr_row)
        hyb = 0.55*float(sims[idx]) + 0.45*at
        results.append({
            "cpse_id": str(row['cpse_id']),
            "source_code": str(row['source_code']),
            "raw_description": str(row['raw_description']),
            "canonical_description": str(row['canonical_desc']),
            "national_code": str(row['national_code']),
            "semantic_score": round(float(sims[idx]), 4),
            "attribute_score": round(at, 4),
            "hybrid_score": round(hyb, 4),
            "decision": ("AUTO" if hyb >= T_AUTO else
                         "REVIEW" if hyb >= T_REVIEW else "REJECT"),
        })
    return {"query": query, "normalized": norm, "canonical": canonical,
            "extracted_attributes": attrs, "results": results}

def explain_pair(index_a: int, index_b: int) -> dict:
    ra, rb = CATALOG.iloc[index_a], CATALOG.iloc[index_b]
    aa = {k: ra[k] for k in ['category','moc','size_mm','pressure_class',
                             'end_connection','schedule','standard']}
    ab = {k: rb[k] for k in ['category','moc','size_mm','pressure_class',
                             'end_connection','schedule','standard']}
    sem = float(cosine_similarity(EMB[index_a:index_a+1], EMB[index_b:index_b+1])[0,0])
    at = attribute_score(aa, ab)
    hyb = 0.55*sem + 0.45*at
    reasons = []
    def cmp(field, label, test):
        va, vb = aa.get(field), ab.get(field)
        status = "missing" if (va in ('', None, 'UNKNOWN') or vb in ('', None, 'UNKNOWN')) \
                 else ("matched" if test(va, vb) else "differ")
        reasons.append({"field": label, "a": str(va), "b": str(vb), "status": status})
    cmp('category','Category',       lambda x,y: x==y)
    cmp('moc','MOC',                 lambda x,y: x==y)
    cmp('size_mm','Size (mm)',       lambda x,y: abs(float(x)-float(y))<1)
    cmp('pressure_class','Pressure', lambda x,y: str(x)==str(y))
    cmp('end_connection','End Conn', lambda x,y: x==y)
    cmp('schedule','Schedule',       lambda x,y: x==y)
    cmp('standard','Standard',       lambda x,y: x==y)
    return {
        "item_a": {"cpse_id": str(ra['cpse_id']), "source_code": str(ra['source_code']),
                   "description": str(ra['raw_description']),
                   "national_code": str(ra['national_code'])},
        "item_b": {"cpse_id": str(rb['cpse_id']), "source_code": str(rb['source_code']),
                   "description": str(rb['raw_description']),
                   "national_code": str(rb['national_code'])},
        "semantic_score": round(sem, 4),
        "attribute_score": round(at, 4),
        "hybrid_score": round(hyb, 4),
        "decision": ("AUTO" if hyb >= T_AUTO else
                     "REVIEW" if hyb >= T_REVIEW else "REJECT"),
        "reasons": reasons,
    }

def classify_new_material(query: str) -> dict:
    norm = normalize_text(query)
    attrs = extract_attributes(norm)
    canonical = build_canonical(attrs)
    q_emb = MODEL.encode([canonical], normalize_embeddings=True)
    nc_keys = list(NATIONAL_CODES.keys())
    nc_texts = [NATIONAL_CODES[k]['canonical_desc'] for k in nc_keys]
    nc_embs = MODEL.encode(nc_texts, normalize_embeddings=True)
    sims = cosine_similarity(q_emb, nc_embs)[0]
    order = np.argsort(-sims)[:5]
    recs = []
    for idx in order:
        k = nc_keys[idx]
        members = NATIONAL_CODES[k]['members']
        rep_row = CATALOG.iloc[members[0]]
        attr_rep = {f: rep_row[f] for f in ['category','moc','size_mm','pressure_class',
                                             'end_connection','schedule','standard']}
        at = attribute_score(attrs, attr_rep)
        hyb = 0.55*float(sims[idx]) + 0.45*at
        recs.append({
            "national_code": NATIONAL_CODES[k]['code'],
            "canonical_description": NATIONAL_CODES[k]['canonical_desc'],
            "semantic_score": round(float(sims[idx]), 4),
            "attribute_score": round(at, 4),
            "hybrid_score": round(hyb, 4),
            "decision": ("MATCH_EXISTING" if hyb >= T_AUTO else
                         "REVIEW" if hyb >= T_REVIEW else "NEW"),
        })
    if not recs or recs[0]['decision'] == "NEW":
        new_code = _make_national_code(len(NATIONAL_CODES) + 1, attrs)
        action = {"action": "CREATE_NEW_NATIONAL_CODE", "national_code": new_code}
    else:
        action = {"action": "MAP_TO_EXISTING", "national_code": recs[0]['national_code']}
    return {"input": query, "normalized": norm, "canonical": canonical,
            "extracted_attributes": attrs,
            "recommendations": recs, "final_recommendation": action}

CATEGORY_CODE = {
    'VALVE':'VLV','PIPE':'PIP','FLANGE':'FLG','FITTING':'FTG','GASKET':'GSK',
    'FASTENER':'FST','BEARING':'BRG','PUMP':'PMP','MOTOR':'MTR',
    'INSTRUMENT':'INS','DRIVE':'DRV','UNKNOWN':'GEN',
}
def _check_digit(s: str) -> str:
    return str(int(hashlib.md5(s.encode()).hexdigest(), 16) % 10)
def _make_national_code(seq: int, attrs: dict) -> str:
    c = CATEGORY_CODE.get(attrs.get('category','UNKNOWN'), 'GEN')
    m = attrs.get('moc') if attrs.get('moc') and attrs['moc'] != 'UNKNOWN' else 'NA'
    sz = f"DN{int(attrs['size_mm'])}" if attrs.get('size_mm') else 'NA'
    pc = f"CL{attrs['pressure_class']}" if attrs.get('pressure_class') else 'NA'
    sub = re.sub(r'\s+','',(attrs.get('item') or 'GEN')).upper()[:12]
    base = f"{c}-{sub}-{m}-{sz}-{pc}-{seq:05d}"
    return f"{base}-{_check_digit(base)}"
