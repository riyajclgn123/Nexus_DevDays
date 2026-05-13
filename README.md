# Louisiana EduPulse
> **Nexus Louisiana Dev Days 2025 — EdTech Challenge**
> In partnership with New Schools for Louisiana

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built for](https://img.shields.io/badge/Built%20for-Nexus%20LA%20Dev%20Days-orange)](https://www.nexusla.org/programs/devdays)

---

## What is this?

**Louisiana EduPulse** is a unified intelligence platform that connects **need** (school performance), **demand** (job market), and **opportunity** (investment & expansion) across Louisiana's K-12 education system — built for policymakers, philanthropic funders, and school operators.

**Challenge:** Louisiana's education data is fragmented across departments, making it hard for leaders to identify where student need, school demand, and workforce opportunity intersect.

**Our Solution:** A role-based AI-powered dashboard that unifies LDOE school performance scores, Census demographic data, and BLS workforce projections into a single decision-support platform — with a live Groq LLM chatbot that answers role-specific questions using real database context.

---

## Team

| Name | Role |
|------|------|
| Nikhil | Full Stack / AI Integration |
| Riyaj | Backend / Data Integration |

---

## Features

- **Role-Based Dashboards** — Three tailored views (Policymaker, Funder, Operator) each surfacing the data that matters most to that stakeholder
- **Policymaker Dashboard** — Statewide SPS scores, parish performance table (64 parishes), SPS trend charts (2019–2025), LEAP proficiency by grade band, and alert system
- **Funder Dashboard** — Investment opportunity scoring by impact level, workforce gap analysis by sector, and ROI-focused metrics
- **Operator Dashboard** — Expansion site recommendations scored by demand, competition level, unserved student count, and timeline readiness
- **AI Chat Assistant** — Groq-powered chatbot (llama-3.3-70b-versatile) with live database context, role-aware system prompts, and source attribution
- **Firebase Auth** — Email/password + Google OAuth + Microsoft OAuth with Firestore user profiles
- **Dark/Light Mode** — Persisted theme preference across sessions

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 8 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts 3 |
| Auth | Firebase Auth (email, Google, Microsoft) |
| User DB | Firebase Firestore |
| Backend | FastAPI 0.111 |
| Database | PostgreSQL (SQLAlchemy 2.0, psycopg2) |
| AI/LLM | Groq API (llama-3.3-70b-versatile) |
| ML Models | scikit-learn (enrollment, investment, risk — pre-trained) |
| Deployment | Local (Docker recommended) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 12+ running on port 5433 (or Docker)

### 1. Clone the repo

```bash
git clone https://github.com/your-org/nexus-devdays.git
cd nexus-devdays
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python3.11 -m venv .venv311
source .venv311/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create your .env file (see Environment Variables below)
cp .env.example .env  # then fill in your values

# Seed the database with Louisiana education data (run once)
python seed.py

# Start the API server
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Create your frontend .env file
cp .env.example .env  # then fill in your Firebase config

# Start the dev server
npm run dev
```

### 4. Open in browser

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API (Swagger UI) | http://localhost:8000/docs |
| API (ReDoc) | http://localhost:8000/redoc |

### Quick start with Docker (PostgreSQL only)

```bash
docker run -d \
  --name edupulse-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=edupulse \
  -p 5433:5432 \
  postgres:16-alpine
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5433/edupulse
FRONTEND_URL=http://localhost:5173

APP_NAME=Louisiana EduPulse API
APP_VERSION=1.0.0
DEBUG=True

GROQ_API_KEY=your_groq_api_key        # from console.groq.com (powers AI chatbot)
GEMINI_API_KEY=your_gemini_api_key    # Google Gemini key (reserved for future use)
```

### Frontend (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_API_URL=http://localhost:8000/api/v1
```

> Never commit your `.env` files — they are already in `.gitignore`.

---

## Project Structure

```
nexus-devdays/
├── backend/
│   ├── main.py              # FastAPI app entry point, CORS, router registration
│   ├── database.py          # SQLAlchemy engine and session setup
│   ├── models.py            # All 8 database models (Parish, StateMetric, etc.)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── seed.py              # One-time DB seeding with Louisiana education data
│   ├── requirements.txt
│   ├── routers/
│   │   ├── parishes.py      # /parishes/* endpoints
│   │   ├── metrics.py       # /metrics/* endpoints
│   │   ├── opportunities.py # /opportunities/* endpoints
│   │   ├── sites.py         # /sites/* endpoints
│   │   ├── alerts.py        # /alerts/* endpoints
│   │   ├── workforce.py     # /workforce/* endpoints
│   │   └── chat.py          # /chat/* endpoints (Groq AI integration)
│   └── ml/
│       ├── predict.py       # ML inference (in progress)
│       ├── train.py         # Model training (in progress)
│       └── models/
│           ├── enrollment_model.pkl
│           ├── investment_model.pkl
│           └── risk_model.pkl
└── frontend/
    ├── index.html
    ├── src/
    │   ├── main.jsx         # React root mount
    │   ├── App.jsx          # Route definitions (BrowserRouter + ProtectedRoute)
    │   ├── firebase.js      # Firebase app init, auth providers
    │   ├── auth/
    │   │   ├── AuthPage.jsx
    │   │   ├── LoginForm.jsx
    │   │   ├── RegisterForm.jsx
    │   │   └── SocialButtons.jsx
    │   ├── dashboards/
    │   │   ├── policymaker/PolicyDashboard.jsx
    │   │   ├── funder/FunderDashboard.jsx
    │   │   └── operator/OperatorDashboard.jsx
    │   ├── components/
    │   │   ├── TopNavbar.jsx    # Shared nav bar (all dashboards)
    │   │   ├── ChatBot.jsx      # Floating AI chat widget
    │   │   ├── ProfileModal.jsx # User profile popover
    │   │   └── Logo.jsx         # EduPulse brand logo
    │   ├── context/
    │   │   ├── AuthContext.jsx  # Firebase auth state + methods
    │   │   └── ThemeContext.jsx # Dark/light mode toggle
    │   └── services/
    │       ├── api.js           # All FastAPI calls + mock fallback data
    │       └── userService.js   # Firestore user CRUD operations
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Data Sources

| Dataset | Source | Format | Used For |
|---------|--------|--------|----------|
| School Performance Scores (2024) | Louisiana Dept of Education | Seeded via seed.py | SPS scores, parish grades, graduation rates |
| SPS Historical Trend (2019–2025) | LDOE | Seeded via seed.py | Trend line chart |
| LEAP Proficiency by Grade Band | LDOE | Seeded via seed.py | Proficiency bar charts |
| State Demographics & Poverty | US Census ACS 2024 | Seeded via seed.py | Poverty rate, median income, enrollment |
| Workforce Demand by Sector | BLS Louisiana 2025 | Seeded via seed.py | Workforce gap analysis |
| Investment Opportunities | EduPulse scoring model | Derived | Funder opportunity list |
| Expansion Sites | EduPulse scoring model | Derived | Operator site recommendations |

---

## API Reference

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/parishes/` | List all 64 parishes (filter by `gap`, `grade`; sort by any field) |
| GET | `/parishes/{name}` | Single parish detail |
| GET | `/parishes/summary/stats` | Statewide parish aggregate stats |
| GET | `/metrics/summary` | 15 statewide metrics snapshot |
| GET | `/metrics/sps-history` | SPS trend data (2019–2025) |
| GET | `/metrics/proficiency` | LEAP proficiency by grade band |
| GET | `/opportunities/` | Investment opportunities (filter by `impact`, `parish`) |
| GET | `/sites/` | Expansion sites (filter by `status`) |
| GET | `/alerts/` | System alerts (filter by `type`) |
| GET | `/workforce/` | Workforce gaps by sector |
| POST | `/chat/` | Send message to Groq AI (with role + conversation history) |
| GET | `/chat/suggestions/{role}` | 6 suggested questions for a given role |
| GET | `/health` | Health check |

---

## AI Chat Architecture

The chatbot (`/chat/` endpoint) dynamically builds its context from live PostgreSQL data before every request:

1. Fetches role-specific database records (metrics, parishes, opportunities, sites, workforce gaps)
2. Constructs a role-aware system prompt emphasizing the correct data priorities
3. Sends the full conversation history to Groq (`llama-3.3-70b-versatile`, temperature 0.3)
4. Returns the reply with source attribution (LDOE, Census, BLS, EduPulse model)

The chatbot only answers Louisiana K-12 education questions and refuses off-topic requests.

---

## Challenge Alignment

This project addresses the **Nexus LA EdTech Challenge** by:

- **Data Integration** — Combines LDOE, Census ACS, and BLS Louisiana datasets into a unified PostgreSQL schema
- **Role-Based Visualization** — Three purpose-built dashboards surface the right data for each stakeholder type
- **AI-Driven Insights** — Live Groq chatbot answers contextual questions using real database data
- **Opportunity Identification** — Investment opportunity and expansion site scoring models surface where need and demand intersect
- **Workforce Alignment** — Gap analysis by sector connects education outcomes to job market demand

---

## Roadmap

- [x] Firebase auth (email, Google, Microsoft OAuth)
- [x] PostgreSQL schema with 8 tables, seeded with real Louisiana data
- [x] FastAPI backend with 12+ endpoints
- [x] Policymaker dashboard (complete)
- [x] Role-aware Groq AI chatbot with live DB context
- [x] Dark/light mode
- [ ] Funder dashboard (in progress)
- [ ] Operator dashboard (in progress)
- [ ] ML model API integration (predict.py / train.py)
- [ ] Settings pages
- [ ] Docker Compose for full-stack local dev
- [ ] Cloud deployment (Render / Railway)
- [ ] Data export / report generation

---

## Known Issues

- `backend/ml/predict.py` and `train.py` are stubs — pre-trained model files exist but are not yet wired into the API
- Funder and Operator dashboards are partially implemented
- Settings pages show "coming soon" placeholder
- All data is static (seeded) — no live ETL pipeline yet
- Some data tables may overflow on small mobile screens

---

## License

MIT © Riyaj & Nikhil — Built for [Nexus Louisiana Dev Days 2025](https://www.nexusla.org/programs/devdays)
