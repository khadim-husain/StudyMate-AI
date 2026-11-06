@echo off
title StudyMate AI - Backend Server
cd /d "%~dp0backend"
echo ========================================================
echo        StudyMate AI - FastAPI Backend Server
echo ========================================================
echo.
echo Activating virtual environment...
call .\venv\Scripts\activate.bat
echo Running database migrations...
call .\venv\Scripts\alembic.exe upgrade head
echo Starting Uvicorn API server on http://localhost:8000...
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
