# StudyMate AI — Full-Stack AI Study Assistant

An end-to-end AI-powered learning and study platform providing real-time document processing, Retrieval-Augmented Generation (RAG) chat with exact page citations, AI-generated summaries, backend-graded quizzes, spaced repetition flashcards, interactive study planning, and live progress analytics.

---

## 🛠 System Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic v2, Alembic |
| **Database** | PostgreSQL 14+ / 18, `psycopg` driver, full ACID persistence |
| **AI / NLP** | Google Gemini Generative AI (`gemini-2.5-flash`), `text-embedding-004`, RAG Vector Retrieval with adaptive semantic fallbacks |
| **PDF Processing** | `pypdf`, structured chunking with page number and heading retention |
| **Frontend** | React Native, Expo SDK 52, React Navigation 7, AsyncStorage, Axios, Vector Icons |
| **Platforms** | Android, iOS, and Web (`http://localhost:8081`) |

---

## 🚀 Quick Start Guide

### 1. Database Setup (PostgreSQL)

Ensure PostgreSQL is running locally on port `5432`:
```powershell
# Create the database if not present
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE studymate_db;"
```

### 2. Backend Setup & Startup

1. Open PowerShell and navigate to the backend directory:
```powershell
cd "d:\StudyMate AI\backend"
```

2. Activate virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

3. Ensure `.env` is configured (`backend/.env`):
```env
DATABASE_URL=postgresql+psycopg://postgres:admin@localhost:5432/studymate_db
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004
JWT_SECRET_KEY=studymate_super_secret_jwt_key_2026_change_in_production
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_MB=20
```

4. Apply database migrations:
```powershell
alembic upgrade head
```

5. Start the backend API server:
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 3. Frontend Setup & Startup (Mobile & Web)

1. Open a new terminal in the `mobile` directory:
```powershell
cd "d:\StudyMate AI\mobile"
```

2. Start the Expo development server:
```powershell
npx expo start
```

3. Choose your target platform:
- **Web Browser**: Press `w` in terminal or navigate to [http://localhost:8081](http://localhost:8081).
- **Android Phone / Expo Go**: Scan the displayed QR code with the Expo Go app. Both phone and computer must be on the same Wi-Fi network (the app automatically connects to `http://<YOUR_LAN_IP>:8000/api/v1`).
- **Android Emulator**: Press `a` in the terminal.

---

## 🧪 Testing & Verification

### Running Automated Backend Tests
Run the complete pytest test suite:
```powershell
cd "d:\StudyMate AI\backend"
.\venv\Scripts\python.exe -m pytest -v
```
All 17 automated tests cover authentication, multi-tenant user isolation, PDF extraction & chunking, vector similarity, RAG QA, backend quiz grading, and task/analytics calculations.

### Running Live End-to-End Flow
Verify all live HTTP endpoints against the running server and PostgreSQL database:
```powershell
cd "d:\StudyMate AI\backend"
.\venv\Scripts\python.exe -c "import requests; print(requests.get('http://localhost:8000/api/health').json())"
```

---

## 🔑 Default Demo User
- **Email**: `alex.morgan@university.edu`
- **Password**: `password123`

---

## 🔒 Security Hardening
- **Authentication**: JWT tokens stored securely via AsyncStorage and validated on every protected API endpoint.
- **Passwords**: Hashed with bcrypt before storage; plain passwords never stored or logged.
- **Multi-Tenant Isolation**: All database queries enforce `user_id == current_user.id` to prevent cross-user data leakage.
- **File Upload Protection**: Content type validation, size limits (20MB), and sanitized storage paths.
