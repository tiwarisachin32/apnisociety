# ApniSociety - FastAPI & PostgreSQL Backend Guide

Production-grade, asynchronous REST backend for **ApniSociety** (Housing Society & RWA Management Platform), powered by **FastAPI**, **SQLAlchemy ORM**, **Pydantic v2**, and **PostgreSQL**.

---

## 🚀 Quick Start (Recommended: Docker Compose)

The fastest and most reliable way to start PostgreSQL 16 and FastAPI with zero setup:

```bash
# Navigate to the backend directory
cd backend

# Start PostgreSQL and FastAPI in background
docker-compose up -d --build
```

- **Interactive Swagger API Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **API Health Check**: http://localhost:8000/health
- **PostgreSQL Connection**: `postgresql://postgres:postgrespassword@localhost:5432/apnisociety_db`

---

## 💻 Running Locally (Windows / macOS / Linux)

### Step 1: Install Python & Create Virtual Environment

Ensure you have Python 3.10, 3.11, or 3.12 installed.

```bash
# Navigate to the project folder
cd "New Project/apnisociety"

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (Command Prompt / PowerShell):
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate
```

---

### Step 2: Install Python Dependencies & PostgreSQL Driver

To avoid `No module named 'psycopg'`, install the dependencies from `requirements.txt`:

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

If you only need the PostgreSQL driver separately:
```bash
# Modern binary driver (recommended):
pip install "psycopg[binary]"

# Or traditional binary driver:
pip install psycopg2-binary
```

---

### Step 3: Configure Database Connection (.env)

Create a `.env` file in the project root or in `backend/.env`:

```ini
# PostgreSQL connection string:
# Format: postgresql://<user>:<password>@<host>:<port>/<database_name>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/apnisociety_db

# JWT Secret Key
SECRET_KEY=apnisociety_local_dev_secret_key_2026

# Allowed Frontend Origins (Default allows Vite / localhost:3000)
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173","*"]
```

> **Note**: If PostgreSQL is not installed or unreachable, ApniSociety will automatically fall back to a local SQLite database (`./apnisociety_local.db`) so your development is never blocked.

---

### Step 4: Seed Initial Society Data (Optional but Recommended)

Populate users (Col. Verma - President, Vikram Aditya - Owner, Rajesh Kumar - Resident), flats, maintenance bills, water readings, and committee roles:

```bash
# From the project root:
python -m backend.seed

# OR from inside the backend/ folder:
cd backend
python seed.py
```

---

### Step 5: Start the FastAPI Server

You can run the server either from the **project root** or from inside the **backend/** folder:

#### Option A: Running from inside the `backend/` directory:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Option B: Running from the project root (`apnisociety`):
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Fixed**: Imports have been patched with dynamic `sys.modules` registration, preventing `ModuleNotFoundError: No module named 'backend'` when launching from either folder on Windows.

---

### Step 6: Connect the Frontend (React / Vite)

1. Start your frontend development server:
   ```bash
   npm run dev
   ```
2. The frontend runs on `http://localhost:3000`.
3. It connects by default to `http://localhost:8000`.
4. In the app:
   - Click **"⚙️ App Owner API Console"** in the footer bar or **"🔌 Backend & Database Hub"** in Society Settings.
   - Click **"Test Connection"** to verify live communication with your local FastAPI server.
   - Any updates made in the frontend will synchronize with your PostgreSQL database!

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `No module named 'psycopg'` | PostgreSQL binary wheel missing in active venv | Run `pip install "psycopg[binary]"` or `pip install psycopg2-binary` |
| `No module named 'backend'` | Path resolution issue in Windows reloader | Updated in `main.py`! Run `uvicorn main:app --reload` from `backend/` |
| `Connection refused: 5432` | Local PostgreSQL service is stopped | Start PostgreSQL service in Services (`services.msc`) or run `docker-compose up -d db` |
| `database "apnisociety_db" does not exist` | Database not created in PostgreSQL | In `psql` or pgAdmin, execute: `CREATE DATABASE apnisociety_db;` |
| `Cannot access DEFAULT_API_BASE` | Circular module import | Fixed in `apiClient.ts` |
