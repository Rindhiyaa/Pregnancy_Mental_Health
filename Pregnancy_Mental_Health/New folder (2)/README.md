# Postpartum Risk Insight

Modern healthcare SaaS-style app to predict postpartum depression risk with explainability. Stack: FastAPI + PostgreSQL + Vite/React/Tailwind.

## Quick start (Docker)

```bash
docker-compose up --build
```

Backend: http://localhost:8000  
Frontend: http://localhost:5173  
Postgres: localhost:5432 (user/pass postgres/postgres)

## Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Key endpoints:
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/predict`
- `GET /api/assessments`, `GET /api/assessments/{id}`
- `GET/POST /api/tasks`
- `GET/POST/PATCH /api/admin/*`
- `GET /api/analytics/summary`

Run migrations:

```bash
cd backend
alembic upgrade head
```

## Frontend (React + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

Routes: landing page, login, clinician dashboard, assessment wizard, results, history, tasks, admin, analytics, patient self-assessment.

## ML

`app/ml/model.py` holds a pluggable `ModelService`. Replace the mock with a trained model (scikit/ONNX/etc.), keep the `predict(features)` interface returning probability, label, top_features, model_version.

## Environment

Use env vars (see `.env.example` values): `DATABASE_URL`, `JWT_SECRET`, `MODEL_VERSION`, `ML_ENABLED`.


