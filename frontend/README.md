# Material Master — SIH 2026 UI

Redesigned React/Vite frontend for SIH 2026 · Problem Statement 26099.

## Sidebar

Yes — this version uses a **left enterprise sidebar** instead of the old top-only navigation.

Sections:
- Workspace: Dashboard, AI Material Matching, Duplicate Review
- Master Data: National Code Generator, Material Catalog, CPSE Mapping
- Governance: Audit Trail
- System: Data Ingestion, Integration

## Run

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend expects the existing FastAPI backend at `http://localhost:8000`. The Vite development proxy maps `/api/*` to the backend.

For a separately hosted API, set:

```text
VITE_API_URL=https://your-backend.example.com
```

and build with:

```powershell
npm run build
```

## Main demo flow

Dashboard → AI Material Matching → Duplicate Review → National Code Generator → CPSE Mapping → Audit Trail.

The frontend uses the existing model-backed endpoints; the trained model bundle remains in the backend project and is not modified by this UI package.
