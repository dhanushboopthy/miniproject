# Anganwadi Smart Health Monitoring System — Runbook

**Stack:** FastAPI (Uvicorn) · React (Vite) · MongoDB · OpenRouter AI  
**Project root:** `MiniProject/`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Setup](#2-environment-setup)
3. [Start MongoDB](#3-start-mongodb)
4. [Start the Backend](#4-start-the-backend)
5. [Start the Frontend](#5-start-the-frontend)
6. [Seed Demo Data](#6-seed-demo-data)
7. [Run Tests](#7-run-tests)
8. [Key URLs & Credentials](#8-key-urls--credentials)
9. [Common Errors & Fixes](#9-common-errors--fixes)
10. [Stopping Everything](#10-stopping-everything)

---

## 1. Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| MongoDB | 6+ | `mongod --version` |

---

## 2. Environment Setup

### 2a. Backend — Python virtual environment

```bash
cd MiniProject/backend

python3 -m venv venv
source venv/bin/activate        # Linux / macOS
# venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

### 2b. Backend — `.env` file

`backend/.env` already exists. Open it and confirm these values are set:

```env
MONGO_URI=mongodb://localhost:27017/anganwadi

JWT_SECRET=your-super-secret-key-change-this-in-production-12345
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

FRONTEND_URL=http://localhost:5173

# Required for AI nutrition analysis & meal plan generation
OPENROUTER_API_KEY=sk-or-...your-key...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_PRIMARY_MODEL=anthropic/claude-3-haiku
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3-8b-instruct

# Optional — leave blank to skip SMS/email alerts
FAST2SMS_API_KEY=
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=
```

> Get a free OpenRouter API key at https://openrouter.ai

### 2c. Frontend — install packages

```bash
cd MiniProject/frontend
npm install
```

---

## 3. Start MongoDB

```bash
# Start MongoDB (run once — keep it running in the background)
mongod --dbpath /data/db

# Verify it is up
mongosh --eval "db.adminCommand('ping')"
# Expected output: { ok: 1 }
```

> If `/data/db` does not exist: `sudo mkdir -p /data/db && sudo chown $USER /data/db`

---

## 4. Start the Backend

Open **Terminal 1**:

```bash
cd MiniProject/backend
source venv/bin/activate

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx]
INFO:     Application startup complete.
```

The backend is ready when you see **Application startup complete**.  
`--reload` auto-restarts on any file change.

---

## 5. Start the Frontend

Open **Terminal 2** (keep Terminal 1 running):

```bash
cd MiniProject/frontend
npm run dev
```

Expected output:

```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open **http://localhost:5173** in your browser.

---

## 6. Seed Demo Data

Run this **once** after MongoDB and the backend are both up.  
Creates AWC centers, users, children, growth records, nutrition logs, and alerts.

Open **Terminal 3**:

```bash
cd MiniProject/backend
source venv/bin/activate

python -m seed.demo_data
```

Expected output:

```
Clearing demo collections...
Seeding AWC Centers...
Seeding Users...
Seeding Children...
Seeding Growth Records...
Seeding Nutrition Logs...
Seeding Alerts...

✅ Demo data seeding complete!

📋 Demo Credentials:
   Admin:      admin@icds.gov.in / admin123
   Supervisor: supervisor1@icds.gov.in / supervisor123
   Worker:     worker_TN-BNG-001_1@icds.gov.in / worker123
```

> ⚠️ This script clears all collections before inserting. Never run in production.

---

## 7. Run Tests

```bash
cd MiniProject/backend
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific file
pytest tests/test_auth.py -v
pytest tests/test_growth.py -v
```

---

## 8. Key URLs & Credentials

### URLs

| URL | What opens |
|---|---|
| http://localhost:5173 | React frontend |
| http://localhost:8000/docs | FastAPI Swagger — interactive API explorer |
| http://localhost:8000/redoc | FastAPI ReDoc |

### Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@icds.gov.in | admin123 |
| Supervisor | supervisor1@icds.gov.in | supervisor123 |
| Worker | worker_TN-BNG-001_1@icds.gov.in | worker123 |

### Key API Endpoints

```
POST  /auth/login                    Login → returns JWT access token
POST  /auth/signup                   Self-register as a worker
GET   /auth/me                       Current user profile

GET   /children/                     List children (role-filtered)
GET   /children/with-status          Children + latest growth status
POST  /children/                     Register a new child
GET   /children/{child_id}           Child profile

POST  /growth/measurement            Log measurement → auto-classifies SAM/MAM
GET   /growth/{child_id}             Full growth history
GET   /growth/{child_id}/latest      Latest measurement
GET   /growth/{child_id}/chart-data  Recharts-formatted growth data

POST  /nutrition/log                 Log diet → triggers AI analysis (background)
GET   /nutrition/{child_id}/history  Past nutrition logs

POST  /mealplan/generate             Generate AI 7-day meal plan
GET   /mealplan/{child_id}/latest    Latest meal plan

GET   /alerts                        Alerts for user's AWC
POST  /alerts/{id}/acknowledge       Mark alert as seen
POST  /alerts/{id}/resolve           Mark alert as resolved
GET   /alerts/stats/active-count     Count for dashboard badge

GET   /reports/awc/monthly           Monthly AWC report
GET   /reports/nutrition/trend       30-day nutrition trend

GET   /admin/users                   List all users  (admin only)
POST  /admin/users                   Create a user   (admin only)
```

---

## 9. Common Errors & Fixes

### Backend won't start

| Error | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'fastapi'` | Virtual env not active — run `source venv/bin/activate` |
| `[Errno 98] Address already in use` on port 8000 | Find and kill the process: `lsof -i:8000` → `kill <PID>` |
| `ServerSelectionTimeoutError` (MongoDB) | MongoDB is not running — start it with `mongod --dbpath /data/db` |
| `ValidationError` for `OPENROUTER_API_KEY` | `backend/.env` is missing or the key is empty |

### Frontend won't start

| Error | Fix |
|---|---|
| `sh: vite: not found` | Run `npm install` inside `MiniProject/frontend/` |
| `EADDRINUSE :5173` | Port taken — Vite auto-selects the next free port; check terminal output for the actual URL |
| Blank page / API errors in console | Backend not running, or `FRONTEND_URL` in `.env` doesn't match `http://localhost:5173` |

### Login errors

| Error | Fix |
|---|---|
| `401 Invalid credentials` | Wrong email or password; re-run `python -m seed.demo_data` to reset |
| `403 User has no AWC assigned` | The logged-in worker has no `awc_code`; set it via the Admin page |

### AI analysis stuck / not appearing

AI runs as a **background task** — it is not instant after logging a diet.

1. Log a diet entry for a child
2. Wait 15–30 seconds and refresh the child profile
3. If it never appears, check for errors in the DB:

```bash
# From the MongoDB shell
mongosh anganwadi --eval \
  'db.nutrition_logs.find({"ai_analysis_error":{"$exists":true}}).pretty()'
```

| Root cause | Fix |
|---|---|
| `OpenRouter error 401` | `OPENROUTER_API_KEY` is wrong or missing in `.env` — restart backend after fixing |
| `OpenRouter error 429` | Rate limit hit — wait a minute and try again |
| `Invalid JSON from AI` | Model returned plain text — transient issue, retry the diet log |

### Alerts not created after measurement

Alerts fire synchronously during `POST /growth/measurement`.  
If no alert appears after a SAM/MAM measurement:
- Confirm the measurement was saved: `GET /growth/{child_id}/latest`
- SAM threshold: WHZ < −3.0 **or** MUAC < 11.5 cm
- MAM threshold: WHZ between −3.0 and −2.0
- Check backend terminal logs for any Python exceptions

---

## 10. Stopping Everything

```bash
# Terminal 1 (backend)   → Ctrl + C
# Terminal 2 (frontend)  → Ctrl + C

# MongoDB
mongod --shutdown
# or just Ctrl+C in the mongod terminal
```

---

*Anganwadi Smart Health Monitoring System — ICDS Tamil Nadu*
