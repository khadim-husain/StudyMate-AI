@echo off
title StudyMate AI - Public Tunnel (Port 8000)
echo ========================================================
echo     StudyMate AI - Cloudflare Public Tunnel
echo ========================================================
echo.
echo Forwarding FastAPI Backend (Port 8000) to global HTTPS...
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:8000
pause
