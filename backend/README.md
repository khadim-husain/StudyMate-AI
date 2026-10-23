# StudyMate AI — Backend Server

Complete enterprise-grade backend for **StudyMate AI — Your Personal AI Study Assistant**, built using **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.x**, **Alembic**, and **Google Gemini Gen AI**.

---

## 1. Prerequisites (Windows 10 / 11)

- **Python 3.11+** installed
- **PostgreSQL 14+** running on `localhost:5432`

---

## 2. Windows Setup & Installation

### Option A: Using PowerShell
```powershell
# 1. Navigate to the backend directory
cd "d:\StudyMate AI\backend"

# 2. Create the Python virtual environment
python -m venv venv

# 3. Activate the virtual environment
.\venv\Scripts\Activate.ps1

# 4. Install all dependencies
pip install -r requirements.txt
```

### Option B: Using Windows Command Prompt (CMD)
```cmd
cd "d:\StudyMate AI\backend"
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
```

---

## 3. Database Setup & Alembic Migrations

1. Ensure the PostgreSQL database `studymate_db` exists:
```cmd
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE studymate_db;"
```

2. Review `.env` and verify your credentials:
```env
DATABASE_URL=postgresql+psycopg://postgres:admin@localhost:5432/studymate_db
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004
JWT_SECRET_KEY=studymate_super_secret_jwt_key_2026_change_in_production
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=20
```

3. Apply Alembic migrations:
```powershell
alembic upgrade head
```

---

## 4. Running the Development Server

Start the FastAPI server on port `8000` bound to `0.0.0.0` (accessible from your mobile phone on the same Wi-Fi):

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. Running Automated Tests

Run the full automated pytest suite with verbose output:

```powershell
pytest -v
```

All 17 tests verify:
- Registration, login, duplicate detection, and JWT verification
- Protected endpoint authorization & multi-tenant user isolation
- PDF parsing, chunking, and embedding generation
- Vector cosine similarity retrieval
- RAG question-answering with citation page references
- Backend quiz grading and answer protection
- Study task CRUD and real database analytics calculations

---

## 6. Mobile Frontend Integration (React Native / Expo Go)

When connecting from Expo Go on your Android phone:
1. Ensure your phone and PC are on the same Wi-Fi network.
2. Find your PC's Wi-Fi IP address (run `ipconfig` in CMD, e.g. `16.16.16.206`).
3. Set `API_BASE_URL` in `mobile/src/services/api.js`:
   - Physical Phone: `http://16.16.16.206:8000/api/v1`
   - Android Emulator: `http://10.0.2.2:8000/api/v1`
   - Web Preview: `http://localhost:8000/api/v1`
