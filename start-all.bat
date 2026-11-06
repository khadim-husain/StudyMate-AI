@echo off
title StudyMate AI - Launcher
echo ========================================================
echo             StudyMate AI - Full Stack Launcher
echo ========================================================
echo.
echo [1/3] Launching Backend Server (FastAPI on Port 8000)...
start "StudyMate AI - Backend" cmd /k "call "%~dp0start-backend.bat""
ping 127.0.0.1 -n 3 >nul

echo [2/3] Launching Public Tunnel for Mobile Devices...
start "StudyMate AI - API Tunnel" cmd /k "call "%~dp0start-tunnel.bat""
ping 127.0.0.1 -n 2 >nul

echo [3/3] Launching Frontend Server (Expo on Port 8081)...
start "StudyMate AI - Frontend" cmd /k "call "%~dp0start-mobile.bat""
echo.
echo ========================================================
echo All servers are running!
echo - Web App URL:         http://localhost:8081
echo - Backend API Docs:    http://localhost:8000/docs
echo - Public API Tunnel:   https://studymate-ai-api.loca.lt
echo ========================================================
echo.
