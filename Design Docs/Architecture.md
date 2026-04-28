# 🏥 Anganwadi Smart Health Monitoring System
### Combined Growth Measurement & Effective Data Management under ICDS

> **Mini Project Planning Document** | Tamil Nadu ICDS Deployment  
> Tech Stack: FastAPI · React · MongoDB · OpenRouter API  
> Version: 1.0 | Status: Planning Phase

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Core Objectives](#3-core-objectives)
4. [System Architecture](#4-system-architecture)
5. [Tech Stack & Justification](#5-tech-stack--justification)
6. [Authentication & Authorization Design](#6-authentication--authorization-design)
7. [Database Schema (MongoDB)](#7-database-schema-mongodb)
8. [Module-wise Detailed Plan](#8-module-wise-detailed-plan)
9. [API Endpoint Design (FastAPI)](#9-api-endpoint-design-fastapi)
10. [OpenRouter AI Integration](#10-openrouter-ai-integration)
11. [Alert Engine Design](#11-alert-engine-design)
12. [Frontend Dashboard Plan (React)](#12-frontend-dashboard-plan-react)
13. [Project Phases & Timeline](#13-project-phases--timeline)
14. [Folder Structure](#14-folder-structure)
15. [Risk & Mitigation](#15-risk--mitigation)

---

## 1. Project Overview

The **Anganwadi Smart Health Monitoring System** is a digital-first platform designed to replace the traditional paper-based "red register" system used in ICDS (Integrated Child Development Services) centers across India. It provides Anganwadi Workers (AWW), Supervisors, and CDPOs with a smart, AI-assisted workflow for child health monitoring, malnutrition detection, nutrient gap analysis, and hierarchical reporting — all optimized for low-connectivity rural environments via a Progressive Web App (PWA).

| Attribute | Details |
|-----------|---------|
| Target Users | Anganwadi Workers, Sector Supervisors, CDPOs |
| Deployment Region | Tamil Nadu (extendable nationwide) |
| Primary Goal | Early malnutrition detection & AI-driven nutrition guidance |
| AI Integration | OpenRouter API (Claude / Llama) |
| Offline Support | Yes — PWA with Service Workers |

---

## 2. Problem Statement

Anganwadi centers under ICDS still rely on paper registers for tracking child growth. This causes:

- **Delayed malnutrition detection** — SAM/MAM cases go unnoticed for weeks
- **Inconsistent nutrient analysis** — No standard tool for diet assessment
- **Poor data rollup** — Block/District-level reporting is manual and error-prone
- **No alert mechanism** — At-risk children aren't flagged in real time
- **No personalized guidance** — Workers lack tools for meal recommendations

This system replaces all of the above with a **digital, AI-assisted workflow**.

---

## 3. Core Objectives

- Digitize child enrollment and anthropometric measurement records
- Auto-classify nutritional status using WHO Growth Standards (SAM / MAM / Normal)
- AI-powered nutrient gap analysis and personalized meal recommendations via OpenRouter
- Smart alert system for at-risk children (SMS + email + in-app)
- Role-based access — Anganwadi Worker → Supervisor → CDPO
- Hierarchical reporting — AWC → Sector → Block → District
- PWA support for offline usage in rural low-connectivity areas

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React PWA)                      │
│   Worker Dashboard | Supervisor View | CDPO Reports | Charts     │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS REST API
┌──────────────────────────────▼──────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  Auth Router | Children Router | Growth Router | Nutrition Router│
│  Alerts Router | Reports Router | Meal Plan Router               │
│  Background Tasks (AI Analysis, Alerts, PDF Generation)          │
└──────┬───────────────────────┬──────────────────────────────────┘
       │                       │
┌──────▼──────┐       ┌────────▼──────────────────────────────────┐
│  MongoDB    │       │         External Services                  │
│  Atlas      │       │  OpenRouter API (Claude / Llama)           │
│  (Database) │       │  Fast2SMS (SMS Alerts)                     │
│             │       │  Email (SMTP / SendGrid)                   │
└─────────────┘       └───────────────────────────────────────────┘
```

**Data Flow:**
1. Worker logs measurement on React PWA (works offline, syncs when connected)
2. FastAPI receives data, stores in MongoDB
3. Z-score is auto-calculated, nutritional status classified
4. If SAM/MAM detected → Alert Engine triggers → SMS/Email/In-app notification
5. Worker logs diet → FastAPI sends prompt to OpenRouter → AI returns nutrient analysis
6. Dashboard displays growth charts, AI analysis, and recommended meal plan

---

## 5. Tech Stack & Justification

### Backend — FastAPI (Python)
- Async support — handles concurrent AI analysis requests without blocking
- Built-in OpenAPI docs — easy API testing during development
- `BackgroundTasks` — offloads AI calls so UI stays responsive
- JWT authentication — lightweight, stateless, scalable

### Frontend — React
- Component-based — reusable cards, charts, forms across modules
- Recharts — lightweight charting library for growth curve visualization
- PWA (Service Workers + IndexedDB) — offline measurement entry in rural areas
- Role-based UI rendering based on JWT claims

### Database — MongoDB Atlas
- Document model — child's growth snapshots are naturally nested documents
- Schema-flexible — nutrition logs vary in structure
- Atlas Search — for fast querying across AWC/Block/District levels

### AI — OpenRouter API
- Model flexibility — switch between Claude (high accuracy) and Llama (low cost)
- Structured JSON output — prompts engineered to return parseable nutrition data
- Async integration — won't block API responses

### Additional Libraries
| Purpose | Library |
|---------|---------|
| PDF Export | WeasyPrint / ReportLab |
| SMS Alerts | Fast2SMS (India-focused, affordable) |
| Email | SMTP via `smtplib` or SendGrid |
| WHO Z-score calc | `igrowup` Python library or custom LMS table |
| Password Hashing | `bcrypt` via `passlib` |
| Token Auth | `python-jose` (JWT) |

---

## 6. Authentication & Authorization Design

This is a **critical module** for a government health system. Multiple roles access different levels of data.

### 6.1 User Roles

| Role | Code | Access Scope |
|------|------|-------------|
| Anganwadi Worker | `worker` | Own AWC children only |
| Sector Supervisor | `supervisor` | All AWCs in assigned sector |
| CDPO (Child Dev. Project Officer) | `cdpo` | All sectors in block |
| District Officer | `district` | All blocks in district |
| System Admin | `admin` | Full system access |

### 6.2 JWT Token Design

**Token Payload (Claims):**
```json
{
  "sub": "user_id_here",
  "name": "Priya Devi",
  "role": "worker",
  "awc_code": "TN-CBE-01-007",
  "sector_code": "TN-CBE-01",
  "block_code": "TN-CBE",
  "district_code": "TN",
  "exp": 1716000000
}
```

**Token Strategy:**
- **Access Token** — short-lived (30 minutes), sent in `Authorization: Bearer <token>` header
- **Refresh Token** — long-lived (7 days), stored in `HttpOnly` cookie (prevents XSS theft)
- Refresh endpoint issues new access token without re-login

### 6.3 FastAPI Auth Implementation Plan

```
/auth/
  POST /register          ← Admin only, creates new users
  POST /login             ← Returns access_token + sets refresh cookie
  POST /refresh           ← Uses HttpOnly cookie to return new access_token
  POST /logout            ← Clears refresh token cookie
  GET  /me                ← Returns current user profile
  POST /change-password   ← Authenticated users can change own password
```

**Dependency Injection Pattern:**
```python
# Reusable auth dependencies in FastAPI
get_current_user()          # Validates JWT, returns user object
require_role("supervisor")  # Raises 403 if role doesn't match
require_awc_access(awc_code) # Ensures worker only accesses own AWC
```

### 6.4 Authorization Matrix

| Endpoint | Worker | Supervisor | CDPO | Admin |
|----------|--------|-----------|------|-------|
| View own AWC children | ✅ | ✅ | ✅ | ✅ |
| Add child / measurement | ✅ | ✅ | ❌ | ✅ |
| View other AWC data | ❌ | ✅ (sector) | ✅ (block) | ✅ |
| Generate block report | ❌ | ❌ | ✅ | ✅ |
| Create users | ❌ | ❌ | ❌ | ✅ |
| Resolve alerts | ✅ | ✅ | ✅ | ✅ |
| Export district PDF | ❌ | ❌ | ✅ | ✅ |

### 6.5 Security Checklist

- Passwords hashed with `bcrypt` (never stored plaintext)
- All endpoints behind JWT validation (no public endpoints except `/auth/login`)
- Rate limiting on `/auth/login` — max 5 attempts per 15 minutes (use `slowapi`)
- HTTPS enforced in production (Nginx reverse proxy with SSL)
- CORS restricted to frontend domain only
- Sensitive fields (Aadhaar) encrypted at rest using `cryptography` library (AES-256)
- MongoDB — field-level access control, Atlas IP allowlist

---

## 7. Database Schema (MongoDB)

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "Priya Devi",
  "email": "priya@anganwadi.tn.gov.in",
  "hashed_password": "bcrypt_hash",
  "role": "worker",
  "awc_code": "TN-CBE-01-007",
  "sector_code": "TN-CBE-01",
  "block_code": "TN-CBE",
  "district_code": "TN",
  "phone": "9876543210",
  "is_active": true,
  "created_at": "ISODate",
  "last_login": "ISODate"
}
```

### Collection: `awc_centers`
```json
{
  "_id": "ObjectId",
  "awc_code": "TN-CBE-01-007",
  "name": "Kavitha Nagar AWC",
  "address": "12, Main Road, Kavitha Nagar",
  "block": "Coimbatore South",
  "district": "Coimbatore",
  "worker_ids": ["ObjectId1", "ObjectId2"],
  "supervisor_id": "ObjectId",
  "lat_lng": [11.0168, 76.9558],
  "created_at": "ISODate"
}
```

### Collection: `children`
```json
{
  "_id": "ObjectId",
  "child_id": "TN-CBE-01-007-0023",
  "name": "Kavya",
  "dob": "2021-05-15",
  "gender": "female",
  "awc_code": "TN-CBE-01-007",
  "parent_name": "Lakshmi",
  "parent_contact": "9876543210",
  "aadhaar_encrypted": "encrypted_string",
  "enrollment_date": "ISODate",
  "is_active": true,
  "created_by": "user_ObjectId",
  "created_at": "ISODate"
}
```

### Collection: `growth_records`
```json
{
  "_id": "ObjectId",
  "child_id": "TN-CBE-01-007-0023",
  "measurement_date": "2024-11-01",
  "age_months": 42,
  "weight_kg": 11.5,
  "height_cm": 94.0,
  "muac_cm": 12.8,
  "z_scores": {
    "waz": -1.8,
    "haz": -1.2,
    "whz": -2.1
  },
  "status": "MAM",
  "measured_by": "user_ObjectId",
  "created_at": "ISODate"
}
```

### Collection: `nutrition_logs`
```json
{
  "_id": "ObjectId",
  "child_id": "TN-CBE-01-007-0023",
  "log_date": "2024-11-01",
  "food_items": [
    { "name": "Rice", "quantity_g": 150 },
    { "name": "Dal", "quantity_g": 80 },
    { "name": "Egg", "quantity_g": 50 }
  ],
  "ai_analysis": {
    "deficiencies": [
      { "nutrient": "Iron", "severity": "moderate" },
      { "nutrient": "Vitamin A", "severity": "mild" }
    ],
    "suggested_foods": ["Moringa leaves", "Ragi", "Drumstick", "Sesame seeds"],
    "referral_needed": false,
    "model_used": "claude-3-haiku",
    "generated_at": "ISODate"
  },
  "logged_by": "user_ObjectId",
  "created_at": "ISODate"
}
```

### Collection: `meal_plans`
```json
{
  "_id": "ObjectId",
  "child_id": "TN-CBE-01-007-0023",
  "week_start": "2024-11-04",
  "generated_by": "AI",
  "days": [
    {
      "day": "Monday",
      "breakfast": "Ragi porridge with banana",
      "lunch": "Rice, sambar, moringa leaves stir-fry",
      "snack": "Boiled egg",
      "dinner": "Khichdi with vegetables"
    }
  ],
  "created_at": "ISODate"
}
```

### Collection: `alerts`
```json
{
  "_id": "ObjectId",
  "child_id": "TN-CBE-01-007-0023",
  "awc_code": "TN-CBE-01-007",
  "type": "SAM_DETECTED",
  "severity": "critical",
  "message": "Child dropped to SAM status — immediate action required",
  "triggered_at": "ISODate",
  "resolved": false,
  "resolved_at": null,
  "resolved_by": null,
  "notified_via": ["sms", "in_app"],
  "follow_up_visit_scheduled": true
}
```

### Collection: `refresh_tokens`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "token_hash": "hashed_refresh_token",
  "expires_at": "ISODate",
  "is_revoked": false,
  "created_at": "ISODate"
}
```

### MongoDB Indexes

```python
# Performance indexes to create
children: [("awc_code", 1), ("child_id", 1, unique=True)]
growth_records: [("child_id", 1), ("measurement_date", -1)]
alerts: [("awc_code", 1), ("resolved", 1), ("severity", 1)]
users: [("email", 1, unique=True), ("awc_code", 1)]
nutrition_logs: [("child_id", 1), ("log_date", -1)]
```

---

## 8. Module-wise Detailed Plan

### Module 1 — Child Registration

**Purpose:** Digital enrollment of children into AWC records.

**Key Fields:** Name, DOB, Gender, AWC Code, Parent Details, Aadhaar (optional, encrypted)

**Auto-generation:** Child ID = `{AWC_CODE}-{4-digit-sequence}` (e.g., `TN-CBE-01-007-0023`)

**Business Rules:**
- Worker can only register children in their assigned AWC
- Duplicate detection by name + DOB + parent contact
- Aadhaar stored AES-256 encrypted (never plaintext)

---

### Module 2 — Growth Measurement

**Purpose:** Record and classify anthropometric measurements.

**Inputs:** Weight (kg), Height (cm), MUAC (cm), Date of measurement

**WHO Z-score Calculation:**
- WAZ (Weight-for-Age Z-score)
- HAZ (Height-for-Age Z-score)
- WHZ (Weight-for-Height Z-score)
- Calculated using WHO LMS (Lambda-Mu-Sigma) reference tables

**Classification Logic:**
```
WHZ < -3 SD  → SAM (Severe Acute Malnutrition) — Red
WHZ -3 to -2 → MAM (Moderate Acute Malnutrition) — Yellow
WHZ > -2 SD  → Normal — Green
MUAC < 11.5cm → SAM (secondary indicator)
MUAC 11.5–12.5cm → MAM
```

**Visualization:** Individual growth trajectory chart (Recharts line chart) overlaid on WHO reference bands (P3, P15, P50, P85, P97 percentile bands).

---

### Module 3 — AI Nutrient Analysis (Key Differentiator)

**Purpose:** Use LLM to analyze diet logs and generate personalized nutrition guidance.

**Worker Flow:**
1. Log daily diet items + approximate quantities
2. System queues analysis task (FastAPI BackgroundTask)
3. Structured prompt sent to OpenRouter API
4. JSON response parsed and stored in `nutrition_logs.ai_analysis`
5. Dashboard displays deficiencies, recommended foods, and 7-day meal plan

**Prompt Engineering Strategy:** See Section 10.

---

### Module 4 — Alert Engine

**Purpose:** Automatically flag at-risk children and notify stakeholders.

**Trigger Types:**

| Trigger | Condition | Severity |
|---------|-----------|----------|
| SAM Detected | WHZ < -3 or MUAC < 11.5 | Critical |
| New SAM Entry | First SAM classification | Critical |
| MAM Detected | WHZ -3 to -2 | High |
| Weight Loss | Consecutive weight decrease over 2 visits | High |
| Missed Measurement | No measurement for 30+ days | Medium |
| AI High-Risk Flag | LLM identifies severe deficiency pattern | High |
| Referral Needed | LLM returns `referral_needed: true` | Critical |

**Notification Channels:** SMS (Fast2SMS), Email, In-app notification

---

### Module 5 — Meal Planner

**Purpose:** Generate culturally localized 7-day meal plans.

**Features:**
- ICDS standard recipes as base templates
- AI-generated alternatives using OpenRouter
- Tamil Nadu regional foods: ragi, moringa, horsegram, tamarind, sesame
- Output: Downloadable PDF (WeasyPrint)
- Food items tagged with approximate cost for BPL family budgets

---

### Module 6 — Reports & Analytics

**Purpose:** Hierarchical reporting for program monitoring.

**AWC Level:**
- Monthly register (all children, status, measurements)
- Attendance summary
- SAM/MAM case count

**Block/District Level:**
- SAM/MAM trend charts (Recharts line chart)
- Nutritional status distribution (Recharts bar/pie chart)
- Comparison across AWCs within sector/block

**Exports:** PDF (WeasyPrint), Excel (openpyxl)

---

## 9. API Endpoint Design (FastAPI)

### Authentication Routes
```
POST   /auth/register            ← Admin only
POST   /auth/login               ← Returns JWT access_token
POST   /auth/refresh             ← Refresh access token
POST   /auth/logout              ← Revoke refresh token
GET    /auth/me                  ← Current user profile
POST   /auth/change-password     ← Change own password
```

### Children Routes
```
GET    /children/?awc_code=      ← List children (role-filtered)
POST   /children/                ← Register new child (worker/admin)
GET    /children/{child_id}      ← Get child profile
PUT    /children/{child_id}      ← Update child info
DELETE /children/{child_id}      ← Soft delete (admin only)
```

### Growth Measurement Routes
```
POST   /growth/measurement                  ← Add measurement
GET    /growth/{child_id}                   ← Full growth history
GET    /growth/{child_id}/latest            ← Latest measurement
GET    /growth/{child_id}/chart-data        ← Recharts formatted data
```

### Nutrition Routes
```
POST   /nutrition/log                       ← Log diet items
GET    /nutrition/{child_id}/analysis       ← Trigger/fetch AI analysis
GET    /nutrition/{child_id}/history        ← Past nutrition logs
```

### Meal Plan Routes
```
POST   /mealplan/generate                   ← Generate AI meal plan (async)
GET    /mealplan/{child_id}/latest          ← Latest meal plan
GET    /mealplan/{child_id}/pdf             ← Download PDF meal plan
```

### Alert Routes
```
GET    /alerts/?awc_code=&resolved=false    ← Active alerts
PUT    /alerts/{alert_id}/resolve           ← Mark alert resolved
GET    /alerts/{child_id}/history           ← Alert history for child
```

### Report Routes
```
GET    /reports/awc/{awc_code}/monthly?month=2024-11    ← AWC monthly
GET    /reports/block/{block_code}/summary              ← Block summary
GET    /reports/awc/{awc_code}/export?format=pdf        ← PDF export
GET    /reports/block/{block_code}/export?format=excel  ← Excel export
```

### Admin Routes
```
GET    /admin/users                         ← List all users
POST   /admin/users                         ← Create user
PUT    /admin/users/{user_id}               ← Update user/role
DELETE /admin/users/{user_id}              ← Deactivate user
GET    /admin/awc-centers                   ← List AWC centers
```

---

## 10. OpenRouter AI Integration

### Configuration
```python
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
PRIMARY_MODEL = "anthropic/claude-3-haiku"   # Accurate, affordable
FALLBACK_MODEL = "meta-llama/llama-3-8b-instruct"  # Free tier fallback
```

### Nutrient Analysis Prompt Template
```python
NUTRIENT_ANALYSIS_PROMPT = """
You are a pediatric nutritionist supporting ICDS (Integrated Child Development 
Services) workers in Tamil Nadu, India.

Child Profile:
- Name: {name}
- Age: {age_months} months ({age_years} years)
- Weight: {weight_kg} kg | Height: {height_cm} cm
- MUAC: {muac_cm} cm
- Current Growth Status: {status}
- Last 7 days diet log: {diet_log}
- Region: Tamil Nadu, India

Tasks:
1. Identify the top 3 nutrient deficiencies with severity (mild/moderate/severe)
2. For each deficiency, suggest 3 locally available, affordable Tamil Nadu foods
3. Generate a 7-day meal plan using ICDS supplementary nutrition guidelines
   (consider foods like ragi, moringa, horsegram, tamarind, sesame, drumstick)
4. Flag if child needs immediate medical referral (true/false with reason)

Respond ONLY in the following JSON format with no additional text:
{
  "deficiencies": [
    { "nutrient": "Iron", "severity": "moderate", 
      "foods": ["Moringa leaves", "Sesame seeds", "Horsegram"] }
  ],
  "meal_plan": [
    { "day": "Monday", "breakfast": "...", "lunch": "...", 
      "snack": "...", "dinner": "..." }
  ],
  "referral_needed": false,
  "referral_reason": null,
  "summary": "Brief 2-sentence summary for the Anganwadi worker"
}
"""
```

### FastAPI Async Integration
```python
# In nutrition router
@router.post("/nutrition/log")
async def log_nutrition(data: NutritionLogIn, background_tasks: BackgroundTasks,
                        current_user=Depends(get_current_user)):
    # Save log immediately (fast response to worker)
    log_id = await nutrition_service.save_log(data)
    # Trigger AI analysis in background (doesn't block response)
    background_tasks.add_task(run_ai_analysis, log_id, data)
    return {"message": "Log saved. AI analysis in progress.", "log_id": log_id}
```

### Error Handling for AI Calls
- Timeout: 30 seconds max per OpenRouter call
- Retry: 2 retries with exponential backoff on 429/503 errors
- Fallback: If AI fails, store log without analysis, retry later via scheduled job
- JSON parse error: Store raw response, log error, notify admin

---

## 11. Alert Engine Design

### Alert Flow
```
New Growth Record Saved
        │
        ▼
  Rule Checker (sync)
  ├── SAM/MAM? → Create alert
  ├── Weight loss trend? → Create alert
  └── Missed measurement? → Scheduled job checks daily
        │
        ▼
  Alert Document Created in MongoDB
        │
        ▼
  Notification Dispatcher (background task)
  ├── SMS → Fast2SMS API (worker + parent)
  ├── Email → Worker + Supervisor
  └── In-app → WebSocket push or polling
        │
        ▼
  Follow-up Task Created
  (visit scheduled for worker)
```

### Fast2SMS Integration
```python
async def send_sms_alert(phone: str, child_name: str, status: str):
    payload = {
        "route": "q",
        "message": f"ALERT: {child_name} is classified as {status}. "
                   f"Please conduct a home visit immediately. - ICDS Tamil Nadu",
        "numbers": phone,
        "flash": 0
    }
    # POST to Fast2SMS API with your API key
```

---

## 12. Frontend Dashboard Plan (React)

### Pages & Components

```
/login                  → LoginPage
/dashboard              → DashboardHome (role-adaptive)
/children               → ChildrenList (AWC-filtered)
/children/new           → RegisterChildForm
/children/:id           → ChildProfile
  ├── GrowthChart       → Recharts line chart + WHO bands
  ├── LatestStatus      → SAM/MAM/Normal badge
  ├── NutritionSummary  → AI analysis display
  └── AlertHistory      → Past alerts for this child
/growth/new             → MeasurementForm
/nutrition/log          → DietLogForm
/mealplan/:childId      → MealPlanView (with PDF download)
/alerts                 → AlertsDashboard (active/resolved)
/reports                → ReportsPage
  ├── AWCMonthlyReport
  └── BlockSummaryCharts
/admin/users            → UserManagement (admin only)
```

### Key React Decisions

- **Axios** with interceptors for attaching JWT to all API calls
- **React Query** (TanStack Query) for server state, caching, background refetch
- **Zustand** for global state (current user, role, AWC context)
- **React Router v6** for navigation + route guards per role
- **Recharts** for growth curves, bar charts, pie charts
- **PWA** — `vite-plugin-pwa` with Workbox for service worker + offline cache
- **IndexedDB** (via `idb`) to queue measurements offline for later sync

### Growth Chart Design (Recharts)
```
Components:
- WHO reference band area (background shading: green/yellow/red zones)
- Child's weight-for-age line (ComposedChart with Area + Line)
- Reference data points (ReferenceLine for WHO median)
- Tooltip showing date, weight, z-score, status on hover
```

### PWA Offline Strategy
- **Measurement entry** works offline → stored in IndexedDB
- **Background sync** → when connectivity returns, sync queued measurements
- **Cached data** → last loaded children list available offline
- **Alert banner** → "You are offline — data will sync when connected"

---

## 13. Phase-wise Implementation

This section converts the roadmap into an implementation checklist per phase, aligned to backend, frontend, data, and operations.

### Phase 1 — Foundation (Week 1–2)
**Goal:** Stand up core infrastructure, authentication, and basic data flow.

**Backend**
- Project scaffold: `main.py`, routers, middleware, CORS
- MongoDB connection layer + base collections
- JWT auth: login, refresh, logout, `/me`
- Role-based dependencies: `require_role`, `require_awc_access`

**Frontend**
- Vite + React setup, routing, protected routes
- Login screen + auth state store

**Data**
- Create Atlas collections and indexes
- Seed admin user + sample AWC

**Acceptance Criteria**
- Admin can create users and AWC centers
- Worker can login and access own AWC scope
- Child registration works end-to-end via API

**Deliverable:** Authenticated app shell with child registration

---

### Phase 2 — Core Monitoring (Week 3–4)
**Goal:** Capture measurements and compute nutrition status with charts.

**Backend**
- WHO LMS tables integration and Z-score calculation service
- Growth measurement APIs + status classification (SAM/MAM/Normal)
- Child profile API with measurement history

**Frontend**
- Children list + child profile pages
- Measurement entry form
- Growth chart with WHO bands

**Data**
- Unit test Z-score calculation with known values

**Acceptance Criteria**
- Worker can log measurements
- Status auto-classifies correctly
- Growth chart renders with history and status

**Deliverable:** Measurement entry + growth chart working

---

### Phase 3 — AI Nutrition (Week 5)
**Goal:** AI-assisted diet analysis and meal plan generation.

**Backend**
- Nutrition log API + background task for AI
- OpenRouter client with retries and JSON validation
- Meal plan generation endpoint + storage
- PDF export for meal plan

**Frontend**
- Diet log form
- Nutrition analysis view on child profile
- Meal plan page with PDF download

**Data**
- Store AI response and raw fallback on parse errors

**Acceptance Criteria**
- Diet logs queue AI analysis and return results
- AI analysis persists and renders in UI
- Meal plan is generated and downloadable

**Deliverable:** Diet log to AI insight + meal plan output

---

### Phase 4 — Alerts & Reports (Week 6)
**Goal:** Proactive alerts and operational reporting.

**Backend**
- Rule-based alert engine on new measurements
- Fast2SMS + email notifier integration
- Report endpoints (AWC monthly, block summary)
- PDF/Excel export

**Frontend**
- Alerts dashboard (active/resolved)
- Reports page with charts

**Data**
- Scheduled job for missed measurements

**Acceptance Criteria**
- SAM/MAM triggers alert and notification
- Reports render and export successfully

**Deliverable:** Alerts + reports ready for field trials

---

### Phase 5 — Polish & Demo (Week 7)
**Goal:** Offline readiness, security hardening, and demo polish.

**Backend**
- Rate limiting, audit logging, security checks
- Demo data seeding script

**Frontend**
- PWA offline flow (IndexedDB queue + background sync)
- Role-based UI refinement
- Demo dashboard and walkthrough mode

**Testing**
- Pytest coverage for auth, growth, nutrition
- Manual UI validation checklist

**Acceptance Criteria**
- Offline mode stores measurements and syncs on reconnect
- All roles function end-to-end in demo scenario

**Deliverable:** End-to-end demo with offline capability

---

## 14. Folder Structure

### Backend (FastAPI)
```
backend/
├── app/
│   ├── main.py                  ← FastAPI app entry point
│   ├── config.py                ← Settings (env vars, DB URL, OpenRouter key)
│   ├── database.py              ← MongoDB client + collection accessors
│   ├── auth/
│   │   ├── router.py            ← /auth/* endpoints
│   │   ├── service.py           ← Login, token creation, refresh logic
│   │   ├── dependencies.py      ← get_current_user, require_role
│   │   ├── models.py            ← Pydantic models for auth
│   │   └── utils.py             ← bcrypt hash, JWT encode/decode
│   ├── children/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── models.py
│   ├── growth/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── models.py
│   │   └── who_calculator.py    ← Z-score calc using LMS tables
│   ├── nutrition/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── models.py
│   │   └── openrouter_client.py ← AI prompt + response parsing
│   ├── alerts/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── models.py
│   │   └── notifier.py          ← SMS + email + in-app dispatch
│   ├── reports/
│   │   ├── router.py
│   │   ├── service.py
│   │   └── pdf_generator.py     ← WeasyPrint PDF export
│   ├── mealplan/
│   │   ├── router.py
│   │   └── service.py
│   └── admin/
│       ├── router.py
│       └── service.py
├── data/
│   └── who_lms_tables/          ← WHO reference LMS CSV files
├── seed/
│   └── demo_data.py             ← Demo data seeder
├── tests/
│   ├── test_auth.py
│   ├── test_growth.py
│   └── test_nutrition.py
├── .env                         ← MONGO_URI, OPENROUTER_API_KEY, JWT_SECRET
└── requirements.txt
```

### Frontend (React)
```
frontend/
├── public/
│   ├── manifest.json            ← PWA manifest
│   └── icons/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── api/
│   │   ├── axiosClient.js       ← Axios instance with JWT interceptor
│   │   ├── authApi.js
│   │   ├── childrenApi.js
│   │   ├── growthApi.js
│   │   └── nutritionApi.js
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── ProtectedRoute.jsx   ← Role-based route guard
│   │   └── useAuth.js           ← Zustand auth store
│   ├── components/
│   │   ├── GrowthChart.jsx      ← Recharts growth curve
│   │   ├── StatusBadge.jsx      ← SAM/MAM/Normal badge
│   │   ├── AlertCard.jsx
│   │   ├── MealPlanCard.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── ChildrenList.jsx
│   │   ├── ChildProfile.jsx
│   │   ├── RegisterChild.jsx
│   │   ├── LogMeasurement.jsx
│   │   ├── LogDiet.jsx
│   │   ├── MealPlan.jsx
│   │   ├── Alerts.jsx
│   │   └── Reports.jsx
│   ├── store/
│   │   └── useStore.js          ← Zustand global state
│   └── utils/
│       ├── offline.js           ← IndexedDB queue for offline sync
│       └── formatDate.js
├── vite.config.js               ← PWA plugin config
└── package.json
```

---

## 15. Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| OpenRouter API downtime | Low | High | Store logs immediately; retry AI analysis in background job |
| Low connectivity in rural areas | High | High | PWA offline mode + IndexedDB sync queue |
| Incorrect Z-score calculation | Medium | High | Validate against WHO reference app; unit test with known values |
| SMS delivery failure | Medium | Medium | Fallback to email; in-app notification always fires |
| MongoDB Atlas free-tier limits | Low | Medium | Optimize queries with indexes; archive old records |
| JWT token theft | Low | High | HttpOnly refresh cookie; short access token TTL (30 min) |
| Workers' digital literacy | High | Medium | Simple UI, Tamil language labels, training videos |
| Data privacy (Aadhaar) | Low | High | AES-256 encryption; Aadhaar optional; audit log |

---

## Environment Variables (.env)

```env
# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/anganwadi

# Auth
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_PRIMARY_MODEL=anthropic/claude-3-haiku
OPENROUTER_FALLBACK_MODEL=meta-llama/llama-3-8b-instruct

# SMS (Fast2SMS)
FAST2SMS_API_KEY=your-fast2sms-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@anganwadi.tn.gov.in
SMTP_PASSWORD=app-specific-password

# App
FRONTEND_URL=https://anganwadi.yourdomain.com
ENVIRONMENT=development
```

---

*Prepared for Mini Project Planning — Anganwadi Smart Health Monitoring System*  
*ICDS Tamil Nadu Deployment | FastAPI + React + MongoDB + OpenRouter*