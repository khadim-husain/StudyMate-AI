@echo off
title StudyMate AI - Frontend Expo Server
cd /d "%~dp0mobile"
echo ========================================================
echo        StudyMate AI - Expo Mobile Server
echo ========================================================
echo.
echo Starting Expo Metro server on port 8081...
call npx expo start
pause
