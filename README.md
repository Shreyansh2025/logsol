# Material Master — One Nation, One Material Code

SIH 2026 · PS 26099

This package contains the React/Vite demo UI, FastAPI backend, and the supplied trained material-matching model bundle.

## Included

- `backend/` — FastAPI API + matching/classification engine
- `backend/artifacts/` — supplied SBERT model, catalog, embeddings, national-code data and config
- `frontend/` — React + Vite + Tailwind UI
- `start_backend.bat` / `start_frontend.bat` — Windows helpers

## 1. Run the backend

Open Terminal 1:

```powershell
cd material-master\backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The backend loads the model from `backend/artifacts/material-sbert-ft`.

## 2. Run the frontend

Open Terminal 2:

```powershell
cd material-master\frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

`http://localhost:5173`

The development proxy forwards `/api` requests to `http://localhost:8000`.

## 3. Main demo flow

1. Dashboard — material/code metrics and reviewer actions.
2. Match Review — duplicate clusters, approve/reject and explain the AI match.
3. National Code Generator — enter a material description and get an existing-code mapping or new-code recommendation.
4. Ingest Data — queue CSV/XLSX files for the demo ingestion flow.

## 4. Production deployment

The frontend supports `VITE_API_URL` for a separately hosted API:

```powershell
npm run build
```

Set `VITE_API_URL` to the public FastAPI base URL during the frontend build/deployment.

For the backend, use a Python/Docker host such as Render, Fly.io, or another server capable of running the model.

## Important

The `Ingest Data` page currently demonstrates the upload UX only; it does not send the selected files to a backend ingestion endpoint. The trained model itself is wired into `/search`, `/match/explain`, and `/national-code/new`.
