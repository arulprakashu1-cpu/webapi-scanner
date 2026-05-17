# ScanAPI – API Security Scanner MVP

A full-stack web application for scanning REST APIs for OWASP API Security Top 10 vulnerabilities.

## Quick Start (Windows)

```powershell
cd "d:\cl API\webapi-scanner"
.\start.ps1
```

Then open: **http://localhost:5173**

**Demo login:** `demo@scanapi.io` / `demo1234`

---

## Manual Setup

### Backend (FastAPI)

```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000
```

### Frontend (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

---

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

---

## Architecture

```
webapi-scanner/
├── backend/          FastAPI + SQLite + background scan workers
│   └── src/
│       ├── auth/     JWT authentication
│       ├── scans/    Scan management + mock OWASP scanner
│       ├── reports/  JSON/CSV export
│       └── usage/    Quota tracking
└── frontend/         React 18 + Vite + Tailwind CSS
    └── src/
        ├── pages/    Landing, Login, Dashboard, NewScan, ScanDetail
        ├── components/ Layout, Navbar, FindingItem, Badges
        └── api/      Axios client + typed API wrappers
```

## Features

- **Authentication** – JWT login/register, persisted across sessions
- **Demo data** – Pre-seeded scans and findings on first launch
- **Real-time scanning** – Progress bar updates as mock scanner runs
- **OWASP API Top 10** – 16 realistic findings from all categories
- **Severity filtering** – Filter findings by Critical/High/Medium/Low/Info
- **Export** – Download findings as JSON or CSV
- **Usage tracking** – Free tier: 8 scans/month

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Auth | JWT (python-jose), bcrypt |
| Scanner | Mock OWASP scanner (drop-in for OWASP ZAP) |
