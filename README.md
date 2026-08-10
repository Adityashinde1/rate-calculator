# Workshop Rate Calculator

Monorepo for machining job costing: **Python FastAPI backend** + **Next.js frontend**.

## Architecture

```
rate-calculator/
├── backend/     # FastAPI + SQLAlchemy + PostgreSQL (calculation engine + REST API)
├── frontend/    # Next.js SPA (JWT auth, calls backend API)
└── docker-compose.yml
```

- All weight/cost math lives in `backend/app/calculations/`
- Frontend calls `POST /api/v1/quotes/calculate` for live breakdowns
- Job saves re-validate on the server and store immutable snapshots

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Login: `admin@workshop.local` / `changeme123`

## Local development (without Docker for apps)

### 1. PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Run tests:

```bash
pytest
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API overview

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/auth/login` | JWT login |
| GET | `/api/v1/auth/me` | Current user |
| GET/POST/PATCH/DELETE | `/api/v1/materials` | Materials CRUD |
| GET/POST/PATCH/DELETE | `/api/v1/operations` | Operations CRUD |
| GET | `/api/v1/shapes` | Shape list |
| GET/PATCH | `/api/v1/settings` | App defaults |
| GET/POST/PUT | `/api/v1/jobs` | Job quotes |
| POST | `/api/v1/quotes/calculate` | Live quote preview |

## Calculation formula

```
Weight (kg) = CrossSectionArea (mm²) × Length (mm) × Density (g/cm³) ÷ 1,000,000
Material Cost = Weight × Rate/kg
Operation Cost = Parameter Value × Rate per Unit
Plating Cost = Finished Weight × Plating Rate/kg
Final Rate = (Material + Labour) × (1 + Margin%) + Plating + Packing + Transport
```

## Cloud deploy

1. **Database** — Neon or Supabase PostgreSQL
2. **Backend** — Railway / Render / Fly.io  
   Set `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`, admin credentials
3. **Frontend** — Vercel  
   Set `NEXT_PUBLIC_API_URL` to your backend `/api/v1` URL

## License

See [LICENSE](LICENSE).
