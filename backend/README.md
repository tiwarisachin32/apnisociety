# ApniSociety - FastAPI & PostgreSQL Backend

Production-grade, asynchronous REST backend for **ApniSociety** (Housing Society & RWA Management Platform), powered by **FastAPI**, **SQLAlchemy ORM**, **Pydantic v2**, and **PostgreSQL**.

---

## Architecture Overview

```
backend/
├── main.py               # FastAPI application entry point, CORS, routers & startup hooks
├── config.py             # Settings, Pydantic BaseSettings, PostgreSQL connection string
├── database.py           # SQLAlchemy engine & session dependency
├── models.py             # Relational schema (Users, Members, Bills, Water, Expenses, Bookings, Tickets)
├── schemas.py            # Pydantic validation & response serialization models
├── seed.py               # Database seeder with realistic society data
├── Dockerfile            # Container build for FastAPI service
├── docker-compose.yml    # One-click launch for PostgreSQL 16 + FastAPI
└── routers/
    ├── auth.py           # User authentication, profiles, JWT token handling
    ├── members.py        # Resident directory, KYC, flat occupancy
    ├── maintenance.py    # Monthly billing, payment receipts, collection stats
    ├── water.py          # Meter readings, tanker deliveries, consumption logs
    ├── expenses.py       # Society vouchers, committee reimbursement claims
    ├── hall_booking.py   # Clubhouse reservations & slot conflict resolution
    ├── complaints.py     # Helpdesk tickets, technician assignment & SLA tracking
    ├── notifications.py  # Broadcast announcements, emergency alerts
    ├── roles.py          # Enterprise Role-Based Access Control (RBAC) & audit logs
    └── reports.py        # Financial summaries, defaulter roster, SLA metrics
```

---

## Quick Start (with Docker Compose)

The easiest way to run PostgreSQL and FastAPI together:

```bash
cd backend
docker-compose up -d --build
```

- **Interactive Swagger API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check Endpoint**: http://localhost:8000/health
- **PostgreSQL Port**: `5432` (`postgres:postgrespassword@localhost:5432/apnisociety_db`)

---

## Local Development (Without Docker)

### 1. Prerequisites
- Python 3.10+
- PostgreSQL running locally (or use SQLite fallback automatically)

### 2. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the workspace root:
```ini
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apnisociety_db
SECRET_KEY=your_production_secret_key_here
```

### 4. Seed Database
```bash
python -m backend.seed
```

### 5. Start the Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
