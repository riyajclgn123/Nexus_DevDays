# Louisiana EduPulse — Complete Project Brief
> Generated for Nexus Louisiana Dev Days 2025 — EdTech Challenge
> Use this file to generate a Google Doc, pitch deck, or project documentation.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Louisiana EduPulse |
| **Tagline** | Connecting need, demand, and opportunity in Louisiana K-12 education |
| **Event** | Nexus Louisiana Dev Days 2025 — EdTech Challenge |
| **Partner** | New Schools for Louisiana |
| **Team** | Nikhil Sha, Riyaj |
| **Version** | 1.0.0 |

---

## 2. Problem Statement

Louisiana's education data is **fragmented across multiple departments** — LDOE, Census Bureau, Louisiana Workforce Commission — making it nearly impossible for stakeholders to see the full picture in one place.

- **Policymakers** can't quickly identify which parishes need urgent intervention
- **Philanthropic funders** lack a data-driven way to score investment opportunities
- **School operators** (charter networks, CMOs) have no centralized tool to evaluate expansion sites

The result: decisions get made on incomplete data, resources miss the highest-need communities, and high-impact opportunities go unfunded.

---

## 3. Our Solution

**Louisiana EduPulse** is a role-based, AI-powered intelligence platform that unifies Louisiana K-12 performance, demographic, and workforce data into a single decision-support tool.

Three distinct dashboards — one for each stakeholder type — surface exactly the right data with the right framing, paired with a live AI chat assistant that answers real questions using real database context.

### Core Value Proposition

| For | They Get |
|-----|----------|
| Policymakers | Statewide SPS scores, parish performance rankings, trend analysis, and alert system for crisis parishes |
| Funders | Investment opportunity scoring (academic need × student population × workforce alignment), ROI framing |
| Operators | Expansion site recommendations scored by demand, competition level, and unserved student count |

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 19.2 + Vite 8 | SPA with fast HMR dev experience |
| Routing | React Router DOM 7 | Client-side routing with protected routes |
| Styling | Tailwind CSS 3.4 | Utility-first design with custom Navy/Gold/Teal palette |
| Charts | Recharts 3.8 | Line charts (SPS trends), bar charts (proficiency, workforce) |
| Icons | Lucide React 1.14 | Consistent icon system |
| Authentication | Firebase Auth | Email/password, Google OAuth, Microsoft OAuth |
| User Profiles | Firebase Firestore | Stores user role, org, and login history |
| Backend Framework | FastAPI 0.111 | RESTful API with automatic OpenAPI docs |
| API Server | Uvicorn | ASGI server with hot-reload |
| Database | PostgreSQL 16 | Primary data store for all education datasets |
| ORM | SQLAlchemy 2.0 | Python ORM with psycopg2 driver |
| Validation | Pydantic 2.7 | Request/response schema validation |
| Migrations | Alembic 1.13 | Database schema migrations |
| AI/LLM | Groq API (llama-3.3-70b-versatile) | Role-aware chatbot with live DB context |
| ML Models | scikit-learn (pre-trained .pkl files) | Enrollment, investment, and risk scoring |
| Environment | python-dotenv | Secrets management via .env |

---

## 5. Architecture Overview

### How the App Starts

**Frontend:**
```
index.html → src/main.jsx → <App /> → <ThemeProvider> → <AuthProvider> → <BrowserRouter> → Routes
```

**Backend:**
```
uvicorn main:app --reload → FastAPI app → lifespan startup → SQLAlchemy create_all → routers registered
```

### Route Map

**Frontend Routes:**
| Route | Component | Access |
|-------|-----------|--------|
| `/` | RootRedirect | Public (redirects based on auth state) |
| `/auth` | AuthPage | Public |
| `/dashboard/policymaker` | PolicyDashboard | Protected (requires login) |
| `/dashboard/funder` | FunderDashboard | Protected |
| `/dashboard/operator` | OperatorDashboard | Protected |

**Backend API Routes (all under `/api/v1`):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parishes/` | 64 parishes with filters (gap, grade) and sorting |
| GET | `/parishes/{name}` | Single parish detail |
| GET | `/parishes/summary/stats` | Statewide aggregate stats |
| GET | `/metrics/summary` | 15 statewide metrics snapshot |
| GET | `/metrics/sps-history` | SPS trend 2019–2025 |
| GET | `/metrics/proficiency` | LEAP proficiency by grade band |
| GET | `/opportunities/` | Investment opportunities (filter by impact, parish) |
| GET | `/sites/` | Expansion sites (filter by status) |
| GET | `/alerts/` | System alerts (filter by type) |
| GET | `/workforce/` | Workforce gaps by sector |
| POST | `/chat/` | Send message to Groq AI chatbot |
| GET | `/chat/suggestions/{role}` | 6 suggested questions per role |
| GET | `/health` | Health check |

### CORS
Backend allows requests from `http://localhost:5173` (frontend). Configured in `backend/main.py`.

---

## 6. Database Schema

All tables created via SQLAlchemy models in `backend/models.py`, seeded by `backend/seed.py`.

### Table: `parishes`
| Column | Type | Description |
|--------|------|-------------|
| id | Integer PK | Auto-increment |
| name | String | Parish name (64 Louisiana parishes) |
| sps | Float | School Performance Score (0–150 scale) |
| grade | String | Letter grade A–F |
| enrollment | Integer | Total enrolled students |
| growth | Float | Enrollment growth % |
| gap | String | Gap level (Critical / High / Moderate / Low) |
| graduation | Float | Graduation rate % |
| proficiency | Float | Academic proficiency % |
| poverty | Float | Poverty rate % |
| funding_need | String | Funding need level |
| workforce | String | Workforce alignment level |
| trend | String | SPS trend direction |
| data_source | String | Source attribution |

### Table: `state_metrics`
Key-value store for 15 statewide metrics: SPS score, SPS grade, graduation rate, total enrollment, poverty rate, child poverty rate, median income, bachelor's rate, employment rate, chronic absence rate, school grade distribution (A/B/C/D/F counts).

### Table: `sps_history`
Year-by-year statewide SPS scores (2019, 2021–2025) for trend chart.

### Table: `proficiency_by_grade`
LEAP mastery percentages for ELA and Math by grade band: K-2, 3-5, 6-8, 9-12.

### Table: `workforce_gaps`
| Column | Description |
|--------|-------------|
| sector | Industry name (Skilled Trades, Healthcare, Energy/LNG, Technology, Education, Logistics) |
| demand | Job openings projected |
| supply | Pipeline from current graduates |
| gap | Demand minus supply |
| growth_pct | YoY sector growth % |

### Table: `opportunities`
Investment opportunities for funders, scored by: academic need × student population × workforce alignment.

| Column | Description |
|--------|-------------|
| parish | Target parish |
| type | Opportunity type |
| score | 0–100 impact score |
| impact | High / Medium / Low |
| students | Students impacted |
| cost | Estimated cost |
| workforce | Workforce alignment |
| rationale | Plain-English justification |

### Table: `expansion_sites`
Expansion site recommendations for school operators.

| Column | Description |
|--------|-------------|
| parish | Target parish |
| region | Geographic region |
| demand_score | 0–100 demand score |
| competition | Low / Medium / High |
| population | School-age population |
| unserved | Unserved students |
| school_type | Recommended school type |
| timeline | Estimated timeline |
| status | Ready / Planning / Exploring |
| sps | Current parish SPS |
| key_fact | One standout data point |

### Table: `alerts`
System-generated data flags: Critical / Warning / Info by parish.

---

## 7. Features — Detailed Breakdown

### Authentication & Onboarding

- **Providers:** Email/password, Google OAuth, Microsoft OAuth via Firebase Auth
- **Role Selection:** Users choose Policymaker, Funder, or Operator at registration
- **Firestore Profile:** On first login, a user document is created in Firestore with name, email, org, role, and timestamp
- **Protected Routes:** `<ProtectedRoute>` HOC checks Firebase auth state; unauth users redirected to `/auth`
- **Role Routing:** After login, users are sent to `/dashboard/{role}` automatically

### Policymaker Dashboard (Complete)

**Section 1 — State Overview**
- 6 metric cards: Average SPS Score, Graduation Rate, Total Enrollment, Poverty Rate, Chronic Absence %, Schools Graded A or B %
- Proficiency bar chart: ELA and Math proficiency side-by-side for each grade band
- School grade distribution: horizontal bars for count of A/B/C/D/F schools
- Active alerts preview (Critical and Warning only)

**Section 2 — Parish Performance**
- Searchable table of all 64 Louisiana parishes
- Columns: Parish Name, SPS Score, Proficiency %, Graduation Rate, Enrollment Growth, Gap Level
- Sort by any column (ascending/descending)
- Filter by gap level and school grade

**Section 3 — SPS Trends**
- Line chart: Statewide SPS 2019–2025 (skips 2020 COVID gap)
- Bar chart: LEAP ELA and Math proficiency by grade band (K-2, 3-5, 6-8, 9-12)

**Section 4 — Alerts**
- Full alert list filterable by type: Critical / Warning / Info
- Each alert shows parish, severity badge, and message

**Navigation:** State Overview, Parish Performance, SPS Trends, Alerts, Academic Data, Settings

### Funder Dashboard (In Progress)

**Section 1 — Impact Overview**
- State summary metrics
- Investment opportunity list with impact scores, cost, student reach, and rationale
- Workforce gap data by sector

**Planned Sections (not yet complete):** My Portfolio, Opportunity Scoring Detail, Sector-Specific ROI

**Navigation:** Impact Overview, Opportunities, Workforce Gaps, My Portfolio, Scoring, Settings

### Operator Dashboard (In Progress)

**Section 1 — Expansion Sites**
- Site cards with demand score, competition level, unserved student count, status badge (Ready / Planning / Exploring), and key fact
- Filterable by status

**Planned Sections (not yet complete):** SPS Forecast, Market Analysis, Site Scoring Detail, Student Demand

**Navigation:** Expansion Sites, SPS Forecast, Market Analysis, Site Scoring, Student Demand, Settings

### AI Chat Assistant

Present on all three dashboards as a floating widget (bottom-right).

**How it works:**
1. User opens chat; suggested questions are shown based on their role (6 per role)
2. User sends a message; frontend POSTs to `/api/v1/chat/` with `{ message, user_role, conversation_history }`
3. Backend calls `get_live_context(role, db)` — queries PostgreSQL for role-specific data:
   - **Policymaker:** state metrics + parish list + workforce gaps + alerts
   - **Funder:** same + investment opportunities with scores and rationale
   - **Operator:** same + expansion sites with demand scores and competition
4. Backend builds a role-specific system prompt emphasizing the right data priorities
5. Full context + conversation history sent to Groq API (`llama-3.3-70b-versatile`, temperature 0.3, max 1024 tokens)
6. Response returned with source attribution array: LDOE 2024, Census ACS 2024, BLS Louisiana 2025, EduPulse models

**Guardrails:** Only answers Louisiana K-12 education questions. Refuses off-topic requests. Never fabricates numbers — uses live DB data only.

**Example suggested questions by role:**
- Policymaker: "Which parishes have the lowest SPS scores?", "Show me SPS trends since COVID", "Which parishes have critical gap levels?"
- Funder: "Which opportunities have the highest impact score?", "What is the healthcare workforce gap?", "Which parishes need early literacy investment?"
- Operator: "Which sites are Ready for expansion?", "What is demand in Caddo Parish?", "Where is charter competition lowest?"

---

## 8. AI / ML Components

### Groq LLM (Active)

- **File:** `backend/routers/chat.py`
- **Model:** `llama-3.3-70b-versatile`
- **API:** Groq Cloud API
- **Context injection:** Live PostgreSQL queries per request
- **Temperature:** 0.3 (low — prioritizes factual accuracy)
- **Max tokens:** 1024

### scikit-learn Models (Pre-trained, Not Yet Integrated)

Three serialized model files exist in `backend/ml/models/`:

| File | Likely Purpose |
|------|----------------|
| `enrollment_model.pkl` | Forecasts future enrollment by parish |
| `investment_model.pkl` | Scores investment opportunities |
| `risk_model.pkl` | Scores parish risk level (dropout, chronic absence) |

`backend/ml/predict.py` and `backend/ml/train.py` are currently stubs (empty). The models are not yet called from any API endpoint. This is the largest technical gap relative to the challenge goals.

---

## 9. Component Inventory

### Shared Components (`frontend/src/components/`)

| Component | What it does |
|-----------|-------------|
| `TopNavbar.jsx` | Horizontal nav bar across all dashboards — logo, nav links, role badge, dark/light toggle, profile avatar |
| `ChatBot.jsx` | Floating AI chat widget — message bubbles, typing indicator, source citations, copy-to-clipboard, suggested questions |
| `ProfileModal.jsx` | Popover from navbar avatar — shows user name, email, org, role, and logout button |
| `Logo.jsx` | EduPulse branded logo component |

### Context Providers (`frontend/src/context/`)

| File | Purpose |
|------|---------|
| `AuthContext.jsx` | Global Firebase auth state; methods: loginWithGoogle, loginWithMicrosoft, loginWithEmail, registerWithEmail, logout |
| `ThemeContext.jsx` | Dark/light mode toggle; persists to localStorage; toggles `dark` class on `<html>` for Tailwind |

### Services (`frontend/src/services/`)

| File | Purpose |
|------|---------|
| `api.js` | All FastAPI calls via `apiFetch()` helper; falls back to hardcoded mock data if backend is offline; exposes: getStateSummary, getParishes, getParishSummary, getSPSHistory, getProficiency, getWorkforceGaps, getOpportunities, getExpansionSites, getAlerts, sendChatMessage, getChatSuggestions |
| `userService.js` | Firestore user CRUD: createUser, getUser, updateLastLogin, userExists, updateUser, getUsersByRole |

---

## 10. Data Sources

| Dataset | Real-World Source | How It's Used |
|---------|------------------|---------------|
| School Performance Scores 2024 | Louisiana Dept of Education (LDOE) | Core metric for all dashboards; SPS scores, grades, graduation rates |
| SPS Historical Trend 2019–2025 | LDOE | Trend line chart in Policymaker dashboard |
| LEAP Proficiency by Grade Band | LDOE | Proficiency bar charts |
| Demographics & Poverty | US Census ACS 2024 | Poverty rates, median income, enrollment, bachelor's attainment |
| Workforce Demand by Sector | BLS Louisiana 2025 | Workforce gap analysis for Funder and Operator dashboards |
| Investment Opportunities | EduPulse scoring model | Derived scores for Funder dashboard |
| Expansion Sites | EduPulse scoring model | Derived scores for Operator dashboard |

All data is seeded into PostgreSQL via `backend/seed.py`. No live ETL pipeline yet.

---

## 11. Environment Variables Reference

### Backend

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `FRONTEND_URL` | Yes | Allowed CORS origin |
| `GROQ_API_KEY` | Yes | Powers AI chatbot (get from console.groq.com) |
| `APP_NAME` | No | API title shown in Swagger UI |
| `APP_VERSION` | No | API version string |
| `DEBUG` | No | Enables debug mode |
| `GEMINI_API_KEY` | No | Google Gemini key (reserved, not active) |

### Frontend

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_API_URL` | Yes | FastAPI base URL (e.g. `http://localhost:8000/api/v1`) |

---

## 12. Local Setup — Exact Commands

```bash
# 1. Start PostgreSQL (Docker)
docker run -d \
  --name edupulse-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=edupulse \
  -p 5433:5432 \
  postgres:16-alpine

# 2. Backend
cd backend
python3.11 -m venv .venv311
source .venv311/bin/activate
pip install -r requirements.txt
# Create backend/.env with DATABASE_URL, GROQ_API_KEY, etc.
python seed.py                         # Seed DB (run once)
uvicorn main:app --reload --port 8000  # Start API

# 3. Frontend (in a new terminal)
cd frontend
npm install
# Create frontend/.env with Firebase config and VITE_API_URL
npm run dev                            # Start Vite on http://localhost:5173
```

**After starting:**
- App: http://localhost:5173
- API Swagger UI: http://localhost:8000/docs

---

## 13. Current State Assessment

### What is fully working

- Firebase authentication (email, Google, Microsoft OAuth)
- Firestore user profile creation and retrieval
- Protected routes with role-based dashboard routing
- PostgreSQL database with 8 fully-seeded tables of real Louisiana data
- All FastAPI endpoints (12+) with Pydantic validation and filtering
- **Policymaker Dashboard — complete:** metric cards, parish table, trend charts, alerts
- Groq AI chatbot on all dashboards with live DB context and role-aware prompts
- Dark/light mode with localStorage persistence
- API fallback to mock data if backend is offline (demo-safe)

### What is in progress

- **Funder Dashboard** — ImpactSection started; Portfolio, Scoring sections missing
- **Operator Dashboard** — SitesSection started; Forecast, Market Analysis sections missing
- **ML model integration** — `predict.py` and `train.py` are empty stubs; .pkl files exist but aren't called
- **Settings pages** — All three dashboards show "Settings coming soon" placeholder

### What is missing (relative to challenge goals)

- ML model API endpoints (enrollment forecast, investment scoring, risk scoring)
- Live ETL pipeline to refresh data from LDOE/Census/BLS
- Docker Compose for full-stack local dev
- Cloud deployment (no Render/Railway/Vercel config)
- Data export / report generation
- Mobile optimization (tables overflow on small screens)

### Strongest parts of the build

1. **Clean role-based architecture** — three stakeholder dashboards with consistent patterns
2. **Data foundation** — real Louisiana datasets in a well-structured PostgreSQL schema
3. **AI chatbot** — live DB context injection per role is technically sophisticated
4. **API design** — RESTful, typed, filterable, auto-documented
5. **Demo resilience** — mock data fallback ensures the app works even if backend is down

### Highest-impact next features

1. Wire ML models into API (`/opportunities/score` and `/sites/demand` endpoints)
2. Complete Funder and Operator dashboards
3. Add Docker Compose
4. Implement Settings pages with user preferences
5. Add data export (CSV/PDF) for reports

---

## 14. Challenge Alignment Summary

| Challenge Requirement | Status | How We Address It |
|----------------------|--------|-------------------|
| Data Integration | Done | LDOE + Census + BLS unified in PostgreSQL |
| Interactive Visualization | Partial | Policymaker charts done; Funder/Operator in progress |
| Predictive Analytics | Partial | .pkl models exist; not yet exposed via API |
| Geospatial Mapping | Not started | Parish-level data exists; no map layer yet |
| AI-Driven Insights | Done | Role-aware Groq chatbot with live DB context |
| Role-Based Access | Done | Three distinct stakeholder dashboards |

---

## 15. Known Limitations

1. ML models are pre-trained but not wired into any API endpoint
2. Funder and Operator dashboards are partially built
3. Settings pages show "coming soon" placeholder in all dashboards
4. Data is static (seeded once) — no live data refresh
5. No geospatial/map layer despite having parish-level data
6. Some tables may overflow on small mobile screens
7. Database credentials are in `.env` — use secrets management for production

---

## 16. File Tree (key files only)

```
nexus-devdays/
├── README.md
├── PROJECT_BRIEF.md                  ← this file
├── backend/
│   ├── main.py                       ← FastAPI app entry, CORS, router registration
│   ├── database.py                   ← SQLAlchemy engine and session
│   ├── models.py                     ← 8 database models
│   ├── schemas.py                    ← Pydantic schemas
│   ├── seed.py                       ← DB seeding with real Louisiana data
│   ├── requirements.txt
│   ├── routers/
│   │   ├── parishes.py
│   │   ├── metrics.py
│   │   ├── opportunities.py
│   │   ├── sites.py
│   │   ├── alerts.py
│   │   ├── workforce.py
│   │   └── chat.py                   ← Groq AI chatbot, role-aware context builder
│   └── ml/
│       ├── predict.py                ← STUB (empty)
│       ├── train.py                  ← STUB (empty)
│       └── models/
│           ├── enrollment_model.pkl
│           ├── investment_model.pkl
│           └── risk_model.pkl
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx                  ← React root mount
        ├── App.jsx                   ← Route definitions + ProtectedRoute
        ├── firebase.js               ← Firebase init, auth providers
        ├── auth/
        │   ├── AuthPage.jsx          ← Unified login/register + role selector
        │   ├── LoginForm.jsx
        │   ├── RegisterForm.jsx
        │   └── SocialButtons.jsx     ← Google + Microsoft OAuth buttons
        ├── dashboards/
        │   ├── policymaker/
        │   │   └── PolicyDashboard.jsx  ← COMPLETE
        │   ├── funder/
        │   │   └── FunderDashboard.jsx  ← IN PROGRESS
        │   └── operator/
        │       └── OperatorDashboard.jsx ← IN PROGRESS
        ├── components/
        │   ├── TopNavbar.jsx
        │   ├── ChatBot.jsx
        │   ├── ProfileModal.jsx
        │   └── Logo.jsx
        ├── context/
        │   ├── AuthContext.jsx       ← Firebase auth state + methods
        │   └── ThemeContext.jsx      ← Dark/light mode
        └── services/
            ├── api.js                ← All backend calls + mock fallback
            └── userService.js        ← Firestore user CRUD
```
